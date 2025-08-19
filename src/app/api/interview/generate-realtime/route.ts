import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DeepSeekAI } from "@/lib/deepseek-ai"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { jobData, mode } = await request.json()

    if (!jobData) {
      return NextResponse.json(
        { error: "Job data is required" },
        { status: 400 }
      )
    }

    console.log("=== AI实时生成面试题目 ===")
    console.log("用户ID:", session.user.id)
    console.log("生成模式:", mode)
    console.log("岗位信息:", JSON.stringify(jobData, null, 2))

    // 获取用户简历信息
    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id },
      include: {
        aiProfile: {
          include: {
            techStack: true,
            projectAnalysis: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found. Please upload your resume first." },
        { status: 404 }
      )
    }

    console.log("简历ID:", resume.id)
    console.log("AI画像状态:", resume.aiProfile ? "已生成" : "未生成")

    // 构建简历档案
    const resumeProfile = {
      techKeywords: resume.techKeywords || [],
      projects: resume.projects || [],
      workExperience: resume.workExperience || [],
      experienceLevel: "中级" // 默认值
    }

    // 构建岗位档案
    const jobProfile = {
      company: jobData.company || "目标公司",
      position: jobData.position || "软件工程师", 
      level: jobData.level || "中级",
      requirements: jobData.requirements ? [jobData.requirements] : []
    }

    // 构建AI技术画像（仅用于实时生成，不包含内置题库）
    let aiProfile = null
    if (resume.aiProfile) {
      aiProfile = {
        techStack: resume.aiProfile.techStack || [],
        specializations: resume.aiProfile.specializations || [],
        experienceLevel: resume.aiProfile.experienceLevel || "中级",
        experienceLevelConfidence: resume.aiProfile.experienceLevelConfidence || 0.7,
        techHighlights: resume.aiProfile.techHighlights || [],
        projectAnalysis: resume.aiProfile.projectAnalysis || [],
        roleMatchingAnalysis: resume.aiProfile.roleMatchingAnalysis || {}
        // 注意：不包含simulatedInterview字段，实时生成模式不使用内置题库
      }
    }

    console.log("技术画像概览:")
    console.log("- 经验等级:", aiProfile?.experienceLevel)
    console.log("- 专长领域:", aiProfile?.specializations?.slice(0, 3))
    console.log("- 技术栈数量:", aiProfile?.techStack?.length || 0)

    // 使用DeepSeek AI生成面试题目（5道）
    const deepseekAI = new DeepSeekAI()
    const questions = await deepseekAI.generateInterviewQuestions(
      resumeProfile,
      jobProfile, 
      aiProfile,
      5 // 实时生成模式生成5道题目
    )

    console.log("实时生成题目数量:", questions.length)

    if (!questions || questions.length === 0) {
      throw new Error("Failed to generate questions")
    }

    // 创建面试记录
    const interview = await prisma.interview.create({
      data: {
        userId: session.user.id,
        type: "TECHNICAL",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        rounds: {
          create: {
            roundNumber: 1,
            type: "CODING"  // 使用有效的 RoundType 枚举值
          }
        }
      },
      include: {
        rounds: true
      }
    })

    console.log("面试记录已创建，ID:", interview.id)

    // 类型转换函数：将AI返回的类型转换为数据库枚举类型
    const mapQuestionType = (aiType: string): string => {
      const typeMapping: Record<string, string> = {
        "technical": "TECHNICAL_KNOWLEDGE",
        "behavioral": "BEHAVIORAL", 
        "system-design": "SYSTEM_DESIGN",
        "coding": "CODING",
        "scenario": "SCENARIO"
      }
      return typeMapping[aiType] || "TECHNICAL_KNOWLEDGE"
    }

    const mapDifficulty = (aiDifficulty: string): string => {
      const difficultyMapping: Record<string, string> = {
        "easy": "EASY",
        "medium": "MEDIUM", 
        "hard": "HARD"
      }
      return difficultyMapping[aiDifficulty] || "MEDIUM"
    }

    // 保存题目到数据库
    const savedQuestions = await Promise.all(
      questions.map(async (question, index) => {
        return prisma.question.create({
          data: {
            roundId: interview.rounds[0].id,
            content: question.content,
            type: mapQuestionType(question.type || "technical"),
            difficulty: mapDifficulty(question.difficulty || "medium"), 
            category: "ai-realtime", // 标记为实时生成
            followUps: question.followUps || []
          }
        })
      })
    )

    console.log("题目已保存到数据库")

    // 异步生成最佳答案
    console.log("开始异步生成最佳答案...")
    generateBestAnswersAsync(savedQuestions, session.user.id)

    // 返回结果
    const response = {
      success: true,
      questions: savedQuestions.map((q, index) => ({
        id: q.id,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        topics: questions[index]?.topics || [],
        source: "ai-generate",
        category: "ai-realtime"
      })),
      interviewId: interview.id,
      mode: "ai-generate",
      generatedCount: savedQuestions.length
    }

    console.log("实时生成完成，返回结果")
    return NextResponse.json(response)

  } catch (error) {
    console.error("=== AI实时生成失败 ===")
    console.error("错误类型:", error.constructor.name)
    console.error("错误信息:", error.message)
    console.error("完整错误:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to generate questions", 
        details: error.message,
        type: error.constructor.name 
      },
      { status: 500 }
    )
  }
}

// 异步生成最佳答案（不阻塞主流程）
async function generateBestAnswersAsync(questions: any[], userId: string) {
  console.log("=== 开始异步生成最佳答案 ===")
  console.log(`处理 ${questions.length} 道题目`)
  
  const deepseekAI = new DeepSeekAI()
  const batchSize = 3 // 每批处理3道题目
  let successCount = 0

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)
    console.log(`处理批次 ${Math.floor(i/batchSize) + 1}，题目 ${i + 1}-${Math.min(i + batchSize, questions.length)}`)

    const promises = batch.map(async (question) => {
      try {
        console.log(`生成最佳答案: ${question.content.substring(0, 50)}...`)
        
        const bestAnswer = await deepseekAI.generateBestAnswer(
          question.content,
          question.type,
          question.difficulty,
          []
        )

        await prisma.question.update({
          where: { id: question.id },
          data: { modelAnswer: bestAnswer }
        })

        console.log(`✅ 题目 ${question.id} 最佳答案生成完成`)
        return true
      } catch (error) {
        console.error(`❌ 题目 ${question.id} 最佳答案生成失败:`, error.message)
        return false
      }
    })

    const results = await Promise.all(promises)
    const batchSuccess = results.filter(r => r).length
    successCount += batchSuccess
    
    console.log(`批次 ${Math.floor(i/batchSize) + 1} 完成，成功: ${batchSuccess}/${batch.length}`)
  }

  console.log("=== 异步生成最佳答案完成 ===")
  console.log(`总计处理: ${questions.length} 道题目`)
  console.log(`成功生成: ${successCount} 个最佳答案`)
}