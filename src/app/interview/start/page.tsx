"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, CheckCircle, ArrowRight } from "lucide-react"

interface Question {
  id: string
  content: string
  type: string
  difficulty: string
  topics?: string[]
}

interface EvaluationResult {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  suggestions: string[]
}

export default function InterviewStartPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"loading" | "interview" | "completed" | "error">("loading")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [error, setError] = useState<string>("")
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [jobData, setJobData] = useState<any>(null)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null)
  const [questionDetails, setQuestionDetails] = useState<any[]>([]) // 存储每道题的详细信息
  
  // 面试计时器状态
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null)
  // 使用配置管理的面试时长
  const INTERVIEW_DURATION = process.env.NODE_ENV === 'development' ? 2 * 60 : 60 * 60
  const [remainingTime, setRemainingTime] = useState<number>(INTERVIEW_DURATION)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerWarningShown, setTimerWarningShown] = useState(false)

  useEffect(() => {
    // 加载岗位信息
    const savedJobData = sessionStorage.getItem("jobSetup")
    if (savedJobData) {
      setJobData(JSON.parse(savedJobData))
    }

    // 智能生成面试题目
    generateQuestions()
  }, [])

  // 计时器效果
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1
          
          // 根据总时长动态调整警告时间
          const warningTime1 = Math.floor(INTERVIEW_DURATION * 0.17) // 约1/6时间时警告
          const warningTime2 = Math.floor(INTERVIEW_DURATION * 0.05) // 约1/20时间时警告
          
          if (newTime <= warningTime1 && newTime > warningTime2 && !timerWarningShown) {
            setTimerWarningShown(true)
            alert(`⏰ 面试剩余${formatTime(newTime)}，请注意时间安排！`)
          }
          
          if (newTime <= warningTime2 && newTime > 0) {
            alert(`⚠️ 面试剩余${formatTime(newTime)}，建议开始总结！`)
          }
          
          // 时间到了
          if (newTime <= 0) {
            setIsTimerRunning(false)
            handleInterviewTimeout()
            return 0
          }
          
          return newTime
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, remainingTime, timerWarningShown])

  // 开始计时器
  const startTimer = () => {
    const startTime = new Date()
    setInterviewStartTime(startTime)
    setIsTimerRunning(true)
  }

  // 暂停/恢复计时器
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  // 时间到期处理
  const handleInterviewTimeout = () => {
    alert("⏰ 面试时间已到！系统将自动提交并生成报告。")
    handleFinishInterview()
  }

  // 格式化剩余时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 获取时间显示颜色
  const getTimeColor = (seconds: number) => {
    if (seconds <= 2 * 60) return "text-red-600" // 红色：剩余2分钟
    if (seconds <= 10 * 60) return "text-orange-500" // 橙色：剩余10分钟
    return "text-green-600" // 绿色：充足时间
  }

  const generateQuestions = async () => {
    try {
      // 获取岗位信息
      const savedJobData = sessionStorage.getItem("jobSetup")
      if (!savedJobData) {
        alert("请先设置目标岗位信息")
        router.push("/job-setup")
        return
      }

      const jobData = JSON.parse(savedJobData)
      
      // 调用智能生成API
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobData })
      })

      const result = await response.json()
      
      if (result.success && result.questions) {
        setQuestions(result.questions)
        setInterviewId(result.interviewId)
        setCurrentStep("interview")
        // 自动开始计时
        startTimer()
      } else {
        throw new Error(result.error || "AI面试问题生成失败")
      }
    } catch (error) {
      console.error("生成题目失败:", error)
      setError("AI服务不可用，无法生成面试问题。请稍后重试或联系系统管理员。")
      setCurrentStep("error")
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("请输入您的回答")
      return
    }

    setIsSubmitting(true)
    
    try {
      // 保存答案
      const newAnswers = [...answers]
      newAnswers[currentQuestionIndex] = userAnswer
      setAnswers(newAnswers)

      // 调用AI评估API
      if (interviewId && questions[currentQuestionIndex]) {
        const response = await fetch("/api/interview/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            questionId: questions[currentQuestionIndex].id,
            answer: userAnswer,
            interviewId
          })
        })

        const result = await response.json()
        if (result.success) {
          setCurrentEvaluation(result.evaluation)
          setFollowUpQuestion(result.followUp)
          
          // 保存当前题目的详细信息
          const currentQuestion = questions[currentQuestionIndex]
          const questionDetail = {
            questionId: currentQuestion.id,
            question: currentQuestion.content,
            type: currentQuestion.type,
            difficulty: currentQuestion.difficulty,
            category: currentQuestion.category,
            userAnswer: userAnswer,
            evaluation: result.evaluation,
            followUp: result.followUp,
            answeredAt: new Date().toISOString()
          }
          
          setQuestionDetails(prev => [...prev, questionDetail])
          
          // 显示评估结果2秒
          setTimeout(() => {
            // 检查是否是最后一题
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1)
              setUserAnswer("")
              setCurrentEvaluation(null)
              setFollowUpQuestion(null)
            } else {
              // 面试完成，生成报告
              generateReport()
            }
          }, 2000)
        }
      } else {
        // 没有interviewId时的备用处理
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1)
          setUserAnswer("")
        } else {
          setCurrentStep("completed")
        }
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("提交失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateReport = async () => {
    try {
      if (interviewId) {
        const response = await fetch("/api/interview/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ interviewId })
        })

        const result = await response.json()
        if (result.success) {
          // 保存报告到sessionStorage
          sessionStorage.setItem("interviewReport", JSON.stringify(result.report))
        }
      }
      setCurrentStep("completed")
    } catch (error) {
      console.error("Report generation error:", error)
      setCurrentStep("completed")
    }
  }

  const handleFinishInterview = () => {
    // 停止计时器
    setIsTimerRunning(false)
    
    // 计算总用时
    const totalTimeUsed = INTERVIEW_DURATION - remainingTime // 秒
    const endTime = new Date()
    
    // 保存面试结果
    const interviewResult = {
      jobData,
      questions,
      answers,
      questionDetails, // 包含每道题的详细信息和评估结果
      timing: {
        startTime: interviewStartTime?.toISOString(),
        endTime: endTime.toISOString(),
        totalTimeUsed, // 秒
        totalTimeUsedFormatted: formatTime(totalTimeUsed),
        remainingTime,
        remainingTimeFormatted: formatTime(remainingTime),
        completed: remainingTime > 0 ? "normal" : "timeout" // 正常完成或超时
      },
      interviewId,
      completedAt: endTime.toISOString()
    }
    sessionStorage.setItem("interviewResult", JSON.stringify(interviewResult))
    router.push("/report")
  }

  if (currentStep === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <CardTitle className="text-red-600">AI服务不可用</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full"
              onClick={() => {
                setError("")
                setCurrentStep("loading")
                generateQuestions()
              }}
            >
              重试生成问题
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => router.push("/job-setup")}
            >
              返回岗位设置
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <MessageSquare className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <CardTitle>AI正在准备面试题目</CardTitle>
            <CardDescription>
              根据您的简历和目标岗位，正在生成个性化的面试内容...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={66} className="w-full" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              预计还需要几秒钟
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>面试完成！</CardTitle>
            <CardDescription>
              恭喜您完成了模拟面试，AI正在生成详细的评估报告...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  回答了 {questions.length} 道问题
                </div>
                <div className="text-sm text-muted-foreground">
                  用时: {formatTime(INTERVIEW_DURATION - remainingTime)} / {formatTime(INTERVIEW_DURATION)}
                </div>
                {remainingTime > 0 && (
                  <div className="text-xs text-green-600">
                    ✨ 在时限内完成面试
                  </div>
                )}
              </div>
              <Button 
                className="w-full"
                onClick={handleFinishInterview}
              >
                查看面试报告
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">第3步: AI模拟面试</h1>
            
            {/* 计时器显示 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">剩余时间:</span>
                <div className={`font-mono text-lg font-bold ${getTimeColor(remainingTime)}`}>
                  {formatTime(remainingTime)}
                </div>
                <button
                  onClick={toggleTimer}
                  className={`px-2 py-1 text-xs rounded ${
                    isTimerRunning 
                      ? "bg-orange-100 text-orange-600 hover:bg-orange-200" 
                      : "bg-green-100 text-green-600 hover:bg-green-200"
                  }`}
                  title={isTimerRunning ? "暂停计时" : "继续计时"}
                >
                  {isTimerRunning ? "⏸️ 暂停" : "▶️ 继续"}
                </button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                问题 {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>
          </div>
          
          {/* 进度条和时间进度 */}
          <div className="mt-2 space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>问题进度</span>
              <span>面试时长: {formatTime(INTERVIEW_DURATION - remainingTime)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 当前问题 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  面试问题 {currentQuestionIndex + 1}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {currentQuestion?.type}
                  </Badge>
                  <Badge variant={
                    currentQuestion?.difficulty === "easy" ? "secondary" :
                    currentQuestion?.difficulty === "medium" ? "default" : "destructive"
                  }>
                    {currentQuestion?.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">
                {currentQuestion?.content}
              </p>
            </CardContent>
          </Card>

          {/* 答案输入 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                您的回答
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="请在这里输入您的回答..."
                rows={8}
                disabled={isSubmitting}
                className="mb-4"
              />
              
              {/* 显示AI评估结果 */}
              {currentEvaluation && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">AI评估</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {currentEvaluation.score}分
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">{currentEvaluation.feedback}</p>
                  {followUpQuestion && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>追问：</strong>{followUpQuestion}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {userAnswer.length} 字符
                </div>
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !userAnswer.trim()}
                >
                  {isSubmitting ? "AI评估中..." : 
                   currentQuestionIndex < questions.length - 1 ? "下一题" : "完成面试"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 面试进度 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">面试进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div 
                    key={q.id}
                    className={`flex items-center gap-3 p-2 rounded ${
                      index === currentQuestionIndex ? "bg-primary/10" :
                      index < currentQuestionIndex ? "bg-green-50" : ""
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === currentQuestionIndex ? "bg-primary text-primary-foreground" :
                      index < currentQuestionIndex ? "bg-green-500 text-white" :
                      "bg-muted"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-sm">
                      问题 {index + 1} - {q.type}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}