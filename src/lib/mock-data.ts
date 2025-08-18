// 演示模式：内存数据存储
// 用于快速预览项目功能

export const mockUsers = [
  {
    id: "user-1",
    email: "demo@example.com",
    name: "演示用户",
    password: "$2a$10$hash", // 实际会被哈希
    profile: {
      experienceLevel: "MID",
      techStack: ["React", "TypeScript", "Node.js"],
      targetRoles: ["前端工程师"],
      targetCompanies: ["腾讯", "阿里"],
      weakAreas: []
    }
  }
]

export const mockQuestions = [
  {
    id: "q1",
    content: "请解释 React Hooks 的工作原理，特别是 useState 和 useEffect。",
    type: "TECHNICAL_KNOWLEDGE",
    difficulty: "MEDIUM",
    category: "React",
    modelAnswer: "React Hooks 是函数式组件中使用状态和生命周期的机制..."
  },
  {
    id: "q2", 
    content: "如何实现一个高效的算法来查找数组中的重复元素？",
    type: "CODING",
    difficulty: "MEDIUM", 
    category: "算法",
    modelAnswer: "可以使用哈希表或排序的方法..."
  },
  {
    id: "q3",
    content: "描述一下你在团队项目中遇到的最大挑战，以及你是如何解决的？",
    type: "BEHAVIORAL",
    difficulty: "MEDIUM",
    category: "行为面试",
    modelAnswer: "这是一个开放性问题，主要考查沟通能力和问题解决能力..."
  }
]

export const mockInterviews = [
  {
    id: "interview-1",
    userId: "user-1",
    type: "TECHNICAL",
    status: "COMPLETED",
    questions: mockQuestions,
    report: {
      overallScore: 78,
      technicalScore: 82,
      communicationScore: 75,
      strengths: ["技术基础扎实", "思路清晰"],
      weaknesses: ["需要更多实践经验"],
      recommendations: ["多做算法练习", "参与开源项目"]
    }
  }
]