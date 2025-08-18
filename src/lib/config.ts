/**
 * 环境变量配置验证和管理
 */

interface Config {
  // 数据库配置
  DATABASE_URL: string;
  
  // 认证配置
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  
  // AI服务配置
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  
  // 应用配置
  NODE_ENV: string;
  UPLOAD_MAX_SIZE: number;
  
  // 面试配置
  INTERVIEW_DURATION_DEV: number;
  INTERVIEW_DURATION_PROD: number;
  
  // Redis配置（可选）
  REDIS_URL?: string;
}

class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

function validateConfig(): Config {
  const requiredEnvVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development'
  };

  // 检查必需的环境变量
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      throw new ConfigValidationError(`Missing required environment variable: ${key}`);
    }
  }

  // 检查至少有一个AI服务配置
  const aiKeys = [
    process.env.DEEPSEEK_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY
  ];
  
  if (!aiKeys.some(key => key && key.length > 0)) {
    console.warn('⚠️ Warning: No AI service API key configured. Some features may not work.');
  }

  // 解析数字配置
  const uploadMaxSize = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10);
  if (isNaN(uploadMaxSize)) {
    throw new ConfigValidationError('UPLOAD_MAX_SIZE must be a valid number');
  }

  const interviewDurationDev = parseInt(process.env.INTERVIEW_DURATION_DEV || '120', 10); // 2分钟
  const interviewDurationProd = parseInt(process.env.INTERVIEW_DURATION_PROD || '3600', 10); // 60分钟

  return {
    DATABASE_URL: requiredEnvVars.DATABASE_URL!,
    NEXTAUTH_URL: requiredEnvVars.NEXTAUTH_URL!,
    NEXTAUTH_SECRET: requiredEnvVars.NEXTAUTH_SECRET!,
    NODE_ENV: requiredEnvVars.NODE_ENV!,
    
    // AI服务配置
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    
    // 应用配置
    UPLOAD_MAX_SIZE: uploadMaxSize,
    INTERVIEW_DURATION_DEV: interviewDurationDev,
    INTERVIEW_DURATION_PROD: interviewDurationProd,
    
    // 可选配置
    REDIS_URL: process.env.REDIS_URL
  };
}

// 验证并导出配置
let config: Config;

try {
  config = validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error);
  throw error;
}

export { config };
export type { Config };

// 便捷的配置访问函数
export const getConfig = () => config;

export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';

export const getInterviewDuration = () => 
  isDevelopment() ? config.INTERVIEW_DURATION_DEV : config.INTERVIEW_DURATION_PROD;

export const hasAIService = () => 
  !!(config.DEEPSEEK_API_KEY || config.OPENAI_API_KEY || config.ANTHROPIC_API_KEY);

export const getAvailableAIServices = () => {
  const services = [];
  if (config.DEEPSEEK_API_KEY) services.push('deepseek');
  if (config.OPENAI_API_KEY) services.push('openai');
  if (config.ANTHROPIC_API_KEY) services.push('anthropic');
  return services;
};