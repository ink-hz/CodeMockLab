"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
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
  source?: string // 题目来源：generated | ai-bank
  originalCategory?: string // AI题库的原始分类
  category?: string
  userAnswer?: string // 用户已有答案
  modelAnswer?: string // AI最佳答案
  score?: number // AI评分
  feedback?: string // AI反馈
  hasAnswer?: boolean // 是否已回答
  hasEvaluation?: boolean // 是否已评估
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
  const searchParams = useSearchParams()
  const interviewMode = searchParams.get('mode') || 'ai-bank' // ai-bank | ai-generate
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
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)
  const [showPreviousAnswer, setShowPreviousAnswer] = useState(false)
  const [isReAnswering, setIsReAnswering] = useState(false)
  const [bestAnswerUpdate, setBestAnswerUpdate] = useState<any>(null)
  const [showContributionPrompt, setShowContributionPrompt] = useState(false)
  const [isContributing, setIsContributing] = useState(false)
  
  // 面试计时器状态
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null)
  // 根据面试模式设置不同的时长
  // AI内置题库: 12小时 (50+道题目)
  // AI实时生成: 1小时 (5道题目) 
  const INTERVIEW_DURATION = interviewMode === 'ai-generate' ? 1 * 60 * 60 : 12 * 60 * 60
  const [remainingTime, setRemainingTime] = useState<number>(INTERVIEW_DURATION)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerWarningShown, setTimerWarningShown] = useState(false)

  useEffect(() => {
    // AI实时生成模式需要加载岗位信息
    if (interviewMode === 'ai-generate') {
      const savedJobData = sessionStorage.getItem("jobSetup")
      if (savedJobData) {
        setJobData(JSON.parse(savedJobData))
      }
    }

    // 智能生成面试题目
    generateQuestions()
  }, [])

  // 加载题目的已有答案数据
  const loadQuestionData = async (questionId: string) => {
    if (!questionId) return

    setIsLoadingQuestion(true)
    try {
      const response = await fetch("/api/interview/get-question-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ questionId })
      })

      const result = await response.json()
      
      if (result.success && result.question) {
        const questionData = result.question
        
        // 更新当前题目的数据
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? {
            ...q,
            userAnswer: questionData.userAnswer,
            modelAnswer: questionData.modelAnswer,
            score: questionData.score,
            feedback: questionData.feedback,
            hasAnswer: questionData.hasAnswer,
            hasEvaluation: questionData.hasEvaluation
          } : q
        ))

        // 如果有已回答的内容，显示历史答案
        if (questionData.hasAnswer) {
          setUserAnswer(questionData.userAnswer || "")
          setShowPreviousAnswer(true)
          
          // 如果有评估结果，也显示
          if (questionData.hasEvaluation && questionData.score !== null) {
            setCurrentEvaluation({
              score: questionData.score,
              feedback: questionData.feedback || "",
              strengths: [],
              improvements: [],
              suggestions: []
            })
          }
        }
      }
    } catch (error) {
      console.error("加载题目数据失败:", error)
    } finally {
      setIsLoadingQuestion(false)
    }
  }

  // 监听当前题目变化，加载题目数据
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQ = questions[currentQuestionIndex]
      if (currentQ && currentQ.id) {
        loadQuestionData(currentQ.id)
      }
    }
  }, [currentQuestionIndex, questions.length])

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
      let jobData = null
      
      // AI实时生成模式需要岗位信息
      if (interviewMode === 'ai-generate') {
        const savedJobData = sessionStorage.getItem("jobSetup")
        if (!savedJobData) {
          alert("请先设置目标岗位信息")
          router.push("/job-setup?next=interview")
          return
        }
        jobData = JSON.parse(savedJobData)
      }
      
      // 根据模式调用不同的API
      const apiEndpoint = interviewMode === 'ai-generate' 
        ? "/api/interview/generate-realtime"
        : "/api/interview/generate"
      
      const requestBody = interviewMode === 'ai-generate'
        ? { jobData, mode: 'generate-only' } // 只生成新题目
        : { mode: 'ai-bank-only' } // 只使用AI题库，不需要jobData
      
      // 调用智能生成API
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      if (result.success && result.questions) {
        setQuestions(result.questions)
        setInterviewId(result.interviewId)
        setCurrentStep("interview")
        
        // 🚀 异步生成最佳答案（不阻塞用户界面）
        generateBestAnswersAsync(result.interviewId)
        
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

  // 异步生成最佳答案
  const generateBestAnswersAsync = async (interviewId: string) => {
    try {
      console.log("🚀 开始异步生成最佳答案...")
      const response = await fetch("/api/interview/generate-best-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ interviewId })
      })

      const result = await response.json()
      if (result.success) {
        console.log(`✅ 已启动${result.totalQuestions}道题的最佳答案生成`)
      } else {
        console.error("❌ 最佳答案生成启动失败:", result.error)
      }
    } catch (error) {
      console.error("❌ 最佳答案生成请求失败:", error)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("请输入您的回答")
      return
    }

    setIsSubmitting(true)
    setBestAnswerUpdate(null)
    
    try {
      const currentQuestion = questions[currentQuestionIndex]
      const isResubmit = showPreviousAnswer || isReAnswering
      
      console.log(`${isResubmit ? '重新' : '首次'}回答题目: ${currentQuestion.id}`)

      // 保存答案
      const newAnswers = [...answers]
      newAnswers[currentQuestionIndex] = userAnswer
      setAnswers(newAnswers)

      // 调用AI评估API
      if (interviewId && currentQuestion) {
        const response = await fetch("/api/interview/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            answer: userAnswer,
            interviewId
          })
        })

        const result = await response.json()
        if (result.success) {
          setCurrentEvaluation(result.evaluation)
          setFollowUpQuestion(result.followUp)
          
          // 智能提示：如果是重新回答且得分较高，提示用户可以贡献答案改进
          if (isResubmit && result.evaluation.score >= 88) {
            setShowContributionPrompt(true)
            console.log(`🎯 高质量答案 (${result.evaluation.score}分)，显示贡献提示`)
          }
          
          // 保存当前题目的详细信息
          const questionDetail = {
            questionId: currentQuestion.id,
            question: currentQuestion.content,
            type: currentQuestion.type,
            difficulty: currentQuestion.difficulty,
            category: currentQuestion.category,
            userAnswer: userAnswer,
            evaluation: result.evaluation,
            followUp: result.followUp,
            answeredAt: new Date().toISOString(),
            isReAnswer: isResubmit
          }
          
          setQuestionDetails(prev => {
            // 如果是重新回答，替换之前的记录
            const filtered = prev.filter(q => q.questionId !== currentQuestion.id)
            return [...filtered, questionDetail]
          })
          
          // 更新题目状态
          setQuestions(prev => prev.map(q => 
            q.id === currentQuestion.id ? {
              ...q,
              userAnswer: userAnswer,
              score: result.evaluation.score,
              feedback: result.evaluation.feedback,
              hasAnswer: true,
              hasEvaluation: true
            } : q
          ))

          // 显示评估结果3秒（重新回答时显示更长时间）
          const displayTime = isResubmit ? 4000 : 2000
          setTimeout(() => {
            if (isResubmit) {
              // 重新回答后，允许继续修改或跳转
              setIsReAnswering(false)
              setShowPreviousAnswer(true) // 保持显示历史答案状态
            } else {
              // 首次回答，正常跳转
              if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1)
                setUserAnswer("")
                setCurrentEvaluation(null)
                setFollowUpQuestion(null)
                setShowPreviousAnswer(false)
              } else {
                // 面试完成，生成报告
                generateReport()
              }
            }
          }, displayTime)
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

  // 开始重新回答
  const handleReAnswer = () => {
    setIsReAnswering(true)
    setCurrentEvaluation(null)
    setFollowUpQuestion(null)
    setBestAnswerUpdate(null)
    setShowContributionPrompt(false)
    // 保留之前的答案在输入框中，用户可以修改
  }

  // 跳转到下一题（已回答题目）
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setUserAnswer("")
      setCurrentEvaluation(null)
      setFollowUpQuestion(null)
      setShowPreviousAnswer(false)
      setIsReAnswering(false)
      setBestAnswerUpdate(null)
      setShowContributionPrompt(false)
    } else {
      // 面试完成
      generateReport()
    }
  }

  // 手动触发最佳答案对比和更新
  const handleContributeAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion || !userAnswer.trim()) {
      return
    }

    setIsContributing(true)
    setBestAnswerUpdate(null)
    
    try {
      console.log("🚀 用户主动触发最佳答案对比...")
      const updateResponse = await fetch("/api/interview/update-best-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          newAnswer: userAnswer,
          questionType: currentQuestion.type,
          difficulty: currentQuestion.difficulty,
          topics: currentQuestion.topics || []
        })
      })

      const updateResult = await updateResponse.json()
      if (updateResult.success) {
        setBestAnswerUpdate(updateResult)
        console.log(`✅ 对比完成：${updateResult.updated ? '已更新' : '保持不变'} - ${updateResult.reason}`)
        
        // 隐藏贡献提示，显示结果
        setShowContributionPrompt(false)
      } else {
        console.error("❌ 最佳答案对比失败:", updateResult.error)
        setBestAnswerUpdate({
          success: false,
          message: "对比服务暂时不可用，请稍后再试"
        })
      }
    } catch (error) {
      console.error("❌ 最佳答案对比请求失败:", error)
      setBestAnswerUpdate({
        success: false,
        message: "网络连接失败，请检查网络后重试"
      })
    } finally {
      setIsContributing(false)
    }
  }

  // 拒绝贡献答案
  const handleDeclineContribution = () => {
    setShowContributionPrompt(false)
    console.log("📝 用户选择暂不贡献答案")
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

  // 下载报告
  const handleDownloadReport = async () => {
    if (!interviewId) {
      alert("面试ID不存在，无法下载报告")
      return
    }

    try {
      console.log("开始下载面试报告...")
      
      // 创建下载链接
      const downloadUrl = `/api/interview/download-report?interviewId=${interviewId}`
      
      // 创建临时链接并触发下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `面试报告_${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log("✅ 报告下载已启动")
    } catch (error) {
      console.error("❌ 下载报告失败:", error)
      alert("下载报告失败，请稍后重试")
    }
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
            <CardTitle>
              {interviewMode === 'ai-generate' ? 'AI正在实时生成题目' : 'AI正在准备题库面试'}
            </CardTitle>
            <CardDescription>
              {interviewMode === 'ai-generate' 
                ? '正在根据您的简历和目标岗位实时生成全新题目，请稍候...'
                : '正在从您的个性化题库中选取题目并补充生成，请稍候...'}
            </CardDescription>
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {interviewMode === 'ai-generate' ? '🚀 实时生成模式' : '📚 AI内置题库模式'}
              </div>
            </div>
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
              
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleFinishInterview}
                >
                  查看面试报告
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {interviewId && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownloadReport()}
                  >
                    📄 下载完整报告 (HTML)
                  </Button>
                )}
              </div>
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
                  {/* 题目来源标识 */}
                  <Badge variant={currentQuestion?.source === "ai-bank" ? "default" : "outline"}>
                    {currentQuestion?.source === "ai-bank" ? "AI题库" : "实时生成"}
                  </Badge>
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
              {/* AI题库的原始分类信息 */}
              {currentQuestion?.source === "ai-bank" && currentQuestion?.originalCategory && (
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium">考察领域：</span>
                  {currentQuestion.originalCategory}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">
                {currentQuestion?.content}
              </p>
              {/* 显示相关技术点 */}
              {currentQuestion?.topics && currentQuestion.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {currentQuestion.topics.map((topic: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 答案输入 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {showPreviousAnswer && !isReAnswering ? "历史回答" : 
                   isReAnswering ? "重新回答" : "您的回答"}
                </CardTitle>
                {showPreviousAnswer && !isReAnswering && (
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      已回答 {currentQuestion?.score || 0}分
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReAnswer}
                      disabled={isLoadingQuestion}
                    >
                      🔄 重新回答
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingQuestion && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                  <div className="animate-pulse">加载题目数据中...</div>
                </div>
              )}
              
              {/* 显示历史答案对比（已回答但未重新回答时） */}
              {showPreviousAnswer && !isReAnswering && currentQuestion?.hasAnswer && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-900">您之前的回答</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">
                        {currentQuestion.score || 0}分
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-green-800 whitespace-pre-wrap mb-3 max-h-32 overflow-y-auto">
                    {currentQuestion.userAnswer || "无内容"}
                  </div>
                  {currentQuestion.feedback && (
                    <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                      <strong>AI反馈：</strong>{currentQuestion.feedback}
                    </div>
                  )}
                </div>
              )}

              {/* 显示AI最佳答案（如果有的话） */}
              {showPreviousAnswer && !isReAnswering && currentQuestion?.modelAnswer && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">AI最佳答案示例</span>
                    <Badge variant="outline" className="text-xs">
                      参考标准
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {currentQuestion.modelAnswer}
                  </div>
                </div>
              )}

              {/* 答案输入框 */}
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={
                  showPreviousAnswer && !isReAnswering 
                    ? "点击「重新回答」来修改您的答案..." 
                    : "请在这里输入您的回答..."
                }
                rows={8}
                disabled={isSubmitting || (showPreviousAnswer && !isReAnswering)}
                className="mb-4"
              />
              
              {/* 显示AI评估结果 */}
              {currentEvaluation && (isReAnswering || !showPreviousAnswer) && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">
                      {isReAnswering ? "新的AI评估" : "AI评估"}
                    </span>
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

              {/* 智能贡献提示 */}
              {showContributionPrompt && currentEvaluation && currentEvaluation.score >= 88 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-lg">🎯</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-blue-900">
                          优秀答案发现！
                        </span>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {currentEvaluation.score}分
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-800 mb-3">
                        您的回答获得了{currentEvaluation.score}分的高分！要不要看看能否改进现有的最佳答案？这将帮助其他学习者获得更好的参考。
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleContributeAnswer}
                          disabled={isContributing}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isContributing ? "对比中..." : "🚀 贡献答案改进"}
                        </Button>
                        <Button 
                          onClick={handleDeclineContribution}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300"
                        >
                          暂不需要
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 显示最佳答案更新结果 */}
              {bestAnswerUpdate && (
                <div className={`mb-4 p-4 rounded-lg ${
                  bestAnswerUpdate.success === false 
                    ? 'bg-red-50 border border-red-200'
                    : bestAnswerUpdate.updated 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-semibold ${
                      bestAnswerUpdate.success === false 
                        ? 'text-red-900'
                        : bestAnswerUpdate.updated ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {bestAnswerUpdate.success === false 
                        ? '❌ 对比失败'
                        : bestAnswerUpdate.updated ? '🎉 最佳答案已更新' : '📊 最佳答案保持不变'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {bestAnswerUpdate.success === false ? '系统错误' : 'AI对比结果'}
                    </Badge>
                  </div>
                  <p className={`text-sm mb-2 ${
                    bestAnswerUpdate.success === false 
                      ? 'text-red-800'
                      : bestAnswerUpdate.updated ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {bestAnswerUpdate.message}
                  </p>
                  {bestAnswerUpdate.confidenceScore && (
                    <div className="text-xs text-muted-foreground">
                      置信度: {bestAnswerUpdate.confidenceScore}%
                    </div>
                  )}
                  {bestAnswerUpdate.success !== false && (
                    <div className="text-xs text-muted-foreground mt-2">
                      💡 感谢您的贡献！{bestAnswerUpdate.updated ? '您的回答已被采纳' : '继续加油，您的回答已经很棒了'}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {userAnswer.length} 字符
                  {showPreviousAnswer && !isReAnswering && (
                    <span className="ml-3 text-green-600">✓ 已完成</span>
                  )}
                </div>
                
                {showPreviousAnswer && !isReAnswering ? (
                  // 已回答状态的按钮
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleReAnswer}
                      disabled={isLoadingQuestion}
                    >
                      🔄 重新回答
                    </Button>
                    <Button 
                      onClick={handleNextQuestion}
                      disabled={isLoadingQuestion}
                    >
                      {currentQuestionIndex < questions.length - 1 ? "下一题" : "完成面试"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // 正在回答状态的按钮
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !userAnswer.trim()}
                  >
                    {isSubmitting ? "AI评估中..." : 
                     isReAnswering ? "重新提交" :
                     currentQuestionIndex < questions.length - 1 ? "下一题" : "完成面试"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 面试进度 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">面试进度</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    总计 {questions.length} 道题目 - {questions.filter(q => q.source === 'generated').length} 道实时生成，
                    {questions.filter(q => q.source === 'ai-bank').length} 道AI题库
                  </div>
                </div>
                {interviewId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadReport()}
                    className="text-xs"
                  >
                    📄 下载报告
                  </Button>
                )}
              </div>
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
                      q.hasAnswer ? "bg-green-500 text-white" :
                      index < currentQuestionIndex ? "bg-orange-500 text-white" :
                      "bg-muted"
                    }`}>
                      {q.hasAnswer ? "✓" : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        问题 {index + 1} - {q.type}
                        {q.hasAnswer && q.score !== null && (
                          <span className="ml-2 text-green-600 font-medium">
                            {q.score}分
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge 
                          variant={q.source === "ai-bank" ? "default" : "outline"} 
                          className="text-xs h-4 px-1"
                        >
                          {q.source === "ai-bank" ? "AI题库" : "实时"}
                        </Badge>
                        {q.hasAnswer && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs h-4 px-1"
                          >
                            已回答
                          </Badge>
                        )}
                        {q.originalCategory && (
                          <span className="text-xs text-muted-foreground truncate">
                            {q.originalCategory}
                          </span>
                        )}
                      </div>
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