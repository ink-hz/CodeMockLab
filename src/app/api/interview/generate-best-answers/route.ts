import { NextRequest, NextResponse } from "next/server"
import { DeepSeekAI } from "@/lib/deepseek-ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionDetails, jobData } = body

    if (!questionDetails || !Array.isArray(questionDetails)) {
      return NextResponse.json(
        { error: "Invalid question details" },
        { status: 400 }
      )
    }

    console.log("=== 生成最佳答案 ===")
    console.log(`为 ${questionDetails.length} 道题生成最佳答案`)

    const deepseek = new DeepSeekAI()
    const bestAnswers = []

    // 为每道题生成最佳答案
    for (const question of questionDetails) {
      try {
        const bestAnswer = await generateBestAnswer(deepseek, question, jobData)
        bestAnswers.push({
          questionId: question.questionId,
          question: question.question,
          bestAnswer,
          userAnswer: question.userAnswer,
          evaluation: question.evaluation
        })
      } catch (error) {
        console.error(`生成问题 ${question.questionId} 的最佳答案失败:`, error)
        // 生成备用答案
        bestAnswers.push({
          questionId: question.questionId,
          question: question.question,
          bestAnswer: generateFallbackAnswer(question),
          userAnswer: question.userAnswer,
          evaluation: question.evaluation
        })
      }
    }

    return NextResponse.json({
      success: true,
      bestAnswers
    })

  } catch (error) {
    console.error("Generate best answers error:", error)
    return NextResponse.json(
      { error: "Failed to generate best answers" },
      { status: 500 }
    )
  }
}

async function generateBestAnswer(deepseek: DeepSeekAI, questionDetail: any, jobData: any): Promise<string> {
  const prompt = `你是一位资深的技术专家，请为以下面试问题提供一个完美的标准答案。

## 面试问题
**问题**: ${questionDetail.question}
**类型**: ${questionDetail.type}
**难度**: ${questionDetail.difficulty}
**分类**: ${questionDetail.category}

## 岗位背景
**公司**: ${jobData?.company || "未知"}
**职位**: ${jobData?.position || "未知"}
**级别**: ${jobData?.level || "未知"}

## 候选人实际回答
${questionDetail.userAnswer}

## 生成要求
请提供一个完美的标准答案，要求：
1. 技术准确性：确保所有技术概念和实现细节都是正确的
2. 结构清晰：逻辑清楚，层次分明
3. 深度适当：符合问题难度和岗位级别要求
4. 实用性强：包含实际项目中的最佳实践
5. 完整全面：覆盖问题的所有关键点

请直接返回最佳答案内容，不需要额外格式：`

  // 调用AI生成最佳答案
  const response = await (deepseek as any).callDeepSeek(prompt, 0.3, 1000)
  return response.trim()
}

function generateFallbackAnswer(questionDetail: any): string {
  const { question, type, difficulty } = questionDetail
  
  if (type === 'technical') {
    return `针对"${question}"这个技术问题，一个完整的答案应该包括：

1. **核心概念解释**: 清晰定义相关技术概念和原理
2. **实现方法**: 详细说明具体的实现步骤和技术要点
3. **最佳实践**: 结合实际项目经验，分享最佳实践和常见陷阱
4. **性能考虑**: 分析性能影响和优化策略
5. **实际应用**: 举例说明在真实项目中的应用场景

建议回答时要有条理，先概述再深入，既要体现技术深度又要展现实践经验。`
  } else if (type === 'system-design') {
    return `对于这个系统设计问题，标准答案应该包含：

1. **需求分析**: 明确功能需求和非功能需求
2. **整体架构**: 设计系统的整体架构和核心组件
3. **技术选型**: 选择合适的技术栈并说明原因
4. **扩展性设计**: 考虑系统的可扩展性和高可用性
5. **数据存储**: 设计合理的数据模型和存储方案
6. **性能优化**: 分析性能瓶颈和优化策略

系统设计题需要展现全局思维和架构能力。`
  } else {
    return `这是一个${type}类型的问题，一个优秀的回答应该：

1. 结构清晰，逻辑性强
2. 结合具体例子和实际经验
3. 展现深度思考和问题解决能力
4. 体现良好的沟通表达能力
5. 符合岗位要求和行业标准

建议在回答时保持自信，条理清楚，并适当展示个人的技术见解。`
  }
}