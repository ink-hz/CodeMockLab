/**
 * 统一错误处理机制
 */

import { NextResponse } from "next/server"
import { logger } from "@/lib/simple-logger"

// 错误类型定义
export enum ErrorCode {
  // 认证相关
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 输入验证相关
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 业务逻辑相关
  RESUME_NOT_FOUND = 'RESUME_NOT_FOUND',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  INTERVIEW_NOT_FOUND = 'INTERVIEW_NOT_FOUND',
  
  // 系统相关
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  
  // 文件相关
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE'
}

// 自定义错误类
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: any

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

// 预定义的错误创建函数
export const createError = (message: string, statusCode: number = 500) => 
  new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, statusCode)

export const errorFactory = {
  unauthorized: (message = "未授权访问") => 
    new AppError(message, ErrorCode.UNAUTHORIZED, 401),
    
  forbidden: (message = "无权限访问") => 
    new AppError(message, ErrorCode.FORBIDDEN, 403),
    
  invalidInput: (message = "输入数据无效", details?: any) => 
    new AppError(message, ErrorCode.INVALID_INPUT, 400, true, details),
    
  missingField: (fieldName: string) => 
    new AppError(`缺少必需字段: ${fieldName}`, ErrorCode.MISSING_REQUIRED_FIELD, 400),
    
  resumeNotFound: (message = "简历未找到") => 
    new AppError(message, ErrorCode.RESUME_NOT_FOUND, 404),
    
  aiServiceUnavailable: (message = "AI服务不可用") => 
    new AppError(message, ErrorCode.AI_SERVICE_UNAVAILABLE, 503),
    
  databaseError: (message = "数据库操作失败", details?: any) => 
    new AppError(message, ErrorCode.DATABASE_ERROR, 500, true, details),
    
  fileUploadError: (message = "文件上传失败") => 
    new AppError(message, ErrorCode.FILE_UPLOAD_ERROR, 400),
    
  fileSizeExceeded: (maxSize: number) => 
    new AppError(`文件大小超过限制 (${maxSize}MB)`, ErrorCode.FILE_SIZE_EXCEEDED, 400),
    
  unsupportedFileType: (supportedTypes: string[]) => 
    new AppError(`不支持的文件类型，支持: ${supportedTypes.join(', ')}`, ErrorCode.UNSUPPORTED_FILE_TYPE, 400)
}

// 错误处理中间件函数
export function handleApiError(error: unknown): NextResponse {
  // 记录错误
  logger.error('API Error:', error)

  // 如果是自定义错误
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      },
      { status: error.statusCode }
    )
  }

  // 如果是数据库错误
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any
    
    // Prisma 错误处理
    if (dbError.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: "数据重复，记录已存在",
          code: ErrorCode.DATABASE_ERROR
        },
        { status: 409 }
      )
    }
    
    if (dbError.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: "记录未找到",
          code: ErrorCode.DATABASE_ERROR
        },
        { status: 404 }
      )
    }
  }

  // 通用错误
  return NextResponse.json(
    {
      success: false,
      error: "服务器内部错误",
      code: ErrorCode.INTERNAL_SERVER_ERROR
    },
    { status: 500 }
  )
}

// API包装器函数，自动处理错误
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// 异步操作错误处理装饰器
export function asyncErrorHandler<T extends any[], R>(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: T): Promise<R> {
    try {
      return await originalMethod.apply(this, args)
    } catch (error) {
      logger.error(`Error in ${target.constructor.name}.${propertyKey}:`, error)
      throw error
    }
  }

  return descriptor
}

// 验证工具函数
export const validate = {
  required: (value: any, fieldName: string) => {
    if (value === undefined || value === null || value === '') {
      throw errorFactory.missingField(fieldName)
    }
  },
  
  string: (value: any, fieldName: string) => {
    if (typeof value !== 'string') {
      throw errorFactory.invalidInput(`${fieldName} 必须是字符串`)
    }
  },
  
  number: (value: any, fieldName: string) => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw errorFactory.invalidInput(`${fieldName} 必须是有效数字`)
    }
  },
  
  email: (value: string, fieldName: string = 'email') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw errorFactory.invalidInput(`${fieldName} 格式无效`)
    }
  },
  
  array: (value: any, fieldName: string) => {
    if (!Array.isArray(value)) {
      throw errorFactory.invalidInput(`${fieldName} 必须是数组`)
    }
  },
  
  minLength: (value: string, minLength: number, fieldName: string) => {
    if (value.length < minLength) {
      throw errorFactory.invalidInput(`${fieldName} 长度不能少于 ${minLength} 个字符`)
    }
  },
  
  maxLength: (value: string, maxLength: number, fieldName: string) => {
    if (value.length > maxLength) {
      throw errorFactory.invalidInput(`${fieldName} 长度不能超过 ${maxLength} 个字符`)
    }
  }
}

// 成功响应工具函数
export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

export function successResponseWithPagination<T>(
  data: T[],
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  },
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination,
    message
  })
}