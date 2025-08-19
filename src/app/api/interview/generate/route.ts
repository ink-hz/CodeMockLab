import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DeepSeekAI } from "@/lib/deepseek-ai"
import { QuestionType, Difficulty } from "@prisma/client"

// 映射AI返回的问题类型到数据库枚举
function mapQuestionType(aiType: string): QuestionType {
  const type = aiType.toLowerCase()
  switch (type) {
    case 'coding':
    case 'code':
      return QuestionType.CODING
    case 'algorithm':
      return QuestionType.ALGORITHM
    case 'system-design':
    case 'system_design':
    case 'systemdesign':
      return QuestionType.SYSTEM_DESIGN
    case 'behavioral':
      return QuestionType.BEHAVIORAL
    case 'technical':
    case 'technical_knowledge':
    default:
      return QuestionType.TECHNICAL_KNOWLEDGE
  }
}

// 映射AI返回的难度到数据库枚举
function mapDifficulty(aiDifficulty: string): Difficulty {
  const difficulty = aiDifficulty.toLowerCase()
  switch (difficulty) {
    case 'easy':
    case 'simple':
      return Difficulty.EASY
    case 'medium':
    case 'mid':
      return Difficulty.MEDIUM
    case 'hard':
    case 'difficult':
      return Difficulty.HARD
    case 'expert':
    case 'very hard':
      return Difficulty.EXPERT
    default:
      return Difficulty.MEDIUM
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobData } = body

    // 获取用户最新的简历和AI技术画像
    const resume = await prisma.resume.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        aiProfile: {
          include: {
            techStack: {
              orderBy: { valueScore: 'desc' }
            },
            projectAnalysis: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    if (!resume) {
      return NextResponse.json(
        { error: "Please upload your resume first" },
        { status: 400 }
      )
    }

    // 获取用户档案
    const userProfile = await prisma.userProfile.findUnique({
      where: {
        userId: session.user.id
      }
    })

    // 构建简历分析数据（基础版本）
    const resumeProfile = {
      techKeywords: resume.techKeywords || [],
      experienceLevel: userProfile?.experienceLevel || "MID",
      projects: (resume.projects || []).map((project: any) => ({
        name: project.name || '',
        description: project.description || '',
        technologies: project.technologies || [],
        role: project.role || '',
        duration: project.duration,
        achievements: project.achievements
      })),
      workExperience: (resume.workExperience || []).map((work: any) => ({
        company: work.company || '',
        position: work.position || '',
        duration: work.duration || '',
        description: work.description || '',
        technologies: work.technologies
      }))
    }

    // 获取AI技术画像数据（增强版本）
    const aiProfile = resume.aiProfile ? {
      experienceLevel: resume.aiProfile.experienceLevel,
      experienceLevelConfidence: resume.aiProfile.experienceLevelConfidence,
      specializations: resume.aiProfile.specializations,
      techHighlights: resume.aiProfile.techHighlights,
      techStack: resume.aiProfile.techStack,
      projectAnalysis: resume.aiProfile.projectAnalysis,
      roleMatchingAnalysis: resume.aiProfile.roleMatchingAnalysis,
      skillAssessment: resume.aiProfile.skillAssessment,
      careerSuggestions: resume.aiProfile.careerSuggestions
    } : null

    console.log("=== 面试问题生成 ===")
    console.log(`使用AI技术画像: ${aiProfile ? '是' : '否'}`)
    if (aiProfile) {
      console.log(`AI评估等级: ${aiProfile.experienceLevel}`)
      console.log(`技术专长: ${aiProfile.specializations?.join(', ')}`)
      console.log(`核心技术栈: ${aiProfile.techStack?.slice(0, 5).map((t: any) => t.technology).join(', ')}`)
    }

    // 构建岗位数据
    const jobProfile = {
      company: jobData?.company || "",
      position: jobData?.position || "",
      level: jobData?.level || "mid",
      requirements: jobData?.requirements || []
    }

    // 使用DeepSeek AI智能生成面试问题（集成AI技术画像）
    const deepseek = new DeepSeekAI()
    const questions = await deepseek.generateInterviewQuestions(
      resumeProfile,
      jobProfile,
      aiProfile, // 传入AI技术画像数据
      5 // 生成5道题
    )

    // 创建面试记录
    const interview = await prisma.interview.create({
      data: {
        userId: session.user.id,
        type: "TECHNICAL",
        status: "IN_PROGRESS",
        startedAt: new Date()
      }
    })

    // 创建面试轮次
    const round = await prisma.interviewRound.create({
      data: {
        interviewId: interview.id,
        roundNumber: 1,
        type: "CODING"
      }
    })

    // 保存问题到数据库
    const savedQuestions = await Promise.all(
      questions.map((q, index) =>
        prisma.question.create({
          data: {
            roundId: round.id,
            content: q.content,
            type: mapQuestionType(q.type),
            difficulty: mapDifficulty(q.difficulty),
            category: q.topics ? q.topics.join(", ") : "技术面试",
            score: 0,
            feedback: q.evaluationCriteria || "",
            followUps: q.followUps || []
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      questions: savedQuestions.map(q => ({
        id: q.id,
        content: q.content,
        type: q.type.toLowerCase(),
        difficulty: q.difficulty.toLowerCase(),
        category: q.category
      }))
    })
  } catch (error) {
    console.error("=== 面试问题生成失败 ===")
    console.error("错误类型:", error.constructor.name)
    console.error("错误信息:", error.message)
    console.error("完整错误:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to generate interview questions", 
        details: error.message,
        type: error.constructor.name 
      },
      { status: 500 }
    )
  }
}