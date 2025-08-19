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

    console.log("=== 开始异步生成最佳答案 ===")
    console.log("面试ID:", interviewId)

    // 获取面试的所有问题
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        rounds: {
          include: {
            questions: {
              where: {
                modelAnswer: null // 只获取还没有生成最佳答案的题目
              }
            }
          }
        }
      }
    })

    if (!interview || interview.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Interview not found or access denied" },
        { status: 404 }
      )
    }

    // 获取所有需要生成最佳答案的问题
    const allQuestions = interview.rounds.flatMap(round => round.questions)
    console.log(`需要生成最佳答案的题目数量: ${allQuestions.length}`)

    if (allQuestions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "所有题目的最佳答案已生成完毕",
        processedCount: 0
      })
    }

    // 异步生成最佳答案 - 不阻塞主线程
    generateBestAnswersAsync(allQuestions)

    return NextResponse.json({
      success: true,
      message: `已开始异步生成${allQuestions.length}道题目的最佳答案`,
      totalQuestions: allQuestions.length
    })

  } catch (error) {
    console.error("Generate best answers error:", error)
    return NextResponse.json(
      { error: "Failed to start best answer generation" },
      { status: 500 }
    )
  }
}

// 异步生成最佳答案的函数
async function generateBestAnswersAsync(questions: any[]) {
  const deepseek = new DeepSeekAI()
  let processedCount = 0

  console.log("=== 异步生成最佳答案开始 ===")
  
  // 批量处理，每5题为一批，避免API并发过多
  const batchSize = 5
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)
    
    // 并行处理当前批次
    const promises = batch.map(async (question) => {
      try {
        console.log(`生成最佳答案: ${question.content.substring(0, 50)}...`)
        
        // 构建topics数组
        const topics = question.category ? [question.category] : []
        
        const bestAnswer = await deepseek.generateBestAnswer(
          question.content,
          question.type,
          question.difficulty,
          topics
        )

        // 更新数据库
        await prisma.question.update({
          where: { id: question.id },
          data: { modelAnswer: bestAnswer }
        })

        console.log(`✅ 题目 ${question.id} 最佳答案生成完成`)
        return true
      } catch (error) {
        console.error(`❌ 题目 ${question.id} 最佳答案生成失败:`, error)
        
        // 记录失败原因到数据库
        await prisma.question.update({
          where: { id: question.id },
          data: { modelAnswer: "最佳答案生成失败，请稍后重试" }
        }).catch(e => console.error("Failed to save error message:", e))
        
        return false
      }
    })

    // 等待当前批次完成
    const results = await Promise.all(promises)
    processedCount += results.filter(r => r).length
    
    console.log(`批次 ${Math.floor(i/batchSize) + 1} 完成，成功: ${results.filter(r => r).length}/${results.length}`)
    
    // 批次间暂停500ms，避免API频率限制
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`=== 异步生成最佳答案完成 ===`)
  console.log(`总计处理: ${questions.length} 道题目`)
  console.log(`成功生成: ${processedCount} 个最佳答案`)
}