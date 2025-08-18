// 简化的AI交互日志系统
// 只在控制台输出AI交互过程，便于后台查看

export type AIOperationType = "GENERATE_QUESTIONS" | "EVALUATE_ANSWER" | "GENERATE_FOLLOWUP" | "GENERATE_REPORT"

interface AILogData {
  userId?: string
  interviewId?: string
  operation: AIOperationType
  prompt: string
  response?: string
  duration?: number
  tokensUsed?: number
  cost?: number
  status: "success" | "error" | "fallback"
  error?: string
}

class SimpleLogger {
  // AI交互日志 - 重点关注
  logAI(data: AILogData) {
    const timestamp = new Date().toISOString()
    const statusIcon = data.status === "success" ? "✅" : 
                      data.status === "error" ? "❌" : "⚠️"
    
    console.log("\n" + "=".repeat(80))
    console.log(`${statusIcon} [AI-${data.operation}] ${timestamp}`)
    console.log(`用户: ${data.userId || "未知"} | 面试: ${data.interviewId || "无"}`)
    
    if (data.status === "success") {
      console.log(`✅ AI调用成功`)
      console.log(`⏱️  响应时间: ${data.duration || 0}ms`)
      console.log(`🔤 Token消耗: ${data.tokensUsed || 0}`)
      console.log(`💰 成本: ¥${(data.cost || 0).toFixed(4)}`)
    } else if (data.status === "error") {
      console.log(`❌ AI调用失败: ${data.error}`)
    } else {
      console.log(`⚠️  使用备用方案`)
    }
    
    // 显示prompt摘要
    console.log(`📝 Prompt摘要: ${data.prompt.substring(0, 150)}...`)
    
    // 显示response摘要
    if (data.response) {
      console.log(`🤖 Response摘要: ${data.response.substring(0, 150)}...`)
    }
    
    console.log("=".repeat(80) + "\n")
    
    // 如果是生成问题，特别标注
    if (data.operation === "GENERATE_QUESTIONS") {
      if (data.status === "success") {
        console.log("🎯 确认：使用AI生成的个性化面试问题")
      } else {
        console.log("⚠️  注意：使用备用问题库，非AI生成")
      }
      console.log("")
    }
  }

  // 简单的系统日志
  info(message: string, context?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[INFO] ${timestamp} - ${message}`)
    if (context) {
      console.log("└─", JSON.stringify(context, null, 2))
    }
  }

  error(message: string, context?: any) {
    const timestamp = new Date().toISOString()
    console.error(`[ERROR] ${timestamp} - ${message}`)
    if (context) {
      console.error("└─", JSON.stringify(context, null, 2))
    }
  }
  
  warn(message: string, context?: any) {
    const timestamp = new Date().toISOString()
    console.warn(`[WARN] ${timestamp} - ${message}`)
    if (context) {
      console.warn("└─", JSON.stringify(context, null, 2))
    }
  }
}

// 单例导出
export const logger = new SimpleLogger()

// 简化的AI追踪装饰器
export function trackAI(operation: AIOperationType) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor | undefined) {
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyName) || {
        configurable: true,
        enumerable: false,
        writable: true,
        value: target[propertyName]
      }
    }
    
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      let logData: AILogData = {
        operation,
        prompt: "",
        status: "error"
      }

      try {
        // 提取上下文信息
        if (args.length > 0) {
          if (typeof args[0] === "string") {
            logData.prompt = args[0]
          } else if (args[0] && typeof args[0] === "object") {
            logData.userId = args[0].userId
            logData.interviewId = args[0].interviewId
          }
        }

        const result = await method.apply(this, args)
        
        logData.status = "success"
        logData.duration = Date.now() - startTime
        logData.response = typeof result === "string" ? result : JSON.stringify(result)

        // 记录AI交互日志
        logger.logAI(logData)

        return result
      } catch (error) {
        logData.status = "error"
        logData.duration = Date.now() - startTime
        logData.error = error instanceof Error ? error.message : String(error)

        // 记录错误
        logger.logAI(logData)
        
        throw error
      }
    }

    // If we created a new descriptor, we need to define it on the target
    if (!Object.getOwnPropertyDescriptor(target, propertyName)) {
      Object.defineProperty(target, propertyName, descriptor)
    }

    return descriptor
  }
}