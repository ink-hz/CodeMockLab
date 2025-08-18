/**
 * 项目通用类型定义
 */

// 基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 简历相关类型
export interface ResumeProfile {
  techKeywords: string[];
  experienceLevel: string;
  projects: ProjectInfo[];
  workExperience: WorkExperience[];
}

export interface ProjectInfo {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  duration?: string;
  achievements?: string[];
}

export interface WorkExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
  technologies?: string[];
}

// 岗位相关类型
export interface JobProfile {
  company: string;
  position: string;
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  requirements: string[];
  description?: string;
  skills?: string[];
}

// AI技术画像类型
export interface TechStackItem {
  technology: string;
  category: '语言' | '框架' | '工具' | '平台' | '数据库' | '其他';
  proficiency: '初级' | '中级' | '高级' | '专家';
  valueScore: number; // 0-100
  evidenceCount: number;
  lastUsed?: string;
}

export interface ProjectAnalysis {
  projectName: string;
  description: string;
  techStack: string[];
  complexity: '简单' | '中等' | '复杂' | '高级';
  impact: string;
  role: string;
  highlights: string[];
}

export interface SkillAssessment {
  technical: number;
  communication: number;
  leadership: number;
  learning: number;
  problemSolving: number;
}

export interface AIProfile {
  // 技术栈评估
  techStack: TechStackItem[];
  
  // 技术亮点
  techHighlights: string[];
  
  // 项目经验分析
  projectAnalysis: ProjectAnalysis[];
  
  // 技能评估
  skillAssessment: SkillAssessment;
  
  // 经验等级评估
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  experienceLevelConfidence: number; // 0-1
  
  // 技术专长领域
  specializations: string[];
  
  // 职业发展建议
  careerSuggestions: string[];
  
  // 岗位匹配分析
  roleMatchingAnalysis: Record<string, number>;
  
  // 原始分析数据
  rawAnalysis?: any;
}

// 面试相关类型
export interface InterviewQuestion {
  id: string;
  content: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  expectedKeywords?: string[];
  followUps?: string[];
  evaluationCriteria?: string;
  category?: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

export interface QuestionDetail {
  questionId: string;
  question: string;
  type: string;
  difficulty: string;
  category?: string;
  userAnswer: string;
  evaluation?: EvaluationResult;
  followUp?: string;
  answeredAt: string;
}

export interface InterviewTiming {
  startTime?: string;
  endTime?: string;
  totalTimeUsed: number; // 秒
  totalTimeUsedFormatted: string;
  remainingTime: number;
  remainingTimeFormatted: string;
  completed: 'normal' | 'timeout';
}

export interface InterviewResult {
  jobData: JobProfile;
  questions: InterviewQuestion[];
  answers: string[];
  questionDetails: QuestionDetail[];
  timing: InterviewTiming;
  interviewId?: string;
  completedAt: string;
}

// 报告相关类型
export interface InterviewReport {
  overallScore: number;
  scores: {
    technical: number;
    communication: number;
    problemSolving: number;
  };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  questionAnalysis: Array<{
    question: string;
    userAnswer: string;
    score: number;
    feedback: string;
    type?: string;
    difficulty?: string;
  }>;
}

// DeepSeek AI 相关类型
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 文件上传相关类型
export interface UploadResult {
  success: boolean;
  resumeId?: string;
  parsedContent?: {
    content: string;
    techKeywords: string[];
    projects: ProjectInfo[];
    workExperience: WorkExperience[];
  };
  error?: string;
}

// 隐私过滤相关类型
export interface FilteredResumeContent {
  filteredText: string;
  removedFields: string[];
  sensitiveInfo: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasAddress: boolean;
    hasIdNumber: boolean;
  };
}

export interface PreprocessMetadata {
  originalLength: number;
  filteredLength: number;
  removedFields: string[];
  hasContactInfo: boolean;
}