import { NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionId, userAnswer, userId } = body

    if (!questionId || !userAnswer || !userId) {
      return NextResponse.json(
        { error: "questionId, userAnswer, and userId are required" },
        { status: 400 }
      )
    }

    // 获取问题信息
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        round: {
          include: {
            interview: true
          }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // 验证用户权限
    if (question.round.interview.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // 准备AI评估请求
    // 映射questionType到AI服务期望的格式
    let mappedQuestionType: 'CODING' | 'BEHAVIORAL' | 'SYSTEM_DESIGN'
    switch (question.type) {
      case 'CODING':
      case 'ALGORITHM':
        mappedQuestionType = 'CODING'
        break
      case 'BEHAVIORAL':
        mappedQuestionType = 'BEHAVIORAL'
        break
      case 'SYSTEM_DESIGN':
      case 'TECHNICAL_KNOWLEDGE':
        mappedQuestionType = 'SYSTEM_DESIGN'
        break
      default:
        mappedQuestionType = 'CODING'
    }
    
    const evaluationRequest = {
      question: question.content,
      userAnswer,
      modelAnswer: question.modelAnswer || undefined,
      questionType: mappedQuestionType
    }

    // 调用AI服务进行评估
    const aiService = new AIService()
    const evaluation = await aiService.evaluateAnswer(evaluationRequest)

    // 更新问题的用户答案和评分
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        userAnswer,
        score: evaluation.score,
        feedback: evaluation.feedback
      }
    })

    // 生成后续追问（如果需要）
    let followUpQuestions: string[] = []
    if (evaluation.score < 80) { // 如果分数较低，生成追问
      try {
        followUpQuestions = await aiService.generateFollowUpQuestions(
          question.content,
          userAnswer,
          { questionType: question.type }
        )
      } catch (error) {
        console.warn('Failed to generate follow-up questions:', error)
      }
    }

    // 检查轮次是否完成
    const roundQuestions = await prisma.question.findMany({
      where: { roundId: question.roundId }
    })

    const answeredQuestions = roundQuestions.filter(q => q.userAnswer && q.score !== null)
    const roundCompleted = answeredQuestions.length === roundQuestions.length

    if (roundCompleted) {
      // 计算轮次平均分
      const averageScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length

      // 更新轮次信息
      await prisma.interviewRound.update({
        where: { id: question.roundId },
        data: {
          score: averageScore,
          feedback: `本轮面试平均得分: ${averageScore.toFixed(1)}分`
        }
      })

      // 检查是否需要生成面试报告
      const interview = question.round.interview
      if (interview.status !== 'COMPLETED') {
        await prisma.interview.update({
          where: { id: interview.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })

        // 生成面试报告
        await generateInterviewReport(interview.id, evaluation)
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        suggestedResources: evaluation.suggestedResources
      },
      followUpQuestions,
      roundCompleted,
      nextQuestionId: roundCompleted ? null : getNextQuestionId(roundQuestions, questionId)
    })

  } catch (error) {
    console.error('Answer evaluation error:', error)
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    )
  }
}

async function generateInterviewReport(interviewId: string, lastEvaluation: any) {
  try {
    // 获取面试的所有问题和答案
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        rounds: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!interview) return

    const allQuestions = interview.rounds.flatMap(round => round.questions)
    const answeredQuestions = allQuestions.filter(q => q.score !== null)

    if (answeredQuestions.length === 0) return

    // 计算各项得分
    const overallScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length
    const technicalScore = calculateCategoryScore(answeredQuestions, ['CODING', 'ALGORITHM', 'TECHNICAL_KNOWLEDGE'])
    const communicationScore = calculateCategoryScore(answeredQuestions, ['BEHAVIORAL'])
    const systemDesignScore = calculateCategoryScore(answeredQuestions, ['SYSTEM_DESIGN'])

    // 分析优势和劣势
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendations: string[] = []

    if (overallScore >= 80) {
      strengths.push('整体表现优秀')
    } else if (overallScore >= 60) {
      strengths.push('基础知识扎实')
    }

    if (overallScore < 70) {
      weaknesses.push('需要加强技术深度')
      recommendations.push('建议多做算法练习和系统设计题')
    }

    // 创建面试报告
    await prisma.interviewReport.create({
      data: {
        interviewId,
        overallScore,
        technicalScore,
        communicationScore,
        systemDesignScore,
        strengths,
        weaknesses,
        recommendations,
        detailedAnalysis: {
          totalQuestions: allQuestions.length,
          answeredQuestions: answeredQuestions.length,
          averageScore: overallScore,
          scoreDistribution: {
            excellent: answeredQuestions.filter(q => (q.score || 0) >= 90).length,
            good: answeredQuestions.filter(q => (q.score || 0) >= 70 && (q.score || 0) < 90).length,
            basic: answeredQuestions.filter(q => (q.score || 0) < 70).length
          }
        }
      }
    })

  } catch (error) {
    console.error('Failed to generate interview report:', error)
  }
}

function calculateCategoryScore(questions: any[], types: string[]): number | null {
  const categoryQuestions = questions.filter(q => types.includes(q.type))
  if (categoryQuestions.length === 0) return null
  
  return categoryQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / categoryQuestions.length
}

function getNextQuestionId(questions: any[], currentQuestionId: string): string | null {
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId)
  const nextQuestion = questions.find((q, index) => index > currentIndex && !q.userAnswer)
  return nextQuestion?.id || null
}