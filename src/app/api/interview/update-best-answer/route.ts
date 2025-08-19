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
    const { questionId, newAnswer, questionType, difficulty, topics } = body

    if (!questionId || !newAnswer) {
      return NextResponse.json(
        { error: "Question ID and new answer are required" },
        { status: 400 }
      )
    }

    // 获取当前题目数据
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        round: {
          interview: {
            userId: session.user.id
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

    console.log("=== AI最佳答案对比更新 ===")
    console.log(`题目ID: ${questionId}`)
    console.log(`当前最佳答案长度: ${question.modelAnswer?.length || 0}`)
    console.log(`新答案长度: ${newAnswer.length}`)

    const deepseek = new DeepSeekAI()
    
    // 生成新的最佳答案
    const newBestAnswer = await deepseek.generateBestAnswer(
      question.content,
      questionType || question.type,
      difficulty || question.difficulty,
      topics || []
    )

    console.log(`生成的新最佳答案长度: ${newBestAnswer.length}`)

    // 如果没有现有的最佳答案，直接使用新答案
    if (!question.modelAnswer || question.modelAnswer.trim().length === 0) {
      console.log("没有现有最佳答案，直接使用新生成的答案")
      
      await prisma.question.update({
        where: { id: questionId },
        data: { modelAnswer: newBestAnswer }
      })

      return NextResponse.json({
        success: true,
        message: "最佳答案已生成并保存",
        bestAnswer: newBestAnswer,
        updated: true,
        reason: "首次生成"
      })
    }

    // 使用AI对比两个最佳答案的质量
    const comparisonPrompt = `你是一位资深的技术面试专家。请对比以下两个面试问题的答案，选择更好的一个。

## 面试问题
${question.content}

## 答案A（现有最佳答案）
${question.modelAnswer}

## 答案B（新生成答案）
${newBestAnswer}

## 评估标准
请从以下维度对比两个答案：
1. **技术准确性**: 技术概念和实现细节的正确性
2. **完整性**: 答案的全面性和深度
3. **实用性**: 实际应用价值和可操作性
4. **清晰度**: 表达的清晰性和逻辑性
5. **最新性**: 技术内容的时效性

## 输出格式
请严格按照以下JSON格式返回结果：
{
  "betterAnswer": "A" or "B",
  "reason": "详细说明选择理由（100字以内）",
  "improvements": ["改进建议1", "改进建议2"],
  "confidenceScore": 85
}`

    const comparisonResponse = await deepseek.callDeepSeek(comparisonPrompt, 0.3, 800)
    const comparison = deepseek.parseJSONResponse(comparisonResponse)

    if (!comparison || !comparison.betterAnswer) {
      console.log("AI对比失败，保持现有最佳答案")
      return NextResponse.json({
        success: true,
        message: "AI对比失败，保持现有答案",
        bestAnswer: question.modelAnswer,
        updated: false,
        reason: "对比失败"
      })
    }

    console.log(`AI对比结果: ${comparison.betterAnswer} 更好`)
    console.log(`对比理由: ${comparison.reason}`)
    console.log(`置信度: ${comparison.confidenceScore}`)

    // 根据对比结果决定是否更新
    if (comparison.betterAnswer === "B" && comparison.confidenceScore > 70) {
      console.log("新答案更好，更新最佳答案")
      
      await prisma.question.update({
        where: { id: questionId },
        data: { 
          modelAnswer: newBestAnswer,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: `最佳答案已更新：${comparison.reason}`,
        bestAnswer: newBestAnswer,
        updated: true,
        reason: comparison.reason,
        confidenceScore: comparison.confidenceScore,
        improvements: comparison.improvements || []
      })
    } else {
      console.log("现有答案更好或置信度不足，保持不变")
      
      return NextResponse.json({
        success: true,
        message: `保持现有答案：${comparison.reason}`,
        bestAnswer: question.modelAnswer,
        updated: false,
        reason: comparison.reason,
        confidenceScore: comparison.confidenceScore,
        improvements: comparison.improvements || []
      })
    }

  } catch (error) {
    console.error("=== AI最佳答案对比更新失败 ===")
    console.error("错误类型:", error.constructor.name)
    console.error("错误信息:", error.message)
    console.error("完整错误:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to update best answer", 
        details: error.message,
        type: error.constructor.name 
      },
      { status: 500 }
    )
  }
}