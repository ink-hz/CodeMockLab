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

    const body = await request.json()
    const { questionId, answer, interviewId } = body

    // 获取问题信息（包括关联的轮次）
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        round: true
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // 使用DeepSeek AI评估答案
    const deepseek = new DeepSeekAI()
    const evaluation = await deepseek.evaluateAnswer(
      question.content,
      answer,
      question.type,
      [] // 暂时不使用预期关键词
    )

    // 保存答案和评估结果
    await prisma.question.update({
      where: { id: questionId },
      data: {
        userAnswer: answer,
        score: evaluation.score,
        feedback: evaluation.feedback
      }
    })

    // 生成追问（如果需要）
    let followUp = null
    if (evaluation.score < 80 && evaluation.score > 40) {
      followUp = await deepseek.generateFollowUp(
        question.content,
        answer,
        { questionType: question.type }
      )
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        suggestions: evaluation.suggestions
      },
      followUp
    })
  } catch (error) {
    console.error("Evaluate answer error:", error)
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    )
  }
}