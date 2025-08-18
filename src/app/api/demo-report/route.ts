import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // 生成演示用的面试报告数据
  const demoReportData = {
    jobData: {
      company: "字节跳动",
      position: "高级前端工程师",
      level: "senior",
      requirements: ["React", "TypeScript", "Vue", "Webpack", "Node.js"]
    },
    questions: [
      {
        id: "demo-1",
        content: "请详细解释React Fiber架构的工作原理及其对性能优化的影响。",
        type: "technical",
        difficulty: "hard",
        category: "React, 性能优化"
      },
      {
        id: "demo-2", 
        content: "设计一个支持百万级QPS的前端监控系统，需要考虑哪些关键架构决策？",
        type: "system-design",
        difficulty: "hard",
        category: "系统设计, 性能监控"
      },
      {
        id: "demo-3",
        content: "如何利用Webpack实现微前端架构下的代码隔离和共享？",
        type: "technical", 
        difficulty: "hard",
        category: "Webpack, 微前端"
      },
      {
        id: "demo-4",
        content: "描述TypeScript中的高级类型系统如何帮助构建大型前端应用。",
        type: "technical",
        difficulty: "medium", 
        category: "TypeScript"
      },
      {
        id: "demo-5",
        content: "你在项目中是如何进行性能优化的？请举具体例子。",
        type: "behavioral",
        difficulty: "medium",
        category: "项目经验"
      }
    ],
    answers: [
      "React Fiber是React 16引入的新协调算法，它将渲染工作分解为小的工作单元，可以被中断和恢复。主要解决了之前同步渲染导致的阻塞问题，通过时间切片和优先级调度实现了更流畅的用户体验。",
      "设计百万级QPS的前端监控系统需要考虑：1）数据采集的低侵入性 2）本地缓存和批量上报 3）采样策略降低数据量 4）CDN边缘节点部署 5）实时和离线分析分离 6）告警系统和可视化大屏。",
      "使用Webpack Module Federation可以实现微前端的代码隔离和共享。通过配置ModuleFederationPlugin，可以将应用拆分为Host和Remote，实现运行时的动态模块加载，同时保证依赖隔离和共享库优化。",
      "TypeScript的高级类型系统包括泛型、联合类型、交叉类型、条件类型等，可以在编译期进行类型检查，减少运行时错误。在大型应用中可以通过interface、type alias等构建清晰的类型体系，提高代码可维护性。",
      "在项目中我主要从几个方面进行性能优化：1）代码分割和懒加载减少首屏资源 2）使用React.memo和useMemo避免不必要渲染 3）图片懒加载和WebP格式优化 4）CDN加速和Gzip压缩 5）监控Core Web Vitals指标。"
    ],
    questionDetails: [
      {
        questionId: "demo-1",
        question: "请详细解释React Fiber架构的工作原理及其对性能优化的影响。",
        type: "technical",
        difficulty: "hard",
        category: "React, 性能优化",
        userAnswer: "React Fiber是React 16引入的新协调算法，它将渲染工作分解为小的工作单元，可以被中断和恢复。主要解决了之前同步渲染导致的阻塞问题，通过时间切片和优先级调度实现了更流畅的用户体验。",
        evaluation: {
          score: 85,
          feedback: "回答展现了对React Fiber架构的良好理解，准确描述了时间切片和优先级调度等核心概念。可以进一步深入解释Fiber节点的数据结构和调度算法的具体实现。",
          strengths: ["准确理解核心概念", "回答结构清晰"],
          improvements: ["可以更深入技术细节", "建议举具体例子"],
          suggestions: ["深入学习React源码", "了解浏览器渲染原理"]
        },
        answeredAt: new Date().toISOString()
      },
      {
        questionId: "demo-2",
        question: "设计一个支持百万级QPS的前端监控系统，需要考虑哪些关键架构决策？",
        type: "system-design", 
        difficulty: "hard",
        category: "系统设计, 性能监控",
        userAnswer: "设计百万级QPS的前端监控系统需要考虑：1）数据采集的低侵入性 2）本地缓存和批量上报 3）采样策略降低数据量 4）CDN边缘节点部署 5）实时和离线分析分离 6）告警系统和可视化大屏。",
        evaluation: {
          score: 92,
          feedback: "优秀的系统设计思路，涵盖了高QPS系统的核心要素：数据采集、传输、存储、分析各环节都有考虑。展现了很强的架构设计能力。",
          strengths: ["系统性思维", "覆盖全链路", "考虑实际可行性"],
          improvements: ["可以具体说明技术选型", "成本控制方面可以补充"],
          suggestions: ["学习大厂监控系统架构", "了解时序数据库原理"]
        },
        answeredAt: new Date().toISOString()
      },
      {
        questionId: "demo-3",
        question: "如何利用Webpack实现微前端架构下的代码隔离和共享？",
        type: "technical",
        difficulty: "hard", 
        category: "Webpack, 微前端",
        userAnswer: "使用Webpack Module Federation可以实现微前端的代码隔离和共享。通过配置ModuleFederationPlugin，可以将应用拆分为Host和Remote，实现运行时的动态模块加载，同时保证依赖隔离和共享库优化。",
        evaluation: {
          score: 88,
          feedback: "准确掌握了Webpack Module Federation的核心概念，理解Host/Remote架构模式。回答展现了对微前端架构的深入理解。",
          strengths: ["技术方案准确", "理解架构模式"],
          improvements: ["可以提及版本管理问题", "补充具体配置示例"],
          suggestions: ["实践搭建微前端项目", "学习single-spa等框架"]
        },
        answeredAt: new Date().toISOString()
      },
      {
        questionId: "demo-4",
        question: "描述TypeScript中的高级类型系统如何帮助构建大型前端应用。",
        type: "technical",
        difficulty: "medium",
        category: "TypeScript", 
        userAnswer: "TypeScript的高级类型系统包括泛型、联合类型、交叉类型、条件类型等，可以在编译期进行类型检查，减少运行时错误。在大型应用中可以通过interface、type alias等构建清晰的类型体系，提高代码可维护性。",
        evaluation: {
          score: 80,
          feedback: "对TypeScript类型系统有基本了解，提到了主要的类型特性。在大型应用场景的阐述比较到位。",
          strengths: ["类型概念清晰", "联系实际应用场景"],
          improvements: ["可以举具体应用例子", "类型编程技巧可以更深入"],
          suggestions: ["学习TypeScript高级类型编程", "研究优秀开源项目的类型设计"]
        },
        answeredAt: new Date().toISOString()
      },
      {
        questionId: "demo-5",
        question: "你在项目中是如何进行性能优化的？请举具体例子。",
        type: "behavioral",
        difficulty: "medium",
        category: "项目经验",
        userAnswer: "在项目中我主要从几个方面进行性能优化：1）代码分割和懒加载减少首屏资源 2）使用React.memo和useMemo避免不必要渲染 3）图片懒加载和WebP格式优化 4）CDN加速和Gzip压缩 5）监控Core Web Vitals指标。",
        evaluation: {
          score: 83,
          feedback: "涵盖了前端性能优化的主要方面，从构建优化到运行时优化都有提及。体现了良好的工程实践经验。",
          strengths: ["覆盖面广", "实践性强", "有监控意识"],
          improvements: ["可以提供具体数据支撑", "用户体验角度可以补充"],
          suggestions: ["深入学习浏览器渲染原理", "掌握性能分析工具使用"]
        },
        answeredAt: new Date().toISOString()
      }
    ],
    timing: {
      startTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(), 
      totalTimeUsed: 480, // 8分钟
      totalTimeUsedFormatted: "8:00",
      remainingTime: 3120, // 52分钟
      remainingTimeFormatted: "52:00",
      completed: "normal"
    },
    interviewId: "demo-interview-id",
    completedAt: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    demoData: demoReportData
  })
}

export async function POST(request: NextRequest) {
  // 将演示数据设置到sessionStorage中（通过前端）
  return NextResponse.json({ success: true, message: "请通过GET方法获取演示数据" })
}