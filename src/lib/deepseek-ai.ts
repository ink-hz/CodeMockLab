// DeepSeek AI 服务 - 完全AI驱动的面试系统
import { logger, trackAI } from "@/lib/simple-logger"
import { config, hasAIService } from "@/lib/config"
import { 
  DeepSeekResponse, 
  InterviewQuestion, 
  ResumeProfile, 
  JobProfile, 
  AIProfile,
  EvaluationResult 
} from "@/types"

export class DeepSeekAI {
  private apiKey: string
  private apiUrl: string = "https://api.deepseek.com/v1/chat/completions"
  
  constructor() {
    if (!config.DEEPSEEK_API_KEY) {
      if (!hasAIService()) {
        throw new Error("No AI service configured. Please set DEEPSEEK_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY environment variable.")
      } else {
        throw new Error("DeepSeek API key not configured. Please set DEEPSEEK_API_KEY environment variable.")
      }
    }
    this.apiKey = config.DEEPSEEK_API_KEY
  }

  // 生成个性化面试问题（基于AI技术画像）
  async generateInterviewQuestions(
    resume: ResumeProfile,
    jobData: JobProfile,
    aiProfile: AIProfile | null = null,
    count: number = 5
  ): Promise<InterviewQuestion[]> {
    const prompt = `你是一位资深的技术面试官，拥有10年以上的面试经验。请基于以下信息生成${count}道高质量的技术面试题。

## 🎯 目标岗位分析（主要依据，权重70%）
- 公司：${jobData.company}
- 职位：${jobData.position}
- 级别：${jobData.level}
- 核心技术要求：${jobData.requirements?.join(", ") || "未知"}

## 🤖 AI技术画像分析（智能匹配，权重30%）
${aiProfile ? `
### 经验等级评估
- AI评估等级：${aiProfile.experienceLevel || "中级"}（置信度：${Math.round((aiProfile.experienceLevelConfidence || 0.7) * 100)}%）

### 技术专长领域
- 专业方向：${aiProfile.specializations?.join(", ") || "全栈开发"}

### 核心技术栈（按价值排序）
${aiProfile.techStack?.slice(0, 8).map((tech: any) => 
  `- ${tech.technology} (${tech.category}, ${tech.proficiency}, 价值评分: ${tech.valueScore})`
).join("\n") || "- 未分析到具体技术栈"}

### 技术亮点
${aiProfile.techHighlights?.slice(0, 5).map((highlight: string) => `- ${highlight}`).join("\n") || "- 具备基础技术能力"}

### 项目经验分析
${aiProfile.projectAnalysis?.slice(0, 3).map((project: any) => 
  `- ${project.projectName}：${project.complexity}复杂度，技术栈：${project.techStack?.slice(0, 3).join(", ")}`
).join("\n") || "- 有一定项目经验"}

### 岗位匹配度分析
${aiProfile.roleMatchingAnalysis ? 
  Object.entries(aiProfile.roleMatchingAnalysis)
    .slice(0, 3)
    .map(([role, score]: [string, any]) => `- ${role}: ${score}%匹配`)
    .join("\n") : "- 需要进一步评估匹配度"}
` : `
### 基础简历信息（备用）
- 经验级别：${resume.experienceLevel || "中级"}
- 技术关键词：${resume.techKeywords?.join(", ") || "未知"}
- 项目经验：${resume.projects?.length || 0}个项目
- 工作背景：${resume.workExperience?.map((w: any) => `${w.position} at ${w.company}`).join("; ") || "未知"}
`}

## 📋 智能问题生成策略
1. **优先级原则**：70%的问题必须基于目标岗位的核心技术要求
2. **AI画像适配**：30%的问题基于AI技术画像分析，考虑：
   - 候选人的技术栈价值评分
   - 技术专长领域匹配度
   - 项目复杂度和经验深度
   - AI评估的经验等级
3. **智能难度调节**：
   - AI评估为高级/专家：60%困难，40%中等
   - AI评估为中级：20%简单，50%中等，30%困难  
   - AI评估为初级：40%简单，50%中等，10%困难
4. **匹配度优化**：
   - 高匹配度(80%+)：深度技能考察 + 架构设计能力
   - 中匹配度(60-80%)：核心技能 + 学习适应能力
   - 低匹配度(<60%)：基础能力 + 逻辑思维 + 技术迁移能力

## 🔍 AI驱动的面试重点
${aiProfile ? `
### 基于技术画像的考察重点：
- **核心强项考察**：重点测试${aiProfile.techStack?.slice(0, 3).map((t: any) => t.technology).join("、") || "主要技术栈"}的深度理解
- **专长领域验证**：验证在${aiProfile.specializations?.slice(0, 2).join("、") || "专业领域"}的实际应用能力
- **经验等级匹配**：针对${aiProfile.experienceLevel || "中级"}水平设计合适难度的问题
- **技能迁移评估**：考察从${aiProfile.techStack?.slice(0, 2).map((t: any) => t.technology).join("、") || "现有技术"}向岗位要求技术的学习能力
` : `
### 传统简历分析考察重点：
- 根据简历信息进行基础技能评估
- 重点考察学习能力和适应性
- 通过项目经验验证技术深度
`}

## 📝 问题类型要求
1. 技术深度问题（40%）：基于岗位核心技术的深入探讨
2. 系统设计问题（30%）：考察架构思维和解决问题的能力  
3. 实际应用问题（20%）：结合真实工作场景的问题解决
4. 学习成长问题（10%）：考察适应新技术和持续学习的能力

## 输出格式
请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "questions": [
    {
      "id": "q1",
      "content": "具体的问题描述",
      "type": "technical/behavioral/system-design/coding",
      "difficulty": "easy/medium/hard",
      "topics": ["相关技术点1", "相关技术点2"],
      "expectedKeywords": ["期望答案包含的关键词"],
      "followUps": ["可能的追问1", "可能的追问2"],
      "evaluationCriteria": "评估标准描述"
    }
  ]
}`

    try {
      console.log("=== 调用DeepSeek生成面试问题 ===")
      const response = await this.callDeepSeek(prompt)
      console.log("DeepSeek API响应长度:", response.length)
      console.log("DeepSeek API响应内容:", response.substring(0, 500) + "...")
      
      const parsed = this.parseJSONResponse(response)
      
      if (parsed && parsed.questions) {
        console.log("成功解析到问题数量:", parsed.questions.length)
        return parsed.questions
      }
      
      console.error("解析失败 - parsed:", parsed)
      throw new Error("Failed to parse AI response")
    } catch (error) {
      console.error("=== DeepSeek AI generation failed ===")
      console.error("错误类型:", error.constructor.name)
      console.error("错误信息:", error.message)
      console.error("完整错误:", error)
      throw new Error("AI服务不可用，无法生成面试问题")
    }
  }

  // 实时评估候选人答案
  async evaluateAnswer(
    question: string,
    answer: string,
    questionType: string,
    expectedKeywords?: string[]
  ): Promise<EvaluationResult> {
    const prompt = `你是一位专业的技术面试评估专家。请评估以下面试回答：

## 面试问题
${question}

## 候选人回答
${answer}

## 问题类型
${questionType}

${expectedKeywords ? `## 期望包含的关键点
${expectedKeywords.join(", ")}` : ""}

## 评估要求
1. 从技术准确性、思路清晰度、完整性、实践经验四个维度评估
2. 给出0-100的综合评分
3. 指出回答的优点和不足
4. 提供具体的改进建议
5. 评估要客观、专业、建设性

## 输出格式
请严格按照以下JSON格式返回：
{
  "score": 85,
  "feedback": "总体评价（100字以内）",
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": ["改进点1", "改进点2"],
  "suggestions": ["学习建议1", "学习建议2"],
  "dimensions": {
    "technical": 90,
    "clarity": 85,
    "completeness": 80,
    "practical": 85
  }
}`

    try {
      const response = await this.callDeepSeek(prompt)
      const parsed = this.parseJSONResponse(response)
      
      if (parsed && parsed.score !== undefined) {
        return parsed
      }
      
      throw new Error("Failed to parse evaluation response")
    } catch (error) {
      console.error("DeepSeek evaluation failed:", error)
      throw new Error("AI评估服务不可用")
    }
  }

  // 生成动态追问
  async generateFollowUp(
    originalQuestion: string,
    userAnswer: string,
    context: any
  ): Promise<string> {
    const prompt = `基于候选人的回答，生成一个深入的追问：

原始问题：${originalQuestion}
候选人回答：${userAnswer}

请生成一个追问，要求：
1. 基于候选人回答中的薄弱点或可深入的点
2. 测试更深层次的理解
3. 探讨实际应用或边界情况
4. 问题要具体、清晰、有针对性

直接返回追问内容（一句话，不超过50字）：`

    try {
      const response = await this.callDeepSeek(prompt, 0.7, 100)
      return response.trim()
    } catch (error) {
      console.error("DeepSeek follow-up generation failed:", error)
      throw new Error("AI追问生成服务不可用")
    }
  }

  // 生成面试报告
  async generateInterviewReport(
    interview: any,
    questions: any[],
    answers: string[]
  ): Promise<{
    overallScore: number
    technicalScore: number
    communicationScore: number
    problemSolvingScore: number
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    hiringRecommendation: string
  }> {
    const qaList = questions.map((q, i) => ({
      question: q.content,
      answer: answers[i] || "未回答",
      type: q.type
    }))

    const prompt = `作为资深技术面试官，请基于以下面试记录生成综合评估报告：

## 面试信息
- 目标公司：${interview.targetCompany}
- 目标职位：${interview.targetPosition}
- 面试时长：${interview.duration}分钟

## 问答记录
${qaList.map((qa, i) => `
问题${i + 1}（${qa.type}）：${qa.question}
回答：${qa.answer}
`).join("\n")}

## 评估要求
1. 综合评估候选人的技术能力、沟通能力、问题解决能力
2. 识别候选人的优势和不足
3. 提供具体的改进建议
4. 给出是否推荐录用的建议

## 输出格式
请严格按照以下JSON格式返回：
{
  "overallScore": 85,
  "technicalScore": 88,
  "communicationScore": 82,
  "problemSolvingScore": 85,
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "hiringRecommendation": "强烈推荐/推荐/考虑/不推荐"
}`

    try {
      const response = await this.callDeepSeek(prompt)
      const parsed = this.parseJSONResponse(response)
      
      if (parsed && parsed.overallScore !== undefined) {
        return parsed
      }
      
      throw new Error("Failed to parse report response")
    } catch (error) {
      console.error("DeepSeek report generation error:", error)
      throw new Error("AI报告生成服务不可用")
    }
  }

  // 调用DeepSeek API
  private async callDeepSeek(
    prompt: string,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key not configured")
    }

    console.log("=== DeepSeek API调用 ===")
    console.log("API URL:", this.apiUrl)
    console.log("Temperature:", temperature)
    console.log("Max tokens:", maxTokens)

    // 添加超时控制（8秒）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一位专业的技术面试官，具有丰富的面试经验。请严格按照要求的JSON格式返回结果。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        // response_format: { type: "json_object" } // DeepSeek可能不支持这个参数
      }),
      signal: controller.signal
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('DeepSeek API调用超时')
      }
      throw err
    })
    
    clearTimeout(timeoutId)

    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const error = await response.text()
      console.error("DeepSeek API error response:", error)
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
    }

    const data = await response.json() as DeepSeekResponse
    console.log("DeepSeek API data:", JSON.stringify(data, null, 2))
    return data.choices[0].message.content
  }

  // 解析JSON响应
  private parseJSONResponse(content: string): any {
    try {
      // 清理可能的markdown代码块标记
      let cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      
      // 如果已经是JSON对象，直接解析
      if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
        return JSON.parse(cleaned)
      }
      
      // 尝试提取JSON部分（更强的正则）
      const jsonMatch = cleaned.match(/\{[\s\S]*?\}(?=\s*$|\s*\n|$)/m)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      throw new Error("No valid JSON found")
    } catch (error) {
      console.error("JSON parse error:", error, "Content:", content)
      return null
    }
  }

}