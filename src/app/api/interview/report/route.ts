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
    const { interviewId } = body

    // 获取面试信息和所有问题
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        rounds: {
          include: {
            questions: {
              orderBy: { orderIndex: "asc" }
            }
          }
        }
      }
    })

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      )
    }

    // 准备数据（从所有轮次中收集问题）
    const questions = interview.rounds.flatMap(round => round.questions)
    const answers = questions.map(q => q.userAnswer || "")

    // 使用DeepSeek AI生成综合报告
    const deepseek = new DeepSeekAI()
    const report = await deepseek.generateInterviewReport(
      interview,
      questions,
      answers
    )

    // 更新面试记录
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    })

    // 创建面试报告
    const savedReport = await prisma.interviewReport.create({
      data: {
        interviewId: interview.id,
        overallScore: report.overallScore,
        technicalScore: report.technicalScore,
        communicationScore: report.communicationScore,
        problemSolvingScore: report.problemSolvingScore,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        recommendations: report.recommendations,
        detailedAnalysis: {
          hiringRecommendation: report.hiringRecommendation,
          questionScores: questions.map(q => ({
            question: q.content,
            score: q.score,
            feedback: q.feedback
          }))
        } as any
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        id: savedReport.id,
        overallScore: report.overallScore,
        scores: {
          technical: report.technicalScore,
          communication: report.communicationScore,
          problemSolving: report.problemSolvingScore
        },
        strengths: report.strengths,
        improvements: report.weaknesses,
        recommendations: report.recommendations,
        hiringRecommendation: report.hiringRecommendation,
        questionAnalysis: questions.map(q => ({
          question: q.content,
          type: q.type,
          difficulty: q.difficulty,
          score: q.score,
          feedback: q.feedback,
          userAnswer: q.userAnswer
        }))
      }
    })
  } catch (error) {
    console.error("Generate report error:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}