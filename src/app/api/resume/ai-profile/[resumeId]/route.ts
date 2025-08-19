import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler, createError, successResponse } from "@/lib/error-handler"

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw createError("Unauthorized", 401)
  }

  const { resumeId } = await params

  if (!resumeId) {
    throw createError("Resume ID is required", 400)
  }

  // 验证简历是否属于当前用户
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId: session.user.id
    }
  })

  if (!resume) {
    throw createError("Resume not found or access denied", 404)
  }

  // 获取AI分析结果
  const aiProfile = await prisma.resumeAIProfile.findUnique({
    where: { resumeId },
    include: {
      techStack: {
        orderBy: { valueScore: 'desc' }
      },
      projectAnalysis: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!aiProfile) {
    return successResponse({
      hasAIProfile: false,
      message: "AI分析结果不存在，请重新上传简历"
    }, "未找到AI分析结果")
  }

  // 格式化返回数据
  // 计算统计信息
  const techStackArray = aiProfile.techStack || []
  const stats = {
    totalTechnologies: techStackArray.length,
    avgValueScore: techStackArray.length > 0 
      ? Math.round(techStackArray.reduce((sum: number, tech: any) => sum + (tech.valueScore || 0), 0) / techStackArray.length)
      : 75,
    expertLevelCount: techStackArray.filter((tech: any) => tech.proficiency === '专家').length,
    highValueTechCount: techStackArray.filter((tech: any) => (tech.valueScore || 0) >= 90).length
  }

  const response = {
    hasAIProfile: true,
    aiProfileId: aiProfile.id,
    
    // 统计信息
    stats,
    
    // 基础信息
    experienceLevel: aiProfile.experienceLevel,
    experienceLevelConfidence: aiProfile.experienceLevelConfidence,
    experienceReasoning: aiProfile.experienceReasoning,
    
    // 技术栈分析
    techStack: aiProfile.techStack.map(tech => ({
      technology: tech.technology,
      category: tech.category,
      proficiency: tech.proficiency,
      valueScore: tech.valueScore,
      evidenceCount: tech.evidenceCount,
      lastUsed: tech.lastUsed
    })),
    
    // 技术亮点
    techHighlights: aiProfile.techHighlights,
    
    // 专长领域
    specializations: aiProfile.specializations,
    
    // 新增：核心专长领域
    coreExpertise: aiProfile.coreExpertise,
    
    // 新增：模拟面试题库
    simulatedInterview: aiProfile.simulatedInterview,
    
    // 项目分析
    projectAnalysis: aiProfile.projectAnalysis.map(project => ({
      projectName: project.projectName,
      description: project.description,
      techStack: project.techStack,
      complexity: project.complexity,
      impact: project.impact,
      role: project.role,
      highlights: project.highlights,
      techDepth: project.techDepth,
      interviewQuestions: project.interviewQuestions
    })),
    
    // 技能评估
    skillAssessment: aiProfile.skillAssessment,
    
    // 职业发展建议
    careerSuggestions: aiProfile.careerSuggestions,
    
    // 岗位匹配分析
    roleMatchingAnalysis: aiProfile.roleMatchingAnalysis,
    
    // 统计信息
    stats: {
      totalTechnologies: aiProfile.techStack.length,
      topCategoryTechs: getTopCategoryTechs(aiProfile.techStack),
      avgValueScore: calculateAvgValueScore(aiProfile.techStack),
      totalProjects: aiProfile.projectAnalysis.length,
      analyzedAt: aiProfile.createdAt
    }
  }

  return successResponse(response, "AI分析结果获取成功")
})

function getTopCategoryTechs(techStack: any[]) {
  const categoryCount: Record<string, number> = {}
  
  techStack.forEach(tech => {
    categoryCount[tech.category] = (categoryCount[tech.category] || 0) + 1
  })
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }))
}

function calculateAvgValueScore(techStack: any[]) {
  if (techStack.length === 0) return 0
  
  const totalScore = techStack.reduce((sum, tech) => sum + tech.valueScore, 0)
  return Math.round(totalScore / techStack.length)
}