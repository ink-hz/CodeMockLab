import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export interface ParsedResume {
  rawText: string
  techKeywords: string[]
  projects: Array<{
    name: string
    description: string
    technologies: string[]
  }>
  workExperience: Array<{
    company: string
    position: string
    duration: string
    description: string
  }>
  experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL'
  education?: Array<{
    school: string
    degree: string
    major: string
  }>
  skills: string[]
}

const TECH_KEYWORDS = [
  // 编程语言
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  // 前端技术
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SCSS', 'Less',
  // 后端技术
  'Node.js', 'Express', 'Nest.js', 'Spring', 'Django', 'Flask', 'Laravel', 'Rails', 'ASP.NET',
  // 数据库
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Elasticsearch',
  // 云服务
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'GitHub', 'GitLab',
  // 其他技术
  'GraphQL', 'REST API', 'WebSocket', 'Microservices', 'DevOps', 'Linux', 'Nginx', 'Apache'
]

export async function parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
  let rawText = ''
  
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer)
      rawText = data.text
    } else if (mimeType.includes('word')) {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    } else {
      throw new Error('Unsupported file type')
    }

    // 提取技术关键词
    const techKeywords = extractTechKeywords(rawText)
    
    // 提取项目经验
    const projects = extractProjects(rawText)
    
    // 提取工作经验
    const workExperience = extractWorkExperience(rawText)
    
    // 推断经验级别
    const experienceLevel = inferExperienceLevel(rawText, workExperience)
    
    // 提取教育背景
    const education = extractEducation(rawText)
    
    // 提取技能
    const skills = extractSkills(rawText)

    return {
      rawText,
      techKeywords,
      projects,
      workExperience,
      experienceLevel,
      education,
      skills
    }
  } catch (error) {
    console.error('Resume parsing error:', error)
    throw new Error('Failed to parse resume')
  }
}

function extractTechKeywords(text: string): string[] {
  const lowerText = text.toLowerCase()
  const found = TECH_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
  return [...new Set(found)] // 去重
}

function extractProjects(text: string): Array<{name: string, description: string, technologies: string[]}> {
  const projects: Array<{name: string, description: string, technologies: string[]}> = []
  
  // 简单的项目提取逻辑 - 可以后续用AI优化
  const projectSections = text.match(/项目经验|项目经历|主要项目|Project/gi)
  if (projectSections) {
    // 基础项目信息提取
    const lines = text.split('\n')
    let inProjectSection = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.match(/项目|project/i) && line.length < 100) {
        const techsInLine = extractTechKeywords(line)
        if (techsInLine.length > 0) {
          projects.push({
            name: line.replace(/[：:]/g, '').trim(),
            description: lines[i + 1] || '',
            technologies: techsInLine
          })
        }
      }
    }
  }
  
  return projects.slice(0, 5) // 最多5个项目
}

function extractWorkExperience(text: string): Array<{company: string, position: string, duration: string, description: string}> {
  const experience: Array<{company: string, position: string, duration: string, description: string}> = []
  
  // 工作经验提取逻辑
  const lines = text.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 匹配公司和职位信息
    if (line.match(/工程师|开发|程序员|架构师|技术|CTO|CIO|主管|经理/)) {
      const dateMatch = line.match(/(\d{4}[-年]\d{1,2}|\d{4})/)
      if (dateMatch) {
        experience.push({
          company: extractCompanyName(line),
          position: extractPosition(line),
          duration: dateMatch[0],
          description: lines[i + 1] || ''
        })
      }
    }
  }
  
  return experience.slice(0, 10) // 最多10个工作经历
}

function extractCompanyName(text: string): string {
  // 简单的公司名提取
  const companies = ['腾讯', '阿里', '百度', '字节', '美团', '京东', '网易', '滴滴', '小米', '华为']
  for (const company of companies) {
    if (text.includes(company)) {
      return company
    }
  }
  return text.split(' ')[0] || '未知公司'
}

function extractPosition(text: string): string {
  const positions = ['高级工程师', '资深工程师', '工程师', '架构师', '技术专家', '开发工程师', '前端工程师', '后端工程师']
  for (const position of positions) {
    if (text.includes(position)) {
      return position
    }
  }
  return '工程师'
}

function inferExperienceLevel(text: string, workExperience: any[]): 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL' {
  const lowerText = text.toLowerCase()
  
  // 根据关键词判断级别
  if (lowerText.includes('首席') || lowerText.includes('principal') || lowerText.includes('架构师')) {
    return 'PRINCIPAL'
  }
  if (lowerText.includes('技术专家') || lowerText.includes('lead') || lowerText.includes('团队负责人')) {
    return 'LEAD'
  }
  if (lowerText.includes('资深') || lowerText.includes('高级') || lowerText.includes('senior')) {
    return 'SENIOR'
  }
  if (workExperience.length >= 3) {
    return 'MID'
  }
  
  return 'JUNIOR'
}

function extractEducation(text: string): Array<{school: string, degree: string, major: string}> {
  const education: Array<{school: string, degree: string, major: string}> = []
  
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.match(/大学|学院|university|college/i)) {
      education.push({
        school: line.trim(),
        degree: extractDegree(line),
        major: extractMajor(line)
      })
    }
  }
  
  return education
}

function extractDegree(text: string): string {
  if (text.includes('博士') || text.includes('PhD')) return '博士'
  if (text.includes('硕士') || text.includes('Master')) return '硕士'
  if (text.includes('本科') || text.includes('Bachelor')) return '本科'
  return '学士'
}

function extractMajor(text: string): string {
  const majors = ['计算机', '软件工程', '信息技术', '电子', '通信', '数学', '物理']
  for (const major of majors) {
    if (text.includes(major)) {
      return major
    }
  }
  return '计算机相关'
}

function extractSkills(text: string): string[] {
  const skills = extractTechKeywords(text)
  
  // 添加软技能识别
  const softSkills = ['团队协作', '沟通能力', '项目管理', '敏捷开发', 'Scrum', '产品设计', 'UI/UX']
  const lowerText = text.toLowerCase()
  
  for (const skill of softSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill)
    }
  }
  
  return [...new Set(skills)]
}