import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { questionId } = body

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      )
    }

    // 获取题目的详细信息，包括已有的用户答案和AI评估
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        round: {
          interview: {
            userId: session.user.id
          }
        }
      },
      select: {
        id: true,
        content: true,
        type: true,
        difficulty: true,
        category: true,
        userAnswer: true,
        modelAnswer: true,
        score: true,
        feedback: true,
        followUps: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // 判断题目是否已经回答过
    const hasAnswer = question.userAnswer && question.userAnswer.trim().length > 0
    const hasEvaluation = question.score !== null && question.feedback

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        content: question.content,
        type: question.type,
        difficulty: question.difficulty,
        category: question.category,
        userAnswer: question.userAnswer,
        modelAnswer: question.modelAnswer,
        score: question.score,
        feedback: question.feedback,
        followUps: question.followUps || [],
        hasAnswer,
        hasEvaluation,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      }
    })
  } catch (error) {
    console.error("=== 获取题目数据失败 ===")
    console.error("错误类型:", error.constructor.name)
    console.error("错误信息:", error.message)
    console.error("完整错误:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to get question data", 
        details: error.message,
        type: error.constructor.name 
      },
      { status: 500 }
    )
  }
}