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

    console.log("=== 生成完整题目报告 ===")
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
                targetCompany: true,
                targetPosition: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    console.log(`生成报告，题目数量: ${questions.length}`)

    // 计算统计数据
    const totalQuestions = questions.length
    const answeredQuestions = questions.filter(q => q.userAnswer?.trim()).length
    const scoredQuestions = questions.filter(q => q.score !== null)
    const avgScore = scoredQuestions.length > 0 
      ? scoredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / scoredQuestions.length
      : 0

    // 按难度统计
    const byDifficulty = questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 按分类统计
    const byCategory = questions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 生成HTML报告
    const reportDate = new Date().toLocaleString('zh-CN')
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeMockLab - 完整题目报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 2.5em; }
        .header .subtitle { color: #6b7280; font-size: 1.1em; margin-top: 5px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
        .stat-card h3 { margin: 0 0 10px 0; color: #374151; font-size: 1em; }
        .stat-card .number { font-size: 2em; font-weight: bold; color: #2563eb; }
        .question { margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .question-header { background: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; }
        .question-title { font-weight: bold; margin-bottom: 8px; color: #111827; }
        .question-meta { display: flex; gap: 10px; flex-wrap: wrap; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 500; }
        .badge-difficulty { background: #dbeafe; color: #1e40af; }
        .badge-category { background: #f3e8ff; color: #7c3aed; }
        .badge-score { background: #dcfce7; color: #166534; }
        .badge-score.low { background: #fef2f2; color: #dc2626; }
        .question-content { padding: 20px; }
        .answer-section { margin: 15px 0; }
        .answer-section h4 { margin: 0 0 10px 0; color: #374151; font-size: 1em; }
        .my-answer { background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .best-answer { background: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; }
        .feedback { background: #fefce8; padding: 15px; border-radius: 6px; border-left: 4px solid #eab308; margin-top: 10px; }
        .no-answer { color: #6b7280; font-style: italic; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
        .interview-info { background: #f1f5f9; padding: 10px 15px; border-radius: 6px; margin-bottom: 10px; }
        @media (max-width: 768px) {
            .container { padding: 15px; }
            .stats { grid-template-columns: 1fr 1fr; }
            .question-meta { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 完整题目报告</h1>
            <div class="subtitle">生成时间: ${reportDate}</div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3>📚 总题目数</h3>
                <div class="number">${totalQuestions}</div>
            </div>
            <div class="stat-card">
                <h3>✅ 已回答</h3>
                <div class="number">${answeredQuestions}</div>
            </div>
            <div class="stat-card">
                <h3>📊 平均分</h3>
                <div class="number">${avgScore.toFixed(1)}</div>
            </div>
            <div class="stat-card">
                <h3>📈 完成度</h3>
                <div class="number">${Math.round((answeredQuestions / totalQuestions) * 100)}%</div>
            </div>
        </div>

        <div class="questions">
            ${questions.map((question, index) => {
              const score = question.score || 0
              const scoreClass = score >= 80 ? '' : 'low'
              const source = question.category?.includes('architectureDesign') || 
                           question.category?.includes('techDepth') || 
                           question.category?.includes('algorithmCoding') ||
                           question.category?.includes('systemDesign') ||
                           question.category?.includes('leadership') ||
                           question.category?.includes('problemSolving') ||
                           question.category?.includes('projectExperience') ||
                           question.category?.includes('industryInsight')
                           ? 'AI题库' 
                           : 'AI生成'

              return `
                <div class="question">
                    <div class="question-header">
                        <div class="question-title">题目 ${index + 1}: ${question.content}</div>
                        <div class="interview-info">
                            🏢 ${question.round.interview.targetCompany} - ${question.round.interview.targetPosition} | 
                            📅 ${new Date(question.createdAt).toLocaleString('zh-CN')}
                        </div>
                        <div class="question-meta">
                            <span class="badge badge-difficulty">${question.difficulty}</span>
                            <span class="badge badge-category">${question.category}</span>
                            <span class="badge badge-category">${source}</span>
                            ${question.score !== null ? `<span class="badge badge-score ${scoreClass}">${question.score}分</span>` : ''}
                        </div>
                    </div>
                    <div class="question-content">
                        ${question.userAnswer ? `
                            <div class="answer-section">
                                <h4>💭 我的答案</h4>
                                <div class="my-answer">${question.userAnswer.replace(/\n/g, '<br>')}</div>
                                ${question.feedback ? `
                                    <div class="feedback">
                                        <strong>🤖 AI反馈:</strong> ${question.feedback}
                                    </div>
                                ` : ''}
                            </div>
                        ` : '<div class="no-answer">⏳ 尚未回答</div>'}
                        
                        ${question.modelAnswer ? `
                            <div class="answer-section">
                                <h4>⭐ AI最佳答案</h4>
                                <div class="best-answer">${question.modelAnswer.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
              `
            }).join('')}
        </div>

        <div class="footer">
            <p>📈 本报告由 <strong>CodeMockLab</strong> AI驱动的面试系统生成</p>
            <p>🚀 继续练习，不断提升您的面试技能！</p>
        </div>
    </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="CodeMockLab-完整题目报告-${new Date().toISOString().split('T')[0]}.html"`
      }
    })

  } catch (error) {
    console.error("=== 生成完整报告失败 ===")
    console.error("错误类型:", error.constructor.name)
    console.error("错误信息:", error.message)
    console.error("完整错误:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to generate report", 
        details: error.message,
        type: error.constructor.name 
      },
      { status: 500 }
    )
  }
}