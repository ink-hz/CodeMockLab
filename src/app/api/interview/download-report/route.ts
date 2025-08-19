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

    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get("interviewId")

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      )
    }

    console.log("=== 生成面试报告下载 ===")
    console.log("面试ID:", interviewId)

    // 获取完整的面试数据
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        user: {
          select: { name: true, email: true }
        },
        rounds: {
          include: {
            questions: {
              orderBy: { createdAt: 'asc' }
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

    // 获取所有问题和答案
    const allQuestions = interview.rounds.flatMap(round => round.questions)
    
    // 构建报告数据
    const reportData = {
      interviewInfo: {
        id: interview.id,
        userName: interview.user.name || "用户",
        userEmail: interview.user.email,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        totalQuestions: allQuestions.length,
        answeredQuestions: allQuestions.filter(q => q.userAnswer).length
      },
      questions: allQuestions.map((question, index) => ({
        questionNumber: index + 1,
        question: question.content,
        type: question.type,
        difficulty: question.difficulty,
        category: question.category,
        userAnswer: question.userAnswer || "未回答",
        score: question.score || 0,
        feedback: question.feedback || "未评估",
        bestAnswer: question.modelAnswer || "最佳答案生成中...",
        source: question.category?.includes("技术深度") ? "AI题库" : 
               (question.category?.includes("系统") || 
                question.category?.includes("算法") || 
                question.category?.includes("项目") || 
                question.category?.includes("行业") || 
                question.category?.includes("领导力")) ? "AI题库" : "实时生成"
      })),
      statistics: {
        averageScore: allQuestions.filter(q => q.score).length > 0 
          ? Math.round(allQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / allQuestions.filter(q => q.score).length)
          : 0,
        questionsByType: allQuestions.reduce((acc: Record<string, number>, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1
          return acc
        }, {}),
        questionsByDifficulty: allQuestions.reduce((acc: Record<string, number>, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
          return acc
        }, {}),
        answeredCount: allQuestions.filter(q => q.userAnswer).length,
        totalCount: allQuestions.length,
        completionRate: Math.round((allQuestions.filter(q => q.userAnswer).length / allQuestions.length) * 100)
      }
    }

    console.log(`生成报告数据: ${allQuestions.length}道题目`)
    
    // 生成HTML格式报告
    const htmlReport = generateHTMLReport(reportData)
    
    // 设置响应头为HTML下载
    const fileName = `面试报告_${interview.user.name}_${new Date().toISOString().split('T')[0]}.html`
    
    return new NextResponse(htmlReport, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error("Download report error:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

function generateHTMLReport(data: any): string {
  const { interviewInfo, questions, statistics } = data
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeMockLab 面试报告 - ${interviewInfo.userName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .report-header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .report-header p {
            margin: 5px 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-card .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        
        .questions-section {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 30px 0;
        }
        
        .question-item {
            border-bottom: 1px solid #eee;
            padding: 30px 0;
            page-break-inside: avoid;
        }
        
        .question-item:last-child {
            border-bottom: none;
        }
        
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .question-number {
            background: #667eea;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .question-meta {
            display: flex;
            gap: 10px;
        }
        
        .tag {
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.85em;
            font-weight: 500;
        }
        
        .tag.type { background: #e3f2fd; color: #1976d2; }
        .tag.difficulty-easy { background: #e8f5e8; color: #2e7d32; }
        .tag.difficulty-medium { background: #fff3e0; color: #f57c00; }
        .tag.difficulty-hard { background: #ffebee; color: #d32f2f; }
        .tag.source-ai { background: #f3e5f5; color: #7b1fa2; }
        .tag.source-generated { background: #e0f2f1; color: #00695c; }
        
        .question-content {
            font-size: 1.1em;
            color: #333;
            margin: 20px 0;
            line-height: 1.7;
        }
        
        .answer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0;
        }
        
        .answer-block {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
        }
        
        .answer-block h4 {
            margin: 0 0 15px 0;
            color: #555;
            font-size: 1em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .user-answer { border-left: 4px solid #ff9800; }
        .best-answer { border-left: 4px solid #4caf50; }
        
        .answer-text {
            white-space: pre-wrap;
            line-height: 1.6;
            color: #666;
        }
        
        .score-feedback {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .score-feedback h4 {
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        
        .score {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .feedback-text {
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .report-footer {
            text-align: center;
            margin: 50px 0;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .report-footer p {
            color: #666;
            margin: 5px 0;
        }
        
        @media print {
            body { background: white; }
            .report-header, .questions-section, .report-footer {
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1>🎯 面试报告</h1>
        <p><strong>${interviewInfo.userName}</strong> (${interviewInfo.userEmail})</p>
        <p>面试时间: ${new Date(interviewInfo.startedAt).toLocaleString('zh-CN')}</p>
        <p>总计 ${interviewInfo.totalQuestions} 道题目 | 完成 ${interviewInfo.answeredQuestions} 道 | 完成率 ${statistics.completionRate}%</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <h3>平均分数</h3>
            <div class="stat-value">${statistics.averageScore}</div>
        </div>
        <div class="stat-card">
            <h3>完成率</h3>
            <div class="stat-value">${statistics.completionRate}%</div>
        </div>
        <div class="stat-card">
            <h3>题目总数</h3>
            <div class="stat-value">${interviewInfo.totalQuestions}</div>
        </div>
        <div class="stat-card">
            <h3>已回答</h3>
            <div class="stat-value">${interviewInfo.answeredQuestions}</div>
        </div>
    </div>

    <div class="questions-section">
        <h2>📝 面试题目与答案</h2>
        ${questions.map(q => `
            <div class="question-item">
                <div class="question-header">
                    <div class="question-number">${q.questionNumber}</div>
                    <div class="question-meta">
                        <span class="tag type">${q.type.toUpperCase()}</span>
                        <span class="tag difficulty-${q.difficulty}">${q.difficulty.toUpperCase()}</span>
                        <span class="tag source-${q.source === 'AI题库' ? 'ai' : 'generated'}">${q.source}</span>
                    </div>
                </div>
                
                <div class="question-content">
                    <strong>问题：</strong>${q.question}
                </div>
                
                ${q.userAnswer !== "未回答" ? `
                    <div class="answer-section">
                        <div class="answer-block user-answer">
                            <h4>👤 您的回答</h4>
                            <div class="answer-text">${q.userAnswer}</div>
                        </div>
                        <div class="answer-block best-answer">
                            <h4>⭐ 最佳答案</h4>
                            <div class="answer-text">${q.bestAnswer}</div>
                        </div>
                    </div>
                    
                    ${q.feedback !== "未评估" ? `
                        <div class="score-feedback">
                            <h4>🤖 AI评估反馈</h4>
                            <div class="score">得分: ${q.score}/100</div>
                            <div class="feedback-text">${q.feedback}</div>
                        </div>
                    ` : ''}
                ` : `
                    <div class="answer-block">
                        <h4>❌ 未回答</h4>
                        <div class="answer-block best-answer">
                            <h4>⭐ 参考答案</h4>
                            <div class="answer-text">${q.bestAnswer}</div>
                        </div>
                    </div>
                `}
            </div>
        `).join('')}
    </div>

    <div class="report-footer">
        <p><strong>🚀 由 CodeMockLab AI驱动的面试平台生成</strong></p>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p>本报告包含您的面试题目、回答内容、AI评估反馈和最佳答案参考</p>
        <p>建议您根据反馈意见继续学习和提升技术能力</p>
    </div>
</body>
</html>`
}