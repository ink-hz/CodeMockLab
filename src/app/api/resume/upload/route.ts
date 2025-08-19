import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseResume } from "@/lib/resume-parser"
import { DeepSeekAI } from "@/lib/deepseek-ai"
import { PrivacyFilter, ResumePreprocessor } from "@/lib/privacy-filter"
import { withErrorHandler, createError, successResponse } from "@/lib/error-handler"

export const POST = withErrorHandler(async (request: NextRequest) => {
  console.log("=== 开始简历上传和AI分析流程 ===")
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw createError("Unauthorized", 401)
  }

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    throw createError("File is required", 400)
  }

  // 验证文件类型
  const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
  if (!validTypes.includes(file.type)) {
    throw createError("Invalid file type. Only PDF and Word documents are allowed.", 400)
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw createError("File size exceeds 10MB limit", 400)
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
    console.warn("文件解析失败，使用基础文本提取:", parseError)
    // 如果解析失败，创建基础结构
    parsedContent = {
      rawText: `文件名: ${file.name}\n类型: ${file.type}\n大小: ${file.size} bytes`,
      techKeywords: [],
      projects: [],
      workExperience: [],
      experienceLevel: "JUNIOR" as const,
      skills: []
    }
  }

  console.log(`简历解析完成，提取到 ${parsedContent.techKeywords?.length || 0} 个技术关键词`)

  // 保存初始简历记录到数据库
  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      fileName: file.name,
      fileUrl: `/uploads/${Date.now()}-${file.name}`,
      parsedContent: parsedContent as any,
      techKeywords: parsedContent.techKeywords || [],
      projects: parsedContent.projects || [],
      workExperience: parsedContent.workExperience || [],
    }
  })

  console.log(`简历保存到数据库，ID: ${resume.id}`)

  // 启动AI分析流程
  let aiAnalysisResult = null
  try {
    console.log("开始AI技术画像分析...")
    aiAnalysisResult = await performAIAnalysis(resume.id, parsedContent.rawText)
    console.log("AI分析完成")
  } catch (aiError) {
    console.warn("AI分析失败，继续使用基础解析结果:", aiError)
  }

  // 更新用户画像
  await updateUserProfile(session.user.id, parsedContent, aiAnalysisResult)

  console.log("=== 简历上传和分析流程完成 ===")

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
      techHighlights: aiAnalysisResult.techHighlights?.slice(0, 3) || [],
      experienceLevel: aiAnalysisResult.experienceLevel || parsedContent.experienceLevel,
      specializations: aiAnalysisResult.specializations?.slice(0, 3) || []
    } : {
      hasAIAnalysis: false,
      message: "AI分析正在处理中，请稍后查看"
    }
  }, "简历上传成功")
})

async function performAIAnalysis(resumeId: string, rawText: string) {
  console.log("=== 开始AI简历分析 ===")
  console.log(`简历ID: ${resumeId}`)
  console.log(`原始内容长度: ${rawText.length}`)

  // 1. 预处理和隐私过滤
  const preprocessed = ResumePreprocessor.preprocessForAI(rawText)
  console.log(`过滤后内容长度: ${preprocessed.metadata.filteredLength}`)
  console.log(`移除字段: ${preprocessed.metadata.removedFields.join(', ') || '无'}`)

  // 2. AI分析
  const deepseek = new DeepSeekAI()
  const analysis = await analyzeResumeWithAI(deepseek, preprocessed.processedContent)

  // 3. 保存分析结果到数据库
  const aiProfile = await saveAIProfileToDatabase(resumeId, analysis, preprocessed.metadata)

  console.log("=== AI简历分析完成 ===")

  return {
    ...analysis,
    aiProfileId: aiProfile?.id
  }
}

async function analyzeResumeWithAI(deepseek: DeepSeekAI, content: string) {
  const prompt = `你是一位资深的技术招聘专家和简历分析师，请对以下简历进行全面的技术画像分析。

## 简历内容
${content}

## 分析要求
请从以下维度进行深入分析，并返回JSON格式的结构化数据：

### 1. 技术栈评估 (techStack)
分析候选人掌握的所有技术，按价值和市场需求排序：
- technology: 技术名称
- category: 分类(语言/框架/工具/平台)
- proficiency: 熟练度评估(初级/中级/高级/专家)
- valueScore: 市场价值评分(0-100)
- evidenceCount: 在简历中的证据数量
- lastUsed: 最近使用时间估计

### 2. 技术亮点 (techHighlights)
提取3-5个最突出的技术亮点

### 3. 项目经验分析 (projectAnalysis)
分析每个重要项目：
- projectName: 项目名称
- description: 项目描述
- techStack: 使用的技术栈
- complexity: 复杂度(简单/中等/复杂/高级)
- impact: 项目影响力
- role: 在项目中的角色
- highlights: 技术亮点

### 4. 技能评估 (skillAssessment)
对主要技能领域进行评分和分析

### 5. 经验等级评估 (experienceLevel)
- level: 总体经验等级(junior/mid/senior/lead)
- confidence: 评估置信度(0-1)
- reasoning: 评估理由

### 6. 技术专长领域 (specializations)
识别候选人的专业领域

### 7. 职业发展建议 (careerSuggestions)
基于技术栈和经验的发展建议

### 8. 岗位匹配分析 (roleMatchingAnalysis)
分析适合的岗位类型和匹配度

请返回严格的JSON格式，不要包含任何解释文字：`

  try {
    const response = await (deepseek as any).callDeepSeek(prompt, 0.3, 2000)
    
    // 尝试解析JSON响应
    let parsedAnalysis
    try {
      parsedAnalysis = JSON.parse(response)
    } catch (parseError) {
      console.warn("AI返回的不是有效JSON，使用备用解析方法")
      parsedAnalysis = await generateFallbackAnalysis(content)
    }
    
    return parsedAnalysis
  } catch (error) {
    console.error("AI分析失败，使用备用分析:", error)
    return await generateFallbackAnalysis(content)
  }
}

async function generateFallbackAnalysis(content: string) {
  // 备用分析逻辑 - 基于关键词匹配
  const techKeywords = extractTechKeywords(content)
  
  return {
    techStack: techKeywords.map((tech, index) => ({
      technology: tech,
      category: categorizeTech(tech),
      proficiency: "中级",
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
      projectName: "项目经验",
      description: "从简历中识别的项目经验",
      techStack: techKeywords.slice(0, 5),
      complexity: "中等",
      impact: "业务价值贡献",
      role: "开发工程师",
      highlights: ["技术实现", "项目交付"]
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
    careerSuggestions: [
      "继续深化主技术栈",
      "增强系统设计能力",
      "提升项目管理技能"
    ],
    roleMatchingAnalysis: {
      "前端开发": 80,
      "全栈开发": 75,
      "后端开发": 70
    }
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
        specializations: analysis.specializations || [],
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
        specializations: analysis.specializations || [],
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
            technology: tech.technology,
            category: tech.category,
            proficiency: tech.proficiency,
            valueScore: tech.valueScore,
            evidenceCount: tech.evidenceCount,
            lastUsed: tech.lastUsed
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
            projectName: project.projectName,
            description: project.description,
            techStack: project.techStack || [],
            complexity: project.complexity,
            impact: project.impact,
            role: project.role,
            highlights: project.highlights || []
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
    const experienceLevel = aiAnalysis?.experienceLevel?.level?.toUpperCase() || parsedContent.experienceLevel || "JUNIOR"
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