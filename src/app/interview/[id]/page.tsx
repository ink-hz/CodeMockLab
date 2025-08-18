"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, MessageSquare, Send, ChevronRight, Star } from "lucide-react"

interface Question {
  id: string
  content: string
  type: string
  difficulty: string
  category: string
}

interface Evaluation {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  suggestedResources: string[]
}

export default function InterviewPage() {
  const params = useParams()
  const interviewId = params.id as string
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [interviewCompleted, setInterviewCompleted] = useState(false)

  useEffect(() => {
    loadInterviewData()
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadInterviewData = async () => {
    try {
      const response = await fetch(`/api/interview/${interviewId}`)
      const data = await response.json()
      if (data.success) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Failed to load interview data:', error)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('请输入您的答案')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: questions[currentQuestionIndex].id,
          userAnswer: userAnswer.trim(),
          userId: 'temp-user-id' // 实际应从session获取
        }),
      })

      const result = await response.json()
      if (result.success) {
        setEvaluation(result.evaluation)
        setFollowUpQuestions(result.followUpQuestions || [])
        
        if (result.roundCompleted) {
          setInterviewCompleted(true)
        }
      }
    } catch (error) {
      alert('提交答案失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setUserAnswer("")
      setEvaluation(null)
      setFollowUpQuestions([])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">正在加载面试题目...</p>
        </div>
      </div>
    )
  }

  if (interviewCompleted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🎉 面试完成！</CardTitle>
            <CardDescription>
              恭喜您完成了本次模拟面试，总用时 {formatTime(timeElapsed)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {evaluation?.score || 0}分
            </div>
            <p className="text-muted-foreground">
              {evaluation?.feedback}
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={() => window.location.href = '/dashboard'}>
                返回首页
              </Button>
              <Button variant="outline" onClick={() => window.location.href = `/interview/${interviewId}/report`}>
                查看详细报告
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 面试头部信息 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">模拟面试进行中</h1>
            <p className="text-muted-foreground">
              问题 {currentQuestionIndex + 1} / {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>
        <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 主要内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 当前问题 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  问题 {currentQuestionIndex + 1}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getDifficultyColor(currentQuestion.difficulty)}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="secondary">
                    {currentQuestion.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 答案输入区 */}
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
                placeholder="请输入您的回答..."
                rows={10}
                disabled={isSubmitting || evaluation !== null}
                className="mb-4"
              />
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {userAnswer.length} 字符
                </div>
                {!evaluation && (
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !userAnswer.trim()}
                  >
                    {isSubmitting ? "提交中..." : "提交答案"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 评估结果 */}
          {evaluation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  评估结果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">
                    {evaluation.score}分
                  </div>
                  <div className="flex-1">
                    <Progress value={evaluation.score} className="h-2" />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">总体评价</h4>
                  <p className="text-muted-foreground">{evaluation.feedback}</p>
                </div>

                {evaluation.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700">优点</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index} className="text-sm">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.improvements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-700">改进建议</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {evaluation.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm">{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button onClick={handleNextQuestion}>
                      下一题
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setInterviewCompleted(true)}>
                      完成面试
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 追问 */}
          {followUpQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>面试官追问</CardTitle>
                <CardDescription>
                  基于您的回答，面试官可能会继续询问以下问题
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {followUpQuestions.map((question, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{question}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          {/* 面试进度 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">面试进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`flex items-center gap-3 p-2 rounded ${
                      index === currentQuestionIndex
                        ? 'bg-primary/10 border border-primary/20'
                        : index < currentQuestionIndex
                        ? 'bg-green-50 text-green-700'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === currentQuestionIndex
                        ? 'bg-primary text-primary-foreground'
                        : index < currentQuestionIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        问题 {index + 1}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {question.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 面试提示 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 答题提示</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• 先理解问题，再组织答案</p>
                <p>• 回答要有逻辑性和条理性</p>
                <p>• 结合具体例子说明</p>
                <p>• 不确定时可以说出思考过程</p>
                <p>• 主动询问是否需要补充</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}