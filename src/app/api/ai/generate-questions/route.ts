import { NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, jobPositionId, interviewType, difficulty = 'MEDIUM', questionCount = 5 } = body

    if (!userId || !interviewType) {
      return NextResponse.json(
        { error: "userId and interviewType are required" },
        { status: 400 }
      )
    }

    // 获取用户画像
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            resumes: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    // 获取职位信息（如果提供）
    let jobPosition = null
    if (jobPositionId) {
      jobPosition = await prisma.jobPosition.findUnique({
        where: { id: jobPositionId }
      })
    }

    // 构建默认职位信息
    const defaultJobPosition = {
      company: "技术公司",
      title: "软件工程师",
      level: userProfile.experienceLevel,
      requirements: userProfile.techStack
    }

    // 准备AI请求数据
    const aiRequest = {
      jobPosition: jobPosition || defaultJobPosition,
      userProfile: {
        techStack: userProfile.techStack,
        projects: userProfile.user.resumes[0]?.projects || [],
        experienceLevel: userProfile.experienceLevel
      },
      interviewType,
      difficulty,
      questionCount
    }

    // 调用AI服务生成问题
    const aiService = new AIService()
    const questions = await aiService.generateQuestions(aiRequest)

    // 创建面试记录
    const interview = await prisma.interview.create({
      data: {
        userId,
        jobPositionId,
        type: interviewType,
        status: 'SCHEDULED'
      }
    })

    // 创建面试轮次
    const round = await prisma.interviewRound.create({
      data: {
        interviewId: interview.id,
        roundNumber: 1,
        type: interviewType === 'TECHNICAL' ? 'CODING' : 
              interviewType === 'SYSTEM_DESIGN' ? 'SYSTEM_DESIGN' : 'BEHAVIORAL'
      }
    })

    // 保存生成的问题
    const savedQuestions = await Promise.all(
      questions.map((q, index) => 
        prisma.question.create({
          data: {
            roundId: round.id,
            content: q.content,
            type: q.type || 'TECHNICAL_KNOWLEDGE',
            difficulty: q.difficulty || difficulty,
            category: q.category || '技术面试',
            modelAnswer: q.modelAnswer,
            followUps: q.keyPoints || []
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      roundId: round.id,
      questions: savedQuestions.map(q => ({
        id: q.id,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category
      }))
    })

  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
}