/**
 * 输入验证模块
 */

import { createError } from "@/lib/error-handler"
import { JobProfile } from "@/types"

// 简历内容验证
export const validateResumeContent = (content: string): void => {
  if (!content || typeof content !== 'string') {
    throw createError.invalidInput("简历内容不能为空")
  }
  
  if (content.length < 50) {
    throw createError.invalidInput("简历内容过短，至少需要50个字符")
  }
  
  if (content.length > 50000) {
    throw createError.invalidInput("简历内容过长，不能超过50000个字符")
  }
}

// 岗位数据验证
export const validateJobData = (jobData: any): JobProfile => {
  if (!jobData || typeof jobData !== 'object') {
    throw createError.invalidInput("岗位数据无效")
  }
  
  const { company, position, level, requirements = [] } = jobData
  
  // 验证必需字段
  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    throw createError.missingField("company")
  }
  
  if (!position || typeof position !== 'string' || position.trim().length === 0) {
    throw createError.missingField("position")
  }
  
  // 验证级别
  const validLevels = ['junior', 'mid', 'senior', 'lead', 'principal']
  if (!level || !validLevels.includes(level)) {
    throw createError.invalidInput(`级别必须是以下之一: ${validLevels.join(', ')}`)
  }
  
  // 验证要求数组
  if (!Array.isArray(requirements)) {
    throw createError.invalidInput("技术要求必须是数组格式")
  }
  
  // 验证字符串长度
  if (company.length > 100) {
    throw createError.invalidInput("公司名称不能超过100个字符")
  }
  
  if (position.length > 100) {
    throw createError.invalidInput("职位名称不能超过100个字符")
  }
  
  return {
    company: company.trim(),
    position: position.trim(),
    level,
    requirements: requirements.filter((req: any) => 
      typeof req === 'string' && req.trim().length > 0
    ),
    description: jobData.description?.trim(),
    skills: Array.isArray(jobData.skills) ? jobData.skills : []
  }
}

// 面试问题验证
export const validateInterviewQuestion = (question: any): void => {
  if (!question || typeof question !== 'object') {
    throw createError.invalidInput("面试问题数据无效")
  }
  
  const { content, type, difficulty } = question
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw createError.missingField("question content")
  }
  
  if (content.length > 2000) {
    throw createError.invalidInput("问题内容不能超过2000个字符")
  }
  
  const validTypes = ['technical', 'behavioral', 'system-design', 'coding']
  if (!type || !validTypes.includes(type)) {
    throw createError.invalidInput(`问题类型必须是以下之一: ${validTypes.join(', ')}`)
  }
  
  const validDifficulties = ['easy', 'medium', 'hard']
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    throw createError.invalidInput(`难度级别必须是以下之一: ${validDifficulties.join(', ')}`)
  }
}

// 用户答案验证
export const validateUserAnswer = (answer: string): void => {
  if (!answer || typeof answer !== 'string') {
    throw createError.invalidInput("用户回答不能为空")
  }
  
  if (answer.trim().length === 0) {
    throw createError.invalidInput("用户回答不能为空")
  }
  
  if (answer.length > 10000) {
    throw createError.invalidInput("回答内容不能超过10000个字符")
  }
}

// 文件验证
export const validateUploadFile = (file: File): void => {
  if (!file) {
    throw createError.invalidInput("请选择要上传的文件")
  }
  
  // 验证文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    throw createError.unsupportedFileType(['PDF', 'DOC', 'DOCX'])
  }
  
  // 验证文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw createError.fileSizeExceeded(10)
  }
  
  // 验证文件名
  if (file.name.length > 255) {
    throw createError.invalidInput("文件名过长")
  }
}

// AI分析结果验证
export const validateAIAnalysisResult = (result: any): void => {
  if (!result || typeof result !== 'object') {
    throw createError.invalidInput("AI分析结果无效")
  }
  
  // 验证必需的字段结构
  const requiredFields = ['techStack', 'techHighlights', 'experienceLevel']
  
  for (const field of requiredFields) {
    if (!(field in result)) {
      throw createError.invalidInput(`AI分析结果缺少必需字段: ${field}`)
    }
  }
  
  // 验证技术栈格式
  if (!Array.isArray(result.techStack)) {
    throw createError.invalidInput("技术栈必须是数组格式")
  }
  
  // 验证技术亮点格式
  if (!Array.isArray(result.techHighlights)) {
    throw createError.invalidInput("技术亮点必须是数组格式")
  }
  
  // 验证经验等级
  const validExperienceLevels = ['junior', 'mid', 'senior', 'lead']
  if (!validExperienceLevels.includes(result.experienceLevel)) {
    throw createError.invalidInput(`经验等级必须是以下之一: ${validExperienceLevels.join(', ')}`)
  }
}

// 分页参数验证
export const validatePaginationParams = (params: any): { page: number; pageSize: number } => {
  const page = parseInt(params.page) || 1
  const pageSize = parseInt(params.pageSize) || 10
  
  if (page < 1) {
    throw createError.invalidInput("页码必须大于0")
  }
  
  if (pageSize < 1 || pageSize > 100) {
    throw createError.invalidInput("每页大小必须在1-100之间")
  }
  
  return { page, pageSize }
}

// ID参数验证
export const validateId = (id: string, fieldName: string = 'id'): string => {
  if (!id || typeof id !== 'string') {
    throw createError.missingField(fieldName)
  }
  
  // 简单的ID格式验证（可以根据实际的ID格式调整）
  if (id.length < 3 || id.length > 50) {
    throw createError.invalidInput(`${fieldName} 格式无效`)
  }
  
  return id.trim()
}

// 评分验证
export const validateScore = (score: number, fieldName: string = 'score'): number => {
  if (typeof score !== 'number' || isNaN(score)) {
    throw createError.invalidInput(`${fieldName} 必须是有效数字`)
  }
  
  if (score < 0 || score > 100) {
    throw createError.invalidInput(`${fieldName} 必须在0-100之间`)
  }
  
  return score
}

// 通用对象验证
export const validateObject = (obj: any, requiredFields: string[]): void => {
  if (!obj || typeof obj !== 'object') {
    throw createError.invalidInput("数据格式无效")
  }
  
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      throw createError.missingField(field)
    }
  }
}