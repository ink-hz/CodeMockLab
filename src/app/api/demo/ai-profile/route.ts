import { NextRequest, NextResponse } from "next/server"
import { PrivacyFilter, ResumePreprocessor } from "@/lib/privacy-filter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: "缺少简历内容" },
        { status: 400 }
      )
    }

    console.log("=== AI简历解析演示 ===")
    console.log(`原始内容长度: ${content.length}`)

    // 1. 隐私过滤演示
    const filtered = PrivacyFilter.filterResumeContent(content)
    console.log(`过滤后长度: ${filtered.filteredText.length}`)
    console.log(`移除的敏感信息: ${filtered.removedFields.join(', ')}`)

    // 2. 预处理演示
    const preprocessed = ResumePreprocessor.preprocessForAI(content)

    // 3. 模拟AI分析结果
    const mockAIProfile = {
      // 技术栈评估
      techStack: [
        {
          technology: "React",
          category: "框架",
          proficiency: "高级",
          valueScore: 95,
          evidenceCount: 3,
          lastUsed: "2024年"
        },
        {
          technology: "TypeScript", 
          category: "语言",
          proficiency: "高级",
          valueScore: 92,
          evidenceCount: 4,
          lastUsed: "2024年"
        },
        {
          technology: "Node.js",
          category: "平台",
          proficiency: "中级",
          valueScore: 88,
          evidenceCount: 2,
          lastUsed: "2024年"
        },
        {
          technology: "PostgreSQL",
          category: "数据库", 
          proficiency: "中级",
          valueScore: 85,
          evidenceCount: 2,
          lastUsed: "2023年"
        }
      ],

      // 技术亮点
      techHighlights: [
        "具备现代前端技术栈的深度经验",
        "熟练掌握TypeScript和类型安全开发",
        "有全栈开发和系统设计经验",
        "具备良好的工程化和最佳实践意识"
      ],

      // 项目经验分析
      projectAnalysis: [
        {
          projectName: "企业级前端应用",
          description: "使用React+TypeScript构建的大型企业应用",
          techStack: ["React", "TypeScript", "Webpack", "Jest"],
          complexity: "复杂",
          impact: "支撑千万级用户访问",
          role: "前端架构师",
          highlights: ["微前端架构设计", "性能优化", "团队协作"]
        },
        {
          projectName: "全栈开发项目",
          description: "基于Node.js的全栈应用开发",
          techStack: ["Node.js", "PostgreSQL", "Docker"],
          complexity: "中等",
          impact: "提升团队开发效率30%",
          role: "全栈工程师", 
          highlights: ["API设计", "数据库优化", "部署自动化"]
        }
      ],

      // 技能评估
      skillAssessment: {
        technical: 88,
        communication: 82,
        leadership: 75,
        learning: 90,
        problemSolving: 85
      },

      // 经验等级评估
      experienceLevel: "senior",
      experienceLevelConfidence: 0.85,

      // 技术专长领域
      specializations: ["前端开发", "全栈开发", "性能优化"],

      // 职业发展建议
      careerSuggestions: [
        "可以向前端架构师方向发展",
        "建议深入学习云原生技术",
        "考虑提升团队管理能力",
        "可以专精某个技术领域成为专家"
      ],

      // 岗位匹配分析
      roleMatchingAnalysis: {
        "前端开发工程师": 95,
        "全栈开发工程师": 88,
        "前端架构师": 82,
        "技术负责人": 75
      }
    }

    return NextResponse.json({
      success: true,
      message: "AI简历解析演示完成",
      originalLength: content.length,
      filteredLength: filtered.filteredText.length,
      privacyInfo: {
        removedFields: filtered.removedFields,
        sensitiveInfo: filtered.sensitiveInfo
      },
      preprocessed: {
        processedContent: preprocessed.processedContent.substring(0, 500) + "...", // 只返回部分内容
        metadata: preprocessed.metadata
      },
      aiProfile: mockAIProfile,
      analysis: {
        强项: "现代前端技术栈经验丰富，具备高价值技能",
        潜力: "有向架构师或技术负责人发展的潜力",
        建议: "继续深化技术深度，同时提升软技能"
      }
    })

  } catch (error) {
    console.error("AI简历解析演示失败:", error)
    return NextResponse.json(
      { error: "演示失败" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // 返回演示用的简历文本
  const demoResume = `张三
前端开发工程师
手机：13800138000
邮箱：zhangsan@example.com
地址：北京市朝阳区某某街道123号

教育经历：
2018-2022 清华大学计算机科学与技术专业 本科

工作经验：
2022-2024 字节跳动 前端开发工程师
- 负责企业级React应用开发，用户量超过1000万
- 使用TypeScript进行类型安全开发，提升代码质量
- 参与微前端架构设计，提升开发效率30%
- 熟练使用Webpack、Vite等构建工具

2021-2022 腾讯 前端实习生
- 参与小程序开发，掌握Vue.js框架
- 协助Node.js后端接口开发
- 使用PostgreSQL进行数据库设计

技能特长：
- 前端技术：React、Vue.js、TypeScript、JavaScript、HTML5、CSS3
- 后端技术：Node.js、Express、Koa
- 数据库：PostgreSQL、MySQL、Redis
- 工具链：Webpack、Vite、Docker、Git
- 其他：微前端、性能优化、单元测试

项目经历：
1. 企业级CRM系统前端
   - 技术栈：React + TypeScript + Ant Design
   - 负责架构设计和核心功能开发
   - 处理复杂的业务逻辑和状态管理

2. 电商平台全栈开发
   - 前端：Vue.js + Element UI
   - 后端：Node.js + PostgreSQL
   - 实现完整的用户管理和订单系统

自我评价：
具备扎实的前端技术基础，有丰富的React和TypeScript开发经验。熟悉全栈开发，能够独立完成项目从设计到部署的全流程。有良好的团队协作能力和学习能力，能够快速适应新技术。`

  return NextResponse.json({
    success: true,
    demoResume,
    usage: {
      method: "POST",
      endpoint: "/api/demo/ai-profile",
      body: {
        content: "简历文本内容"
      }
    }
  })
}