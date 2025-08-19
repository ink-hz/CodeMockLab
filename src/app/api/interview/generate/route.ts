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
    case 'scenario':
      return QuestionType.SCENARIO
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
    const { jobData, mode } = body

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
      careerSuggestions: resume.aiProfile.careerSuggestions,
      simulatedInterview: resume.aiProfile.simulatedInterview  // 🔥 关键字段！
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

    // 1. 根据模式决定是否实时生成新问题
    let newQuestions: any[] = []
    if (mode !== 'ai-bank-only') {
      // 非纯题库模式：使用DeepSeek AI生成3道基于岗位的新问题
      const deepseek = new DeepSeekAI()
      newQuestions = await deepseek.generateInterviewQuestions(
        resumeProfile,
        jobProfile,
        aiProfile, // 传入AI技术画像数据
        3 // 生成3道新题目
      )
    }

    console.log("=== 整合AI简历分析题库 ===")
    console.log("模式:", mode || 'default')
    console.log("新生成问题数量:", newQuestions.length)
    
    // 2. 获取AI简历分析生成的题库
    let aiBankQuestions: any[] = []
    if (aiProfile?.simulatedInterview) {
      console.log("发现AI分析题库，开始整合...")
      const interview = aiProfile.simulatedInterview
      console.log("simulatedInterview数据结构:", Object.keys(interview))
      
      // 提取各类别的题目，转换为统一格式
      const categories = [
        { key: 'architectureDesign', type: 'system-design', name: '系统架构设计' },
        { key: 'systemDesign', type: 'system-design', name: '系统设计' },
        { key: 'algorithmCoding', type: 'coding', name: '算法编程' },
        { key: 'problemSolving', type: 'technical', name: '问题解决' },
        { key: 'projectExperience', type: 'behavioral', name: '项目经验' },
        { key: 'industryInsight', type: 'technical', name: '行业洞察' },
        { key: 'leadership', type: 'behavioral', name: '领导力管理' }
      ]
      
      categories.forEach(category => {
        if (interview[category.key] && Array.isArray(interview[category.key])) {
          console.log(`处理${category.key}: ${interview[category.key].length}道题`)
          interview[category.key].forEach((question: string, index: number) => {
            aiBankQuestions.push({
              id: `ai-${category.key}-${index}`,
              content: question,
              type: category.type,
              difficulty: 'medium', // AI题库默认中等难度
              topics: [category.name],
              source: 'ai-bank',
              originalCategory: category.name
            })
          })
        } else {
          console.log(`跳过${category.key}: 不存在或非数组`)
        }
      })
      
      // 处理技术深度题目（嵌套结构）
      if (interview.techDepth && typeof interview.techDepth === 'object') {
        console.log("处理techDepth:", Object.keys(interview.techDepth))
        Object.entries(interview.techDepth).forEach(([tech, questions]: [string, any]) => {
          if (Array.isArray(questions)) {
            console.log(`处理${tech}技术深度: ${questions.length}道题`)
            questions.forEach((question: string, index: number) => {
              aiBankQuestions.push({
                id: `ai-tech-${tech}-${index}`,
                content: question,
                type: 'technical',
                difficulty: 'hard', // 技术深度题标记为困难
                topics: [tech, '技术深度'],
                source: 'ai-bank',
                originalCategory: `${tech}技术深度`
              })
            })
          } else {
            console.log(`跳过${tech}: questions不是数组`, typeof questions)
          }
        })
      } else {
        console.log("跳过techDepth: 不存在或非对象", typeof interview.techDepth)
      }
      
      console.log("AI题库问题数量:", aiBankQuestions.length)
      console.log("题库类别分布:", aiBankQuestions.reduce((acc: any, q) => {
        acc[q.originalCategory] = (acc[q.originalCategory] || 0) + 1
        return acc
      }, {}))
    }
    
    // 3. 合并两部分题目：新生成题目 + AI题库题目
    const allQuestions = [
      ...newQuestions.map(q => ({ ...q, source: 'generated' })),
      ...aiBankQuestions
    ]
    
    console.log("总题目数量:", allQuestions.length)
    console.log("新生成:", newQuestions.length, "AI题库:", aiBankQuestions.length)

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

    // 保存问题到数据库 - 使用合并后的题目
    const savedQuestions = await Promise.all(
      allQuestions.map((q, index) =>
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
      questions: savedQuestions.map((q, index) => {
        const originalQ = allQuestions[index]
        return {
          id: q.id,
          content: q.content,
          type: q.type.toLowerCase(),
          difficulty: q.difficulty.toLowerCase(),
          category: q.category,
          source: originalQ.source || 'generated', // 标记题目来源
          originalCategory: originalQ.category, // AI题库的原始分类
          topics: originalQ.topics || []
        }
      })
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