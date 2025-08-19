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

## 🎯 目标岗位全面分析
### 基础信息（权重10%）
- 公司：${jobData.company}
- 职位：${jobData.position}
- 级别：${jobData.level}
- 基础技术要求：${jobData.requirements?.join(", ") || "未知"}

### 🔥 核心工作职责分析（权重30%）
${jobData.jobResponsibilities && jobData.jobResponsibilities.length > 0 ? `
**具体工作职责**：
${jobData.jobResponsibilities.map((resp, index) => `${index + 1}. ${resp}`).join("\n")}

**职责驱动出题策略**：
- 针对每项核心职责设计实际工作场景问题
- 考察候选人在真实工作环境下的问题解决能力
- 验证对岗位工作内容的理解深度和执行能力
- 评估工作流程设计和团队协作能力
` : `
**工作职责**：未提供具体职责，将基于岗位名称推断常见工作内容
**出题策略**：结合行业通用工作场景进行考察
`}

### 🎯 详细任职要求分析（权重25%）
${jobData.jobRequirements && jobData.jobRequirements.length > 0 ? `
**具体任职要求**：
${jobData.jobRequirements.map((req, index) => `${index + 1}. ${req}`).join("\n")}

**要求匹配出题策略**：
- 硬技能验证：针对具体技术要求进行深度考察
- 软技能评估：考察沟通、领导力、学习能力等
- 经验要求核实：通过项目案例验证相关经验
- 能力证明：要求候选人提供具体实例证明能力
` : `
**任职要求**：未提供详细要求，将基于基础技术要求进行评估
**出题策略**：重点考察基础技术能力和学习适应性
`}

## 🤖 AI技术画像深度分析（权重35%）
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

## 📋 综合智能问题生成策略
### 1. 多维度权重分配
- **工作职责驱动**（30%）：基于具体工作场景出题
- **任职要求匹配**（25%）：针对详细要求进行验证
- **AI技术画像**（35%）：个性化技术深度考察
- **基础岗位信息**（10%）：补充和兜底

### 2. 工作职责驱动出题重点
${jobData.jobResponsibilities && jobData.jobResponsibilities.length > 0 ? `
- **实际工作场景**：基于具体职责设计真实工作问题
- **流程设计能力**：考察工作流程优化和设计思维
- **团队协作**：验证在团队环境下的工作能力
- **问题解决**：评估面对实际工作挑战时的应对策略
- **业务理解**：测试对业务需求的理解和技术转化能力
` : `
- **通用工作能力**：基于岗位特点考察基础工作技能
- **适应能力**：评估学习和适应新工作环境的能力
`}

### 3. 任职要求深度验证
${jobData.jobRequirements && jobData.jobRequirements.length > 0 ? `
- **硬技能考察**：针对每项技术要求进行专业深度测试
- **软技能评估**：通过情景问题考察沟通、领导等能力
- **经验验证**：要求提供具体项目案例证明相关经验
- **能力证明**：设计实际问题验证声称的能力水平
- **发展潜力**：评估在要求基础上的成长空间
` : `
- **基础能力**：考察核心技术能力和学习潜力
- **适配性**：评估与岗位的基本匹配度
`}

### 4. AI画像个性化考察
- **技术深度验证**：针对价值评分最高的3个技术栈进行深度考察
- **项目经验挖掘**：基于AI分析的真实项目经验出题，避免泛泛而谈
- **专长领域聚焦**：围绕候选人的核心专长领域设计架构类问题
- **经验等级匹配**：根据AI评估的真实经验等级调整问题复杂度
- **角色适配性**：结合岗位匹配度分析，考察关键能力gap

### 5. 智能难度调节
- AI评估为高级/专家：60%困难，40%中等
- AI评估为中级：20%简单，50%中等，30%困难  
- AI评估为初级：40%简单，50%中等，10%困难

### 6. 综合匹配度优化
- 高匹配度(80%+)：深度技能考察 + 架构设计能力 + 工作职责场景
- 中匹配度(60-80%)：核心技能 + 学习适应能力 + 任职要求验证
- 低匹配度(<60%)：基础能力 + 逻辑思维 + 技术迁移能力 + 成长潜力

## 🔍 多维度综合面试重点
### 基于工作职责的场景化考察
${jobData.jobResponsibilities && jobData.jobResponsibilities.length > 0 ? `
**工作场景模拟**：
${jobData.jobResponsibilities.slice(0, 3).map((resp, index) => 
  `- 职责${index + 1}场景：基于"${resp}"设计实际工作问题`
).join("\n")}
**考察重点**：工作流程设计、问题解决思路、团队协作能力、业务理解深度
` : `
**通用场景考察**：基于岗位特点设计常见工作场景问题
`}

### 基于任职要求的能力验证
${jobData.jobRequirements && jobData.jobRequirements.length > 0 ? `
**能力验证重点**：
${jobData.jobRequirements.slice(0, 4).map((req, index) => 
  `- 要求${index + 1}：针对"${req}"进行深度能力考察`
).join("\n")}
**验证方式**：理论解释 + 实际案例 + 场景应用 + 问题解决
` : `
**基础能力验证**：重点考察学习能力和基础技术素养
`}

### 基于AI技术画像的个性化考察
${aiProfile ? `
**技术深度考察**：重点测试${aiProfile.techStack?.slice(0, 3).map((t: any) => t.technology).join("、") || "主要技术栈"}的深度理解
**专长领域验证**：验证在${aiProfile.specializations?.slice(0, 2).join("、") || "专业领域"}的实际应用能力
**经验等级匹配**：针对${aiProfile.experienceLevel || "中级"}水平设计合适难度的问题
**项目经验深挖**：${aiProfile.projectAnalysis?.length > 0 ? `重点围绕"${aiProfile.projectAnalysis[0]?.projectName || "核心项目"}"进行技术深度考察` : "结合项目经验进行技术验证"}
` : `
**传统简历分析**：基于简历信息进行基础技能评估和学习能力考察
`}

## 📝 问题类型分布要求
1. **工作场景问题**（30%）：基于具体工作职责的实际场景模拟
2. **技术深度问题**（25%）：基于岗位技术要求和AI画像的深入探讨
3. **系统设计问题**（20%）：考察架构思维和复杂问题解决能力
4. **能力验证问题**（15%）：针对任职要求进行具体能力证明
5. **综合应用问题**（10%）：结合多个维度的综合性考察

## 📊 出题质量标准
1. **场景真实性**：问题必须贴近实际工作场景，具有实用价值
2. **针对性强**：每道题都要明确对应某个具体的职责、要求或技能点
3. **层次递进**：从基础理解到深度应用，逐步深入
4. **综合性考察**：同时考虑技术能力、工作能力、学习能力
5. **个性化匹配**：充分利用AI技术画像，做到因人而异

## 输出格式
请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "questions": [
    {
      "id": "q1",
      "content": "具体的问题描述",
      "type": "technical/behavioral/system-design/coding/scenario",
      "difficulty": "easy/medium/hard",
      "topics": ["相关技术点1", "相关技术点2"],
      "expectedKeywords": ["期望答案包含的关键词"],
      "followUps": ["可能的追问1", "可能的追问2"],
      "evaluationCriteria": "评估标准描述",
      "source": "responsibility/requirement/ai-profile/basic",
      "category": "工作场景/技术深度/系统设计/能力验证/综合应用"
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

  // 生成最佳答案示例
  async generateBestAnswer(
    question: string,
    questionType: string,
    difficulty: string,
    topics: string[] = []
  ): Promise<string> {
    const prompt = `你是一位资深的技术架构师和面试专家，拥有15年以上的行业经验。请为以下面试问题提供一个完美的标准答案示例。

## 📋 面试问题详情
**问题内容**: ${question}
**问题类型**: ${questionType}
**难度等级**: ${difficulty}
**技术领域**: ${topics.length > 0 ? topics.join(", ") : "通用技术"}

## 🎯 答案质量要求
你的回答必须达到以下标准：

### 1. 技术深度要求
- **${difficulty === 'easy' ? '初级' : difficulty === 'medium' ? '中级' : difficulty === 'hard' ? '高级' : '专家级'}水平**: 体现相应技术深度，避免过浅或过深
- **原理阐述**: 解释核心技术原理，不只是表面概念
- **实现细节**: 包含具体的技术实现要点和关键配置

### 2. 结构化回答
- **逻辑清晰**: 按照 概述→深入→实践→总结 的结构
- **要点分明**: 使用数字列表或要点，便于理解
- **层次递进**: 从基础概念到高级应用逐步深入

### 3. 实战经验融入
- **最佳实践**: 包含业界公认的最佳实践
- **常见问题**: 提及实际开发中的常见陷阱和解决方案
- **性能考量**: 涉及性能优化和扩展性思考
- **架构思维**: ${questionType === 'system-design' ? '重点体现系统架构设计思维' : '体现技术选型的架构思考'}

### 4. 针对性优化
${questionType === 'technical' ? `
**技术问题专项要求**:
- 核心原理解释 + 具体实现方案
- 包含代码示例或伪代码（如适用）
- 对比不同技术方案的优劣
- 实际项目应用场景分析
` : questionType === 'system-design' ? `
**系统设计专项要求**:
- 需求分析 → 架构设计 → 技术选型 → 扩展考虑
- 包含架构图的文字描述
- 分析系统的可用性、一致性、分区容错性
- 考虑数据流、用户规模、性能瓶颈
- 提供多种技术方案对比
` : questionType === 'coding' ? `
**算法编程专项要求**:
- 思路分析 → 算法设计 → 复杂度分析 → 代码实现
- 详细的算法思路和数据结构选择
- 时间复杂度和空间复杂度分析
- 边界条件和异常处理考虑
- 可能的优化方案
` : `
**综合问题要求**:
- 结合具体场景和实际经验
- 展现问题分析和解决能力
- 体现沟通表达和逻辑思维
- 包含实际工作中的应用案例
`}

## ⭐ 输出要求
1. **直接回答**: 不要使用"这个问题很好"等客套话，直接进入正题
2. **结构清晰**: 使用标题、要点、分段，便于阅读
3. **长度适中**: 300-800字，既全面又精炼
4. **专业术语**: 准确使用技术术语，体现专业性
5. **实用性强**: 答案要有实际指导价值，不是纸上谈兵

现在，请提供这个问题的完美标准答案：`

    try {
      const response = await this.callDeepSeek(prompt, 0.3, 1500)
      return response.trim()
    } catch (error) {
      console.error("DeepSeek best answer generation failed:", error)
      return "AI最佳答案生成失败，请稍后重试"
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
  public async callDeepSeek(
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

    // 添加超时控制（120秒，给扩展面试题库生成充足时间）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)
    
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
  public parseJSONResponse(content: string): any {
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