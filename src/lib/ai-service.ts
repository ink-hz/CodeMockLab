interface AIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface QuestionGenerationRequest {
  jobPosition: {
    company: string
    title: string
    requirements: string[]
    level: string
  }
  userProfile: {
    techStack: string[]
    projects: any[]
    experienceLevel: string
  }
  interviewType: 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  questionCount: number
}

interface EvaluationRequest {
  question: string
  userAnswer: string
  modelAnswer?: string
  questionType: 'CODING' | 'BEHAVIORAL' | 'SYSTEM_DESIGN'
}

export class AIService {
  private openaiApiKey: string
  private anthropicApiKey: string

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<any[]> {
    const prompt = this.buildQuestionPrompt(request)
    
    try {
      const response = await this.callOpenAI(prompt)
      return this.parseQuestionsResponse(response.content)
    } catch (error) {
      console.error('Question generation failed:', error)
      // 备用Anthropic调用
      try {
        const response = await this.callAnthropic(prompt)
        return this.parseQuestionsResponse(response.content)
      } catch (fallbackError) {
        console.error('Fallback AI call failed:', fallbackError)
        throw new Error('AI服务暂时不可用')
      }
    }
  }

  async evaluateAnswer(request: EvaluationRequest): Promise<{
    score: number
    feedback: string
    strengths: string[]
    improvements: string[]
    suggestedResources: string[]
  }> {
    const prompt = this.buildEvaluationPrompt(request)
    
    try {
      const response = await this.callOpenAI(prompt)
      return this.parseEvaluationResponse(response.content)
    } catch (error) {
      console.error('Answer evaluation failed:', error)
      throw new Error('评估服务暂时不可用')
    }
  }

  async generateFollowUpQuestions(
    originalQuestion: string,
    userAnswer: string,
    context: any
  ): Promise<string[]> {
    const prompt = `
作为资深技术面试官，基于以下信息生成2-3个后续追问：

原问题: ${originalQuestion}
候选人回答: ${userAnswer}

要求：
1. 深入挖掘候选人的技术理解
2. 测试边界情况和异常处理
3. 探讨性能优化和最佳实践
4. 问题应该递进式深入

请直接返回问题列表，每行一个问题：
`

    try {
      const response = await this.callOpenAI(prompt)
      return response.content.split('\n').filter(line => line.trim().length > 0)
    } catch (error) {
      console.error('Follow-up generation failed:', error)
      return []
    }
  }

  private buildQuestionPrompt(request: QuestionGenerationRequest): string {
    const { jobPosition, userProfile, interviewType, difficulty, questionCount } = request

    return `
你是一位资深的技术面试官，需要为候选人生成${questionCount}道${interviewType}面试题。

职位信息：
- 公司: ${jobPosition.company}
- 职位: ${jobPosition.title}
- 级别: ${jobPosition.level}
- 技能要求: ${jobPosition.requirements.join(', ')}

候选人信息：
- 技术栈: ${userProfile.techStack.join(', ')}
- 经验级别: ${userProfile.experienceLevel}
- 项目数量: ${userProfile.projects.length}

面试类型: ${interviewType}
难度级别: ${difficulty}

请生成高质量的面试题，每道题包含：
1. 问题描述
2. 考察点
3. 参考答案要点
4. 评分标准

返回JSON格式：
{
  "questions": [
    {
      "id": "q1",
      "content": "问题内容",
      "type": "问题类型",
      "difficulty": "${difficulty}",
      "category": "技术分类",
      "keyPoints": ["考察点1", "考察点2"],
      "modelAnswer": "参考答案",
      "scoringCriteria": {
        "excellent": "优秀标准",
        "good": "良好标准", 
        "basic": "基础标准"
      }
    }
  ]
}
`
  }

  private buildEvaluationPrompt(request: EvaluationRequest): string {
    const { question, userAnswer, questionType } = request

    return `
作为专业的技术面试评估专家，请评估以下面试回答：

问题: ${question}
问题类型: ${questionType}
候选人回答: ${userAnswer}

请从以下维度进行评估：
1. 技术准确性 (25%)
2. 思路清晰度 (25%) 
3. 完整性 (25%)
4. 实践经验 (25%)

请返回JSON格式的评估结果：
{
  "score": 85,
  "feedback": "整体评价...",
  "strengths": ["优点1", "优点2"],
  "improvements": ["改进点1", "改进点2"],
  "suggestedResources": ["学习资源1", "学习资源2"],
  "detailedAnalysis": {
    "technicalAccuracy": 90,
    "clarity": 80,
    "completeness": 85,
    "practicalExperience": 85
  }
}
`
  }

  private async callOpenAI(prompt: string): Promise<AIResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的技术面试官，具有丰富的面试经验和技术背景。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }

  private async callAnthropic(prompt: string): Promise<AIResponse> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.content[0].text,
      usage: data.usage
    }
  }

  private parseQuestionsResponse(content: string): any[] {
    try {
      const parsed = JSON.parse(content)
      return parsed.questions || []
    } catch (error) {
      console.error('Failed to parse questions response:', error)
      throw new Error('AI返回格式解析失败')
    }
  }

  private parseEvaluationResponse(content: string): any {
    try {
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to parse evaluation response:', error)
      throw new Error('AI评估结果解析失败')
    }
  }

}