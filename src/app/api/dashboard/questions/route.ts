import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("=== 获取用户所有题目数据 ===")
    console.log(`用户ID: ${session.user.id}`)

    // 获取用户所有题目数据
    const questions = await prisma.question.findMany({
      where: {
        round: {
          interview: {
            userId: session.user.id
          }
        }
      },
      include: {
        round: {
          include: {
            interview: {
              select: {
                id: true,
                createdAt: true,
                jobPosition: {
                  select: {
                    company: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    console.log(`找到题目数量: ${questions.length}`)

    // 格式化题目数据
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      content: question.content,
      type: question.type,
      difficulty: question.difficulty,
      category: question.category,
      source: question.category?.includes('architectureDesign') || 
               question.category?.includes('techDepth') || 
               question.category?.includes('algorithmCoding') ||
               question.category?.includes('systemDesign') ||
               question.category?.includes('leadership') ||
               question.category?.includes('problemSolving') ||
               question.category?.includes('projectExperience') ||
               question.category?.includes('industryInsight')
               ? 'ai-bank' 
               : 'generated',
      userAnswer: question.userAnswer,
      modelAnswer: question.modelAnswer,
      score: question.score,
      feedback: question.feedback,
      hasAnswer: question.userAnswer !== null && question.userAnswer.trim().length > 0,
      hasEvaluation: question.score !== null && question.feedback !== null,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      interview: {
        id: question.round.interview.id,
        targetCompany: question.round.interview.jobPosition?.company || "未知公司",
        targetPosition: question.round.interview.jobPosition?.title || "未知职位",
        createdAt: question.round.interview.createdAt.toISOString()
      }
    }))

    // 计算统计数据
    const totalQuestions = formattedQuestions.length
    const answeredQuestions = formattedQuestions.filter(q => q.hasAnswer).length
    const scoredQuestions = formattedQuestions.filter(q => q.score !== null)
    const avgScore = scoredQuestions.length > 0 
      ? scoredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / scoredQuestions.length
      : 0

    // 按难度统计
    const byDifficulty = formattedQuestions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 按分类统计
    const byCategory = formattedQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 按来源统计
    const bySource = formattedQuestions.reduce((acc, q) => {
      acc[q.source] = (acc[q.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const stats = {
      totalQuestions,
      answeredQuestions,
      avgScore,
      byDifficulty,
      byCategory,
      bySource
    }

    console.log("统计数据:", stats)

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      stats
    })

  } catch (error) {
    console.error("=== 获取题目数据失败 ===")
    console.error("错误类型:", error.constructor.name)
    console.error("错误信息:", error.message)
    console.error("完整错误:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch questions data", 
        details: error.message,
        type: error.constructor.name 
      },
      { status: 500 }
    )
  }
}