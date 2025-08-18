// 智能面试问题生成器
// 基于简历技术栈和目标岗位生成个性化问题

interface TechQuestion {
  id: string
  content: string
  type: "technical" | "behavioral" | "system-design" | "coding"
  difficulty: "easy" | "medium" | "hard"
  techStack: string[]
  followUps?: string[]
}

interface JobProfile {
  company: string
  position: string
  level: string
  requirements?: string[]
}

interface ResumeProfile {
  techKeywords: string[]
  experienceLevel: string
  projects: any[]
  workExperience: any[]
}

// 技术栈问题库
const techQuestionBank: Record<string, TechQuestion[]> = {
  golang: [
    {
      id: "go-1",
      content: "请解释Go语言中的goroutine和channel，以及它们如何实现并发编程？",
      type: "technical",
      difficulty: "medium",
      techStack: ["golang", "concurrency"],
      followUps: ["如何避免goroutine泄露？", "channel的缓冲区大小如何选择？"]
    },
    {
      id: "go-2",
      content: "Go语言的内存管理机制是怎样的？请解释GC的工作原理。",
      type: "technical",
      difficulty: "hard",
      techStack: ["golang", "memory"],
      followUps: ["如何优化GC性能？", "什么情况下会产生内存泄露？"]
    },
    {
      id: "go-3",
      content: "请设计一个高并发的分布式任务调度系统，使用Go语言实现。",
      type: "system-design",
      difficulty: "hard",
      techStack: ["golang", "distributed", "system-design"]
    }
  ],
  distributed: [
    {
      id: "dist-1",
      content: "请解释CAP定理，并举例说明在实际系统中如何权衡？",
      type: "technical",
      difficulty: "medium",
      techStack: ["distributed", "theory"]
    },
    {
      id: "dist-2",
      content: "如何设计一个分布式锁？请比较不同的实现方案。",
      type: "system-design",
      difficulty: "hard",
      techStack: ["distributed", "redis", "zookeeper"]
    },
    {
      id: "dist-3",
      content: "请解释Raft或Paxos一致性算法的工作原理。",
      type: "technical",
      difficulty: "hard",
      techStack: ["distributed", "consensus"]
    }
  ],
  javascript: [
    {
      id: "js-1",
      content: "请解释JavaScript中的事件循环(Event Loop)机制。",
      type: "technical",
      difficulty: "medium",
      techStack: ["javascript", "nodejs"]
    },
    {
      id: "js-2",
      content: "什么是闭包？请举例说明闭包的实际应用场景。",
      type: "technical",
      difficulty: "easy",
      techStack: ["javascript"]
    },
    {
      id: "js-3",
      content: "请解释Promise、async/await的工作原理和使用场景。",
      type: "technical",
      difficulty: "medium",
      techStack: ["javascript", "async"]
    }
  ],
  react: [
    {
      id: "react-1",
      content: "请解释React Hooks的工作原理，以及useState和useEffect的使用。",
      type: "technical",
      difficulty: "medium",
      techStack: ["react", "javascript"]
    },
    {
      id: "react-2",
      content: "如何优化React应用的性能？请列举具体方法。",
      type: "technical",
      difficulty: "medium",
      techStack: ["react", "performance"]
    },
    {
      id: "react-3",
      content: "请设计一个大规模React应用的状态管理方案。",
      type: "system-design",
      difficulty: "hard",
      techStack: ["react", "state-management"]
    }
  ],
  nodejs: [
    {
      id: "node-1",
      content: "Node.js如何处理高并发请求？请解释其事件驱动模型。",
      type: "technical",
      difficulty: "medium",
      techStack: ["nodejs", "concurrency"]
    },
    {
      id: "node-2",
      content: "如何设计一个Node.js微服务架构？",
      type: "system-design",
      difficulty: "hard",
      techStack: ["nodejs", "microservices"]
    }
  ],
  kubernetes: [
    {
      id: "k8s-1",
      content: "请解释Kubernetes的核心组件和架构。",
      type: "technical",
      difficulty: "medium",
      techStack: ["kubernetes", "container"]
    },
    {
      id: "k8s-2",
      content: "如何在Kubernetes中实现服务的滚动更新和回滚？",
      type: "technical",
      difficulty: "medium",
      techStack: ["kubernetes", "deployment"]
    }
  ],
  redis: [
    {
      id: "redis-1",
      content: "Redis的持久化机制有哪些？各有什么优缺点？",
      type: "technical",
      difficulty: "medium",
      techStack: ["redis", "database"]
    },
    {
      id: "redis-2",
      content: "如何使用Redis实现分布式锁？需要注意什么问题？",
      type: "technical",
      difficulty: "hard",
      techStack: ["redis", "distributed"]
    }
  ],
  mysql: [
    {
      id: "mysql-1",
      content: "请解释MySQL的索引原理和优化策略。",
      type: "technical",
      difficulty: "medium",
      techStack: ["mysql", "database"]
    },
    {
      id: "mysql-2",
      content: "如何处理MySQL的主从复制延迟问题？",
      type: "technical",
      difficulty: "hard",
      techStack: ["mysql", "replication"]
    }
  ],
  mongodb: [
    {
      id: "mongo-1",
      content: "MongoDB的分片(Sharding)机制是如何工作的？",
      type: "technical",
      difficulty: "hard",
      techStack: ["mongodb", "distributed"]
    }
  ],
  docker: [
    {
      id: "docker-1",
      content: "Docker容器和虚拟机的区别是什么？各有什么优缺点？",
      type: "technical",
      difficulty: "easy",
      techStack: ["docker", "container"]
    }
  ],
  microservices: [
    {
      id: "micro-1",
      content: "请设计一个微服务架构的服务注册与发现机制。",
      type: "system-design",
      difficulty: "hard",
      techStack: ["microservices", "distributed"]
    }
  ],
  kafka: [
    {
      id: "kafka-1",
      content: "Kafka如何保证消息的顺序性和可靠性？",
      type: "technical",
      difficulty: "medium",
      techStack: ["kafka", "messaging"]
    }
  ],
  elasticsearch: [
    {
      id: "es-1",
      content: "Elasticsearch的倒排索引是如何工作的？",
      type: "technical",
      difficulty: "medium",
      techStack: ["elasticsearch", "search"]
    }
  ]
}

// 通用行为问题
const behavioralQuestions: TechQuestion[] = [
  {
    id: "beh-1",
    content: "请介绍一个您最有成就感的项目，包括技术挑战和解决方案。",
    type: "behavioral",
    difficulty: "easy",
    techStack: []
  },
  {
    id: "beh-2",
    content: "描述一次您在团队中解决技术分歧的经历。",
    type: "behavioral",
    difficulty: "medium",
    techStack: []
  },
  {
    id: "beh-3",
    content: "您如何保持技术学习和跟进新技术？",
    type: "behavioral",
    difficulty: "easy",
    techStack: []
  }
]

// 根据级别的问题难度分布
const difficultyDistribution: Record<string, { easy: number, medium: number, hard: number }> = {
  junior: { easy: 50, medium: 40, hard: 10 },
  mid: { easy: 20, medium: 50, hard: 30 },
  senior: { easy: 10, medium: 40, hard: 50 },
  expert: { easy: 5, medium: 30, hard: 65 }
}

// 技术栈映射和相关性
const techStackMapping: Record<string, string[]> = {
  // 编程语言
  go: ["golang"],
  golang: ["golang", "concurrency"],
  javascript: ["javascript", "nodejs"],
  typescript: ["javascript", "typescript"],
  python: ["python"],
  java: ["java", "spring"],
  
  // 前端技术
  react: ["react", "javascript", "typescript"],
  vue: ["vue", "javascript"],
  angular: ["angular", "typescript"],
  nextjs: ["react", "nodejs", "javascript"],
  
  // 后端技术
  nodejs: ["nodejs", "javascript"],
  spring: ["java", "spring"],
  django: ["python", "django"],
  
  // 数据库
  mysql: ["mysql", "database"],
  postgresql: ["postgresql", "database"],
  mongodb: ["mongodb", "nosql", "database"],
  redis: ["redis", "cache", "nosql"],
  
  // 分布式和云原生
  distributed: ["distributed", "microservices"],
  kubernetes: ["kubernetes", "docker", "container"],
  docker: ["docker", "container"],
  microservices: ["microservices", "distributed"],
  
  // 消息队列
  kafka: ["kafka", "messaging"],
  rabbitmq: ["rabbitmq", "messaging"],
  
  // 搜索引擎
  elasticsearch: ["elasticsearch", "search"],
  
  // 云平台
  aws: ["aws", "cloud"],
  gcp: ["gcp", "cloud"],
  azure: ["azure", "cloud"]
}

// 智能生成面试问题
export function generateInterviewQuestions(
  resume: ResumeProfile,
  job: JobProfile
): TechQuestion[] {
  const questions: TechQuestion[] = []
  const usedQuestionIds = new Set<string>()
  
  // 1. 分析技术栈匹配
  const relevantTechStacks = new Set<string>()
  
  // 从简历中提取技术栈
  resume.techKeywords.forEach(keyword => {
    const normalized = keyword.toLowerCase()
    relevantTechStacks.add(normalized)
    
    // 添加相关技术栈
    const related = techStackMapping[normalized]
    if (related) {
      related.forEach(tech => relevantTechStacks.add(tech))
    }
  })
  
  // 从岗位要求中提取技术栈
  if (job.requirements) {
    job.requirements.forEach(req => {
      const normalized = req.toLowerCase()
      relevantTechStacks.add(normalized)
      
      const related = techStackMapping[normalized]
      if (related) {
        related.forEach(tech => relevantTechStacks.add(tech))
      }
    })
  }
  
  // 2. 根据经验级别确定难度分布
  const level = job.level?.toLowerCase() || resume.experienceLevel?.toLowerCase() || "mid"
  const distribution = difficultyDistribution[level] || difficultyDistribution.mid
  
  // 计算每种难度的问题数量（总共生成5-7道题）
  const totalQuestions = 6
  const questionCounts = {
    easy: Math.round(totalQuestions * distribution.easy / 100),
    medium: Math.round(totalQuestions * distribution.medium / 100),
    hard: Math.round(totalQuestions * distribution.hard / 100)
  }
  
  // 确保至少有一道行为问题
  questionCounts.easy = Math.max(1, questionCounts.easy - 1)
  
  // 3. 收集相关技术问题
  const candidateQuestions: TechQuestion[] = []
  
  relevantTechStacks.forEach(tech => {
    const questions = techQuestionBank[tech]
    if (questions) {
      candidateQuestions.push(...questions)
    }
  })
  
  // 4. 按难度选择问题
  const selectQuestionsByDifficulty = (
    difficulty: "easy" | "medium" | "hard",
    count: number
  ) => {
    const filtered = candidateQuestions.filter(
      q => q.difficulty === difficulty && !usedQuestionIds.has(q.id)
    )
    
    // 按相关性排序（技术栈匹配度）
    filtered.sort((a, b) => {
      const aRelevance = a.techStack.filter(t => relevantTechStacks.has(t)).length
      const bRelevance = b.techStack.filter(t => relevantTechStacks.has(t)).length
      return bRelevance - aRelevance
    })
    
    const selected = filtered.slice(0, count)
    selected.forEach(q => {
      questions.push(q)
      usedQuestionIds.add(q.id)
    })
    
    return selected.length
  }
  
  // 5. 添加一道行为问题
  const behavioralIndex = Math.floor(Math.random() * behavioralQuestions.length)
  questions.push(behavioralQuestions[behavioralIndex])
  
  // 6. 选择技术问题
  let selectedCount = 1 // 已经有一道行为问题
  
  // 优先选择中等难度
  selectedCount += selectQuestionsByDifficulty("medium", questionCounts.medium)
  
  // 然后选择困难
  selectedCount += selectQuestionsByDifficulty("hard", questionCounts.hard)
  
  // 最后选择简单
  selectedCount += selectQuestionsByDifficulty("easy", questionCounts.easy)
  
  // 7. 如果问题不够，生成通用问题
  if (questions.length < 3) {
    // 添加一些通用的技术问题
    const generalQuestions: TechQuestion[] = [
      {
        id: "gen-1",
        content: `请介绍您在${job.position || "这个岗位"}相关的项目经验。`,
        type: "behavioral",
        difficulty: "easy",
        techStack: []
      },
      {
        id: "gen-2",
        content: "您如何处理生产环境的紧急故障？请举例说明。",
        type: "technical",
        difficulty: "medium",
        techStack: []
      },
      {
        id: "gen-3",
        content: "请设计一个您熟悉的系统架构，并解释技术选型。",
        type: "system-design",
        difficulty: "hard",
        techStack: []
      }
    ]
    
    generalQuestions.forEach(q => {
      if (!usedQuestionIds.has(q.id) && questions.length < totalQuestions) {
        questions.push(q)
        usedQuestionIds.add(q.id)
      }
    })
  }
  
  return questions
}

// 生成追问
export function generateFollowUpQuestion(
  originalQuestion: TechQuestion,
  userAnswer: string
): string | null {
  if (originalQuestion.followUps && originalQuestion.followUps.length > 0) {
    // 随机选择一个追问
    const index = Math.floor(Math.random() * originalQuestion.followUps.length)
    return originalQuestion.followUps[index]
  }
  
  // 根据答案长度生成通用追问
  if (userAnswer.length < 100) {
    return "能否详细展开说明一下？"
  }
  
  return null
}

// 评估答案质量（简单示例）
export function evaluateAnswer(
  question: TechQuestion,
  answer: string
): {
  score: number
  feedback: string
} {
  // 这里应该接入真实的AI评估
  // 现在使用简单的规则
  
  const answerLength = answer.trim().length
  const hasKeywords = question.techStack.some(tech => 
    answer.toLowerCase().includes(tech.toLowerCase())
  )
  
  let score = 50 // 基础分
  let feedback = ""
  
  // 长度评分
  if (answerLength < 50) {
    score -= 20
    feedback = "回答过于简短，建议提供更多细节。"
  } else if (answerLength > 200) {
    score += 20
    feedback = "回答详细充分。"
  } else {
    score += 10
    feedback = "回答长度适中。"
  }
  
  // 关键词评分
  if (hasKeywords) {
    score += 20
    feedback += " 涵盖了相关技术要点。"
  }
  
  // 难度加成
  if (question.difficulty === "hard") {
    score = Math.min(100, score + 10)
  } else if (question.difficulty === "easy") {
    score = Math.min(100, score + 5)
  }
  
  return {
    score: Math.min(100, Math.max(0, score)),
    feedback
  }
}