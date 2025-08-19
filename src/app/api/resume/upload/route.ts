import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseResume } from "@/lib/resume-parser"
import { DeepSeekAI } from "@/lib/deepseek-ai"
import { PrivacyFilter, ResumePreprocessor } from "@/lib/privacy-filter"
import { withErrorHandler, errorFactory, successResponse } from "@/lib/error-handler"

export const POST = withErrorHandler(async (request: NextRequest) => {
  console.log("=== 开始简历上传和AI分析流程 ===")
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw errorFactory.unauthorized()
  }

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    throw errorFactory.missingField("file")
  }

  // 验证文件类型
  const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
  if (!validTypes.includes(file.type)) {
    throw errorFactory.unsupportedFileType(["PDF", "Word文档"])
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw errorFactory.fileSizeExceeded(10)
  }

  console.log(`文件信息: ${file.name}, 大小: ${file.size} bytes, 类型: ${file.type}`)

  // 将文件转换为Buffer并解析
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  console.log("开始解析简历文件...")
  let parsedContent
  try {
    parsedContent = await parseResume(buffer, file.type)
  } catch (parseError) {
    console.warn("文件解析失败:", parseError)
    throw errorFactory.fileUploadError("文件解析失败，请检查文件格式是否正确")
  }

  console.log(`简历解析完成，提取到 ${parsedContent.techKeywords?.length || 0} 个技术关键词`)
  console.log('parsedContent结构:', Object.keys(parsedContent))
  console.log('projects数量:', parsedContent.projects?.length || 0)
  console.log('workExperience数量:', parsedContent.workExperience?.length || 0)
  
  // 额外清理，确保所有数据都安全
  const cleanData = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        // 移除所有null字符和其变体
        .replace(/\u0000/g, '')
        .replace(/\x00/g, '')
        // 移除其他危险的控制字符
        .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        // 移除UTF-8 BOM
        .replace(/^\uFEFF/, '')
        // 修复可能的编码问题
        .replace(/\uFFFD/g, '') // 替换字符
        .trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(cleanData)
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = cleanData(value)
      }
      return cleaned
    }
    return obj
  }
  
  const cleanedParsedContent = cleanData(parsedContent)

  // 保存初始简历记录到数据库
  let resume
  try {
    resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl: `/uploads/${Date.now()}-${file.name}`,
        parsedContent: cleanedParsedContent as any,
        techKeywords: cleanedParsedContent.techKeywords || [],
        projects: cleanedParsedContent.projects || [],
        workExperience: cleanedParsedContent.workExperience || [],
      }
    })

    console.log(`简历保存到数据库，ID: ${resume.id}`)
  } catch (dbError) {
    console.error('数据库保存失败:', dbError)
    throw errorFactory.databaseError("简历保存失败")
  }

  // 启动AI分析流程 - 阻塞调用，同步返回结果
  let aiAnalysisResult = null
  try {
    console.log("开始AI技术画像分析...")
    
    // 只调用AI分析，不保存数据库
    const deepseek = new DeepSeekAI()
    const preprocessed = ResumePreprocessor.preprocessForAI(parsedContent.rawText)
    console.log(`原始内容长度: ${parsedContent.rawText.length}`)
    console.log(`过滤后内容长度: ${preprocessed.metadata.filteredLength}`)
    
    // 直接调用AI分析 - 临时禁用隐私过滤，使用清理后的原始内容
    console.log("使用完整原始简历内容进行AI分析（已清理无效字符）")
    aiAnalysisResult = await analyzeResumeWithAI(deepseek, cleanedParsedContent.rawText)
    console.log("AI分析完成，准备返回给前端")
    
    // 异步保存到数据库，不阻塞响应
    setTimeout(async () => {
      try {
        console.log("异步保存AI分析结果到数据库...")
        await saveAIProfileToDatabase(resume.id, aiAnalysisResult, {
          originalLength: parsedContent.rawText.length,
          filteredLength: parsedContent.rawText.length,
          removedFields: [],
          hasContactInfo: true
        })
        console.log("AI分析结果异步保存成功")
      } catch (saveError) {
        console.error("异步保存AI分析结果失败:", saveError)
      }
    }, 0)
    
  } catch (aiError: any) {
    console.warn("AI分析失败:", aiError.message)
    console.error("AI分析错误详情:", aiError)
    // AI分析失败不阻塞主流程，但记录警告
    aiAnalysisResult = null
  }

  console.log("=== 简历上传和分析流程完成 ===")

  // 异步更新用户画像，不阻塞响应
  setTimeout(async () => {
    try {
      await updateUserProfile(session.user.id, cleanedParsedContent, aiAnalysisResult)
    } catch (error) {
      console.error("异步更新用户画像失败:", error)
    }
  }, 0)

  return successResponse({
    resumeId: resume.id,
    fileName: resume.fileName,
    basicAnalysis: {
      techKeywords: resume.techKeywords,
      projects: resume.projects,
      workExperience: resume.workExperience,
    },
    aiAnalysis: aiAnalysisResult ? {
      hasAIAnalysis: true,
      // 返回与AI Profile API一致的数据结构
      experienceLevel: aiAnalysisResult.experienceLevel?.level || parsedContent.experienceLevel,
      experienceLevelConfidence: aiAnalysisResult.experienceLevel?.confidence || 0.7,
      experienceReasoning: aiAnalysisResult.experienceLevel?.reasoning || "",
      
      // 计算统计信息
      stats: (() => {
        const techStackArray = (aiAnalysisResult.techStack || [])
        return {
          totalTechnologies: techStackArray.length,
          avgValueScore: techStackArray.length > 0 
            ? Math.round(techStackArray.reduce((sum: number, tech: any) => sum + (tech.dominanceScore || tech.marketValue || tech.valueScore || 70), 0) / techStackArray.length)
            : 75,
          expertLevelCount: techStackArray.filter((tech: any) => tech.proficiency === '专家').length,
          highValueTechCount: techStackArray.filter((tech: any) => (tech.dominanceScore || tech.marketValue || tech.valueScore || 0) >= 90).length
        }
      })(),
      
      // 技术栈分析 - 确保与AI Profile API结构一致
      techStack: (aiAnalysisResult.techStack || []).map((tech: any) => ({
        technology: tech.technology || '',
        category: tech.category || '其他',
        proficiency: tech.proficiency || '中级',
        valueScore: tech.dominanceScore || tech.marketValue || tech.valueScore || 70,
        evidenceCount: tech.evidenceCount || (tech.evidence ? 1 : 0),
        lastUsed: tech.lastUsed || '近期'
      })),
      
      // 技术亮点
      techHighlights: aiAnalysisResult.techHighlights || [],
      
      // 专长领域
      specializations: aiAnalysisResult.specializations || [],
      
      // 核心专长领域
      coreExpertise: aiAnalysisResult.coreExpertise || [],
      
      // 模拟面试题库
      simulatedInterview: aiAnalysisResult.simulatedInterview || null,
      
      // 项目分析 - 确保与AI Profile API结构一致
      projectAnalysis: (aiAnalysisResult.projectAnalysis || []).map((project: any) => ({
        projectName: project.project || project.projectName || '项目',
        description: project.description || `${project.project || '项目'}的开发工作`,
        techStack: project.techDepth || project.techStack || [],
        complexity: project.complexity || '中等',
        impact: project.achievements || project.impact || '业务价值贡献',
        role: project.role || '开发工程师',
        highlights: project.highlights || [],
        techDepth: project.techDepth || [],
        interviewQuestions: project.interviewQuestions || []
      })),
      
      // 技能评估
      skillAssessment: aiAnalysisResult.skillAssessment || {},
      
      // 职业发展建议
      careerSuggestions: aiAnalysisResult.careerSuggestions || [],
      
      // 岗位匹配分析
      roleMatchingAnalysis: aiAnalysisResult.roleMatchingAnalysis || {}
    } : {
      hasAIAnalysis: false,
      message: "AI分析正在处理中，请稍后查看"
    }
  }, "简历上传成功")
})


async function analyzeResumeWithAI(deepseek: DeepSeekAI, content: string) {
  const prompt = `你是一位严格的技术简历分析师，请基于完整的简历原文执行精准分析。注意：以下是未经任何过滤的完整简历内容，包含所有技术细节和项目信息。

## 完整简历原文（未过滤）
${content}

**分析原则**
1. 100%忠实于简历原文，禁止任何推测或添加虚构内容
2. 技术栈识别优先级：架构能力 > 云原生 > 大数据 > AI > 编程语言
3. 仅记录简历中明确提及的技术和项目
4. 所有结论必须有直接原文证据支持
5. 技术栈重要性按在简历中的比重和职责层次确定

**技术栈识别规则**
1. **技术提取**：
   - 仅提取简历中出现的具体技术名词
   - 将复合表述拆分为独立技术（如"Docker + Kubernetes"→Docker和Kubernetes）
   - 架构能力单独标记（如"微服务架构设计"、"系统重构"）

2. **熟练度判定**：
   - 专家级：出现"主导"、"架构师"、"重构"、"设计"等关键词
   - 高级：出现"负责"、"带领团队"、"性能优化"等关键词
   - 中级：仅在技能栈中列出或项目中使用

3. **重要性计算dominanceScore**：
   - 架构师/CTO/总架构师职位提及的技术：基础分95分
   - 主导/设计/重构等关键动词修饰的技术：基础分90分
   - 深度掌握/精通等表述的技术：基础分85分
   - 大数据/AI/云原生平台相关技术：基础分80分
   - 项目中核心技术角色：+10分
   - 编程语言/框架类：基础分60分（除非有架构级应用）
   - 最高不超过100分

**输出格式（严格JSON）**
{
  "techStack": [
    {
      "technology": "技术名称",
      "category": "架构|云平台|大数据|AI|语言|框架|工具",
      "proficiency": "专家|高级|中级",
      "evidence": "引用原文片段",
      "marketValue": 0-100,
      "lastUsed": "年份",
      "dominanceScore": 0-100
    }
  ],
  "coreExpertise": ["从简历中提取的核心专长领域"],
  "projectAnalysis": [
    {
      "project": "项目名称（原文）",
      "period": "时间段（原文）",
      "role": "担任角色（原文）",
      "description": "项目描述（原文）",
      "techDepth": ["核心技术1", "核心技术2"],
      "complexity": "低|中|高|极高",
      "achievements": "成果描述（原文）",
      "interviewQuestions": ["基于该具体项目的3个技术深度问题"]
    }
  ],
  "simulatedInterview": {
    "architectureDesign": ["基于简历中实际架构经验的5-8个系统设计题，涵盖高可用、扩展性、性能优化等维度"],
    "techDepth": {
      "核心技术名1": ["基于简历经验的5-8个深度原理问题，从基础概念到高级应用"],
      "核心技术名2": ["基于简历经验的5-8个深度原理问题，从基础概念到高级应用"],
      "核心技术名3": ["基于简历经验的5-8个深度原理问题，从基础概念到高级应用"]
    },
    "algorithmCoding": ["基于技术栈的5-8个算法编程题，难度从中等到困难"],
    "systemDesign": ["基于项目经验的5-8个系统设计题，涵盖分布式、微服务、数据库设计等"],
    "leadership": ["基于简历中团队管理经验的5-8个场景题，涵盖冲突解决、技术决策、团队建设等"],
    "problemSolving": ["基于实际工作场景的5-8个问题解决题，测试分析和解决复杂技术问题的能力"],
    "projectExperience": ["针对简历中具体项目的5-8个深度追问，考察项目细节和技术选型"],
    "industryInsight": ["基于专业领域的5-8个行业洞察题，考察技术趋势理解和前瞻性思维"]
  },
  "experienceLevel": {
    "level": "资深专家|高级工程师|中级工程师|初级工程师",
    "confidence": 0.0-1.0,
    "reasoning": "基于：1.工作年限（原文） 2.最高职位（原文） 3.项目复杂度和团队规模"
  },
  "specializations": ["基于项目和职责分析的专业领域"],
  "careerSuggestions": ["基于当前技术栈和经验的发展建议"],
  "roleMatchingAnalysis": {
    "岗位类型": "匹配度百分比（基于实际经验）"
  }
}

**模拟面试题库生成要求**：
1. 每个方向生成5-8个高质量问题，确保覆盖不同难度层次
2. 问题必须与候选人的实际经验和技术栈高度相关
3. 避免通用性问题，专注于个性化的深度考察
4. 技术深度问题需要覆盖候选人最强的3个核心技术
5. 系统设计题要结合候选人的实际项目规模和复杂度
6. 领导力问题要基于候选人的实际管理经验和团队规模
7. 问题描述要具体明确，避免过于宽泛
8. 每类问题按难度递增排序：基础→进阶→高级→专家级

**关键要求（违反将被拒绝）**：
1. 技术栈必须按dominanceScore降序排列，架构师相关技术必须排在最前面
2. 项目分析ONLY使用简历中明确列出的项目，禁止编造任何项目：
   - 如简历提及"ZTP智能平台"，则使用"ZTP智能平台"
   - 如简历提及"防火墙8.0.51版本"，则使用"防火墙8.0.51版本"
   - 绝不允许出现"电商平台"等简历中不存在的项目
3. 所有项目描述必须使用简历原文，不得添加任何推测内容
4. 所有evidence字段必须是简历原文的精确引用
5. **重要**：直接返回纯JSON对象，绝对不要使用markdown代码块标记

**dominanceScore计算示例**：
- "ZTP产品总架构师，主导平台整体架构" + "Kubernetes高可用集群" → Kubernetes dominanceScore = 100
- "深度掌握 Kafka/Pulsar（消息队列）" → Kafka dominanceScore = 95
- "垂直领域大模型设计（安全GPT）" → TensorFlow dominanceScore = 90
- "精通 C++/Java" → C++ dominanceScore = 85
- "熟练使用React" → React dominanceScore = 60
- 仅在技能栈列出 → dominanceScore = 40

现在开始分析，只返回JSON对象：`

  try {
    const response = await (deepseek as any).callDeepSeek(prompt, 0.1, 8192)
    
    // 尝试解析JSON响应 - 增强容错能力处理截断响应
    let parsedAnalysis
    try {
      console.log("AI响应长度:", response.length)
      console.log("AI响应开头:", response.substring(0, 200))
      console.log("AI响应结尾:", response.substring(Math.max(0, response.length - 200)))
      
      // 更强力的清理markdown标记和额外文本
      let cleaned = response
        .replace(/```json\s*/gi, "")        // 移除 ```json
        .replace(/```\s*/g, "")             // 移除 ```
        .replace(/^[^{]*/, "")              // 移除开头的非JSON文本
        .replace(/[^}]*$/, "")              // 移除结尾的非JSON文本
        .trim()
      
      // 如果找不到完整JSON，尝试更精确的提取
      if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        } else {
          throw new Error("未找到有效的JSON格式");
        }
      }
      
      // 处理可能的截断JSON - 尝试修复不完整的JSON
      if (!cleaned.endsWith("}")) {
        console.log("检测到可能的JSON截断，尝试修复...")
        
        // 尝试找到最后一个完整的字段并关闭JSON
        const lastCompleteFieldMatch = cleaned.match(/.*[,\}]\s*$/);
        if (lastCompleteFieldMatch) {
          cleaned = lastCompleteFieldMatch[0].replace(/,$/, "") + "}";
        } else {
          // 如果找不到完整字段，尝试在最后一个引号处截断
          const lastQuoteIndex = cleaned.lastIndexOf('"');
          if (lastQuoteIndex > 0) {
            cleaned = cleaned.substring(0, lastQuoteIndex + 1) + "}";
          } else {
            throw new Error("无法修复截断的JSON");
          }
        }
        console.log("修复后的JSON长度:", cleaned.length)
      }
      
      // 解析JSON
      parsedAnalysis = JSON.parse(cleaned)
      
      // 验证必要字段存在
      if (!parsedAnalysis.techStack || !Array.isArray(parsedAnalysis.techStack)) {
        throw new Error("AI返回的数据结构不正确");
      }
      
      // 强制按dominanceScore排序技术栈
      if (parsedAnalysis.techStack.length > 0) {
        parsedAnalysis.techStack.sort((a, b) => (b.dominanceScore || 0) - (a.dominanceScore || 0));
      }
      
      console.log("AI分析结果解析成功:", Object.keys(parsedAnalysis))
      console.log("技术栈排序验证 - 前3项:", parsedAnalysis.techStack?.slice(0, 3).map(t => `${t.technology}(${t.dominanceScore})`))
      
      // 验证面试题库完整性，但不使用备用题库填充
      if (parsedAnalysis.simulatedInterview) {
        const interview = parsedAnalysis.simulatedInterview
        const requiredCategories = ['architectureDesign', 'techDepth', 'algorithmCoding', 'systemDesign', 'leadership', 'problemSolving', 'projectExperience', 'industryInsight']
        
        for (const category of requiredCategories) {
          if (!interview[category] || (Array.isArray(interview[category]) && interview[category].length === 0)) {
            console.log(`检测到面试题库类别 ${category} 缺失或为空 - 保持AI原始结果`)
          }
        }
      }
      
    } catch (parseError) {
      console.warn("AI返回的不是有效JSON，使用备用解析方法:", parseError)
      console.log("原始响应长度:", response.length)
      console.log("解析错误详情:", parseError.message)
      parsedAnalysis = await generateFallbackAnalysis(content)
    }
    
    // 修复roleMatchingAnalysis格式（从数组转换为对象）
    if (parsedAnalysis.roleMatchingAnalysis && Array.isArray(parsedAnalysis.roleMatchingAnalysis)) {
      const roleMatchingObj: Record<string, number> = {}
      parsedAnalysis.roleMatchingAnalysis.forEach((item: any) => {
        if (item.role && item.matchScore !== undefined) {
          roleMatchingObj[item.role] = item.matchScore
        }
      })
      parsedAnalysis.roleMatchingAnalysis = roleMatchingObj
    }
    
    return parsedAnalysis
  } catch (error) {
    console.error("AI分析失败，使用备用分析:", error)
    return await generateFallbackAnalysis(content)
  }
}


async function generateFallbackAnalysis(content: string) {
  // 备用分析逻辑 - 基于关键词匹配，不生成面试题
  const techKeywords = extractTechKeywords(content)
  
  return {
    techStack: techKeywords.map((tech, index) => ({
      technology: tech,
      category: categorizeTech(tech),
      proficiency: "中级",
      dominanceScore: Math.max(60, 100 - index * 5),
      valueScore: Math.max(60, 100 - index * 5),
      evidenceCount: 1,
      lastUsed: "近期"
    })),
    techHighlights: [
      "具备多项技术栈经验",
      "有实际项目开发经验",
      "技术学习能力较强"
    ],
    projectAnalysis: [{
      project: "项目经验",
      projectName: "项目经验", 
      description: "从简历中识别的项目经验",
      techStack: techKeywords.slice(0, 5),
      techDepth: techKeywords.slice(0, 5),
      complexity: "中等",
      impact: "业务价值贡献",
      achievements: "业务价值贡献",
      role: "开发工程师",
      highlights: ["技术实现", "项目交付"],
      interviewQuestions: []
    }],
    skillAssessment: {
      technical: 75,
      communication: 70,
      leadership: 65,
      learning: 80
    },
    experienceLevel: {
      level: determinExperienceLevel(content),
      confidence: 0.7,
      reasoning: "基于项目复杂度和技术栈广度评估"
    },
    specializations: determineSpecializations(techKeywords),
    coreExpertise: determineSpecializations(techKeywords),
    careerSuggestions: [
      "继续深化主技术栈",
      "增强系统设计能力", 
      "提升项目管理技能"
    ],
    roleMatchingAnalysis: {
      "前端开发": 80,
      "全栈开发": 75,
      "后端开发": 70
    },
    // 备用分析不生成模拟面试题，保持为null
    simulatedInterview: null
  }
}

function extractTechKeywords(content: string): string[] {
  const commonTech = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Spring', 'Django',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'Azure',
    'Git', 'Linux', 'Nginx'
  ]
  
  return commonTech.filter(tech => 
    content.toLowerCase().includes(tech.toLowerCase())
  ).slice(0, 10) // 限制数量
}

function categorizeTech(tech: string): string {
  const categories = {
    '语言': ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'],
    '框架': ['React', 'Vue', 'Angular', 'Next.js', 'Spring', 'Django'],
    '数据库': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis'],
    '工具': ['Docker', 'Kubernetes', 'Git', 'Linux', 'Nginx'],
    '平台': ['AWS', 'Azure', 'Node.js']
  }
  
  for (const [category, techs] of Object.entries(categories)) {
    if (techs.includes(tech)) return category
  }
  return '其他'
}

function determinExperienceLevel(content: string): string {
  const text = content.toLowerCase()
  
  if (text.includes('高级') || text.includes('架构师') || text.includes('技术负责人')) {
    return 'senior'
  } else if (text.includes('3年') || text.includes('4年') || text.includes('5年')) {
    return 'mid'
  } else if (text.includes('1年') || text.includes('2年') || text.includes('应届')) {
    return 'junior'
  }
  
  return 'mid'
}

function determineSpecializations(techStack: string[]): string[] {
  const specializations = []
  
  if (techStack.some(tech => ['React', 'Vue', 'Angular'].includes(tech))) {
    specializations.push('前端开发')
  }
  if (techStack.some(tech => ['Spring', 'Django', 'Node.js'].includes(tech))) {
    specializations.push('后端开发')
  }
  if (techStack.some(tech => ['Docker', 'Kubernetes', 'AWS'].includes(tech))) {
    specializations.push('DevOps')
  }
  if (techStack.some(tech => ['MySQL', 'PostgreSQL', 'MongoDB'].includes(tech))) {
    specializations.push('数据库')
  }
  
  return specializations.length > 0 ? specializations : ['全栈开发']
}

async function saveAIProfileToDatabase(resumeId: string, analysis: any, metadata: any) {
  console.log("=== 开始保存AI分析结果到数据库 ===")
  console.log("Resume ID:", resumeId)
  console.log("Analysis keys:", Object.keys(analysis))
  
  try {
    // 检查是否已存在AI分析结果
    const existingProfile = await prisma.resumeAIProfile.findUnique({
      where: { resumeId },
      include: {
        techStack: true,
        projectAnalysis: true
      }
    })

    if (existingProfile) {
      // 删除旧的关联数据
      await prisma.techStackItem.deleteMany({
        where: { profileId: existingProfile.id }
      })
      await prisma.projectAnalysis.deleteMany({
        where: { profileId: existingProfile.id }
      })
    }

    // 创建或更新AI Profile
    const aiProfile = await prisma.resumeAIProfile.upsert({
      where: { resumeId },
      create: {
        resumeId,
        techHighlights: analysis.techHighlights || [],
        skillAssessment: analysis.skillAssessment || {},
        experienceLevel: analysis.experienceLevel?.level || 'mid',
        experienceLevelConfidence: analysis.experienceLevel?.confidence || 0.7,
        experienceReasoning: analysis.experienceLevel?.reasoning,
        specializations: analysis.specializations || [],
        coreExpertise: analysis.coreExpertise || [],
        simulatedInterview: analysis.simulatedInterview || null,
        careerSuggestions: analysis.careerSuggestions || [],
        roleMatchingAnalysis: analysis.roleMatchingAnalysis || {},
        rawAnalysis: {
          analysis,
          metadata,
          analyzedAt: new Date().toISOString()
        }
      },
      update: {
        techHighlights: analysis.techHighlights || [],
        skillAssessment: analysis.skillAssessment || {},
        experienceLevel: analysis.experienceLevel?.level || 'mid',
        experienceLevelConfidence: analysis.experienceLevel?.confidence || 0.7,
        experienceReasoning: analysis.experienceLevel?.reasoning,
        specializations: analysis.specializations || [],
        coreExpertise: analysis.coreExpertise || [],
        simulatedInterview: analysis.simulatedInterview || null,
        careerSuggestions: analysis.careerSuggestions || [],
        roleMatchingAnalysis: analysis.roleMatchingAnalysis || {},
        rawAnalysis: {
          analysis,
          metadata,
          analyzedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      }
    })

    // 保存技术栈数据
    if (analysis.techStack && Array.isArray(analysis.techStack)) {
      for (const tech of analysis.techStack) {
        await prisma.techStackItem.create({
          data: {
            profileId: aiProfile.id,
            technology: tech.technology || '',
            category: tech.category || '其他',
            proficiency: tech.proficiency || '中级',
            valueScore: tech.dominanceScore || tech.marketValue || tech.valueScore || 70,
            evidenceCount: tech.evidenceCount || (tech.evidence ? tech.evidence.length : 1),
            lastUsed: tech.lastUsed || '近期'
          }
        })
      }
    }

    // 保存项目分析数据
    if (analysis.projectAnalysis && Array.isArray(analysis.projectAnalysis)) {
      for (const project of analysis.projectAnalysis) {
        await prisma.projectAnalysis.create({
          data: {
            profileId: aiProfile.id,
            projectName: project.project || project.projectName || '项目',
            description: project.description || `${project.project || '项目'}的开发工作`,
            techStack: project.techDepth || project.techStack || [],
            complexity: project.complexity || '中等',
            impact: project.achievements || project.impact || '业务价值贡献',
            role: project.role || '开发工程师',
            highlights: project.highlights || [],
            techDepth: project.techDepth || [],
            interviewQuestions: project.interviewQuestions || []
          }
        })
      }
    }

    return aiProfile
  } catch (error) {
    console.error("保存AI分析结果失败:", error)
    throw error
  }
}

async function updateUserProfile(userId: string, parsedContent: any, aiAnalysis: any) {
  try {
    // 从AI分析结果中提取更准确的信息
    const techStack = aiAnalysis?.techStack?.map((item: any) => item.technology) || parsedContent.techKeywords || []
    
    // 映射AI分析的经验等级到数据库枚举
    let experienceLevel = "JUNIOR"
    if (aiAnalysis?.experienceLevel?.level) {
      const level = aiAnalysis.experienceLevel.level
      if (level.includes("资深") || level.includes("专家") || level.includes("lead")) {
        experienceLevel = "LEAD"
      } else if (level.includes("高级") || level.includes("senior")) {
        experienceLevel = "SENIOR"
      } else if (level.includes("中级") || level.includes("mid")) {
        experienceLevel = "MID"
      } else {
        experienceLevel = "JUNIOR"
      }
    } else if (parsedContent.experienceLevel) {
      experienceLevel = parsedContent.experienceLevel
    }
    
    const specializations = aiAnalysis?.specializations || []

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        experienceLevel: experienceLevel as any,
        techStack: techStack,
        targetRoles: specializations,
        targetCompanies: [],
        weakAreas: [],
      },
      update: {
        techStack: techStack,
        experienceLevel: experienceLevel as any,
        targetRoles: specializations,
      }
    })

    console.log("用户画像更新成功")
  } catch (error) {
    console.error("更新用户画像失败:", error)
    // 不抛出错误，继续流程
  }
}