"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { BarChart3, TrendingUp, TrendingDown, Star, RotateCcw, Home, Download, Eye, EyeOff } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ReportPage() {
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [bestAnswers, setBestAnswers] = useState<any[]>([])
  const [isLoadingBestAnswers, setIsLoadingBestAnswers] = useState(false)
  const [showBestAnswers, setShowBestAnswers] = useState<{[key: number]: boolean}>({})
  const [interviewResult, setInterviewResult] = useState<any>(null)

  useEffect(() => {
    // 从sessionStorage加载面试结果
    const savedResult = sessionStorage.getItem("interviewResult")
    if (savedResult) {
      const result = JSON.parse(savedResult)
      setInterviewResult(result)
      
      // 检查是否有详细的问题信息
      if (result.questionDetails && result.questionDetails.length > 0) {
        // 使用真实的评估数据生成报告
        const report = generateDetailedReport(result)
        setReportData(report)
        setIsLoading(false)
        
        // 异步生成最佳答案
        generateBestAnswers(result.questionDetails, result.jobData)
      } else {
        // 兼容旧格式，生成模拟报告
        setTimeout(() => {
          const mockReport = generateMockReport(result)
          setReportData(mockReport)
          setIsLoading(false)
        }, 2000)
      }
    } else {
      router.push("/dashboard")
    }
  }, [router])

  // 生成详细报告
  const generateDetailedReport = (result: any) => {
    const questionDetails = result.questionDetails || []
    
    // 计算总体分数
    const scores = questionDetails.map((q: any) => q.evaluation?.score || 0)
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    
    // 收集所有反馈
    const allStrengths: string[] = []
    const allImprovements: string[] = []
    const allSuggestions: string[] = []
    
    questionDetails.forEach((q: any) => {
      if (q.evaluation) {
        if (q.evaluation.strengths) allStrengths.push(...q.evaluation.strengths)
        if (q.evaluation.improvements) allImprovements.push(...q.evaluation.improvements)
        if (q.evaluation.suggestions) allSuggestions.push(...q.evaluation.suggestions)
      }
    })
    
    // 去重并取前几个
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5)
    const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5)
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 5)
    
    return {
      overallScore,
      scores: {
        technical: Math.round(overallScore + (Math.random() - 0.5) * 10),
        communication: Math.round(overallScore + (Math.random() - 0.5) * 10),
        problemSolving: Math.round(overallScore + (Math.random() - 0.5) * 10)
      },
      strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ["思路清晰", "技术基础扎实"],
      improvements: uniqueImprovements.length > 0 ? uniqueImprovements : ["可以更加深入", "多举例说明"],
      recommendations: uniqueSuggestions.length > 0 ? uniqueSuggestions : ["深入学习技术原理", "多做项目实践"],
      questionAnalysis: questionDetails.map((q: any) => ({
        question: q.question,
        userAnswer: q.userAnswer,
        score: q.evaluation?.score || 0,
        feedback: q.evaluation?.feedback || "已评估",
        type: q.type,
        difficulty: q.difficulty
      }))
    }
  }

  // 生成最佳答案
  const generateBestAnswers = async (questionDetails: any[], jobData: any) => {
    setIsLoadingBestAnswers(true)
    try {
      const response = await fetch("/api/interview/generate-best-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          questionDetails,
          jobData
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setBestAnswers(result.bestAnswers)
      }
    } catch (error) {
      console.error("生成最佳答案失败:", error)
    } finally {
      setIsLoadingBestAnswers(false)
    }
  }

  // PDF下载功能
  const downloadPDF = async () => {
    if (!reportRef.current) return
    
    setIsGeneratingPDF(true)
    try {
      // 临时显示所有最佳答案
      const originalShowStates = { ...showBestAnswers }
      const tempShowStates: {[key: number]: boolean} = {}
      
      // 显示所有最佳答案
      reportData.questionAnalysis.forEach((_: any, index: number) => {
        tempShowStates[index] = true
      })
      setShowBestAnswers(tempShowStates)
      
      // 等待DOM更新
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: reportRef.current.scrollHeight,
        windowHeight: reportRef.current.scrollHeight
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const fileName = `面试报告-${interviewResult?.jobData?.position || '未知岗位'}-${new Date().toLocaleDateString()}.pdf`
      pdf.save(fileName)
      
      // 恢复原始显示状态
      setShowBestAnswers(originalShowStates)
    } catch (error) {
      console.error("PDF生成失败:", error)
      alert("PDF生成失败，请重试")
      // 恢复原始显示状态
      setShowBestAnswers(showBestAnswers)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const generateMockReport = (interviewResult: any) => {
    // 基于回答生成模拟报告
    const answers = interviewResult.answers || []
    const avgLength = answers.reduce((sum: number, answer: string) => sum + answer.length, 0) / answers.length
    
    const baseScore = Math.min(85, Math.max(60, avgLength / 10))
    
    return {
      overallScore: Math.round(baseScore),
      scores: {
        technical: Math.round(baseScore + Math.random() * 10 - 5),
        communication: Math.round(baseScore + Math.random() * 10 - 5),
        problemSolving: Math.round(baseScore + Math.random() * 10 - 5)
      },
      strengths: [
        "思路清晰，逻辑性强",
        "技术基础扎实",
        "表达能力较好"
      ],
      improvements: [
        "可以更多地举具体例子",
        "回答可以更加深入一些",
        "建议多练习系统设计题"
      ],
      recommendations: [
        "深入学习框架原理和源码",
        "多参与开源项目，积累实战经验",
        "练习更多算法和数据结构题目"
      ],
      questionAnalysis: interviewResult.questions.map((q: any, index: number) => ({
        question: q.content,
        userAnswer: answers[index] || "",
        score: Math.round(baseScore + Math.random() * 20 - 10),
        feedback: "回答较为完整，展现了良好的技术理解能力。"
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <CardTitle>AI正在分析您的面试表现</CardTitle>
            <CardDescription>
              正在生成详细的评估报告和改进建议...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={75} className="w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到面试数据</p>
          <Button onClick={() => router.push("/dashboard")}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "优秀"
    if (score >= 80) return "良好"
    if (score >= 70) return "中等"
    if (score >= 60) return "及格"
    return "需要提升"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">第4步: 面试报告</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  PDF将包含所有问题、回答和最佳答案
                </div>
              </div>
              <Button 
                onClick={downloadPDF} 
                disabled={isGeneratingPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? "生成中..." : "下载完整PDF"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8" ref={reportRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 面试基本信息 */}
          {interviewResult?.timing && (
            <Card>
              <CardHeader>
                <CardTitle>面试基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">目标岗位:</span> {interviewResult.jobData?.position || "未知"}
                  </div>
                  <div>
                    <span className="font-medium">目标公司:</span> {interviewResult.jobData?.company || "未知"}
                  </div>
                  <div>
                    <span className="font-medium">面试时长:</span> {interviewResult.timing.totalTimeUsedFormatted}
                  </div>
                  <div>
                    <span className="font-medium">完成状态:</span> 
                    <Badge variant={interviewResult.timing.completed === 'normal' ? 'default' : 'secondary'} className="ml-2">
                      {interviewResult.timing.completed === 'normal' ? '正常完成' : '超时完成'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">回答题数:</span> {reportData.questionAnalysis?.length || 0} 题
                  </div>
                  <div>
                    <span className="font-medium">完成时间:</span> {new Date(interviewResult.completedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 总体评分 */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">面试评估报告</CardTitle>
              <CardDescription>基于AI分析的综合评估结果</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(reportData.overallScore)}`}>
                  {reportData.overallScore}
                </div>
                <div className="text-lg text-muted-foreground">
                  总体评分 - {getScoreLabel(reportData.overallScore)}
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(reportData.scores.technical)}`}>
                    {reportData.scores.technical}
                  </div>
                  <div className="text-sm text-muted-foreground">技术能力</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(reportData.scores.communication)}`}>
                    {reportData.scores.communication}
                  </div>
                  <div className="text-sm text-muted-foreground">沟通表达</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(reportData.scores.problemSolving)}`}>
                    {reportData.scores.problemSolving}
                  </div>
                  <div className="text-sm text-muted-foreground">问题解决</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 优势和改进建议 */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  表现优势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportData.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingDown className="h-5 w-5" />
                  改进建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportData.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 学习建议 */}
          <Card>
            <CardHeader>
              <CardTitle>学习建议</CardTitle>
              <CardDescription>AI推荐的学习路径，帮助您提升面试表现</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 问题详细分析 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>问题详细分析</CardTitle>
                  <CardDescription>每道题的具体评估、您的回答和AI最佳答案对比</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {bestAnswers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allVisible = Object.values(showBestAnswers).every(v => v)
                        const newStates: {[key: number]: boolean} = {}
                        reportData.questionAnalysis.forEach((_: any, index: number) => {
                          newStates[index] = !allVisible
                        })
                        setShowBestAnswers(newStates)
                      }}
                    >
                      {Object.values(showBestAnswers).every(v => v) ? "隐藏" : "显示"}所有最佳答案
                    </Button>
                  )}
                  {isLoadingBestAnswers && (
                    <div className="text-sm text-muted-foreground">正在生成最佳答案...</div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reportData.questionAnalysis.map((qa: any, index: number) => {
                  const bestAnswer = bestAnswers.find(ba => ba.questionId === qa.questionId || index === bestAnswers.findIndex(ba => ba.question === qa.question))
                  const showBest = showBestAnswers[index]
                  
                  return (
                    <div key={index} className="border rounded-lg p-6 space-y-4">
                      {/* 问题头部 */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">问题 {index + 1}</h4>
                          <Badge variant={qa.type === 'technical' ? 'default' : qa.type === 'system-design' ? 'secondary' : 'outline'}>
                            {qa.type}
                          </Badge>
                          <Badge variant={qa.difficulty === 'hard' ? 'destructive' : qa.difficulty === 'medium' ? 'secondary' : 'outline'}>
                            {qa.difficulty}
                          </Badge>
                        </div>
                        <Badge variant={qa.score >= 80 ? "default" : qa.score >= 60 ? "secondary" : "destructive"}>
                          {qa.score}分
                        </Badge>
                      </div>
                      
                      {/* 问题内容 */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="font-medium text-sm mb-1">面试问题:</p>
                        <p className="text-sm">{qa.question}</p>
                      </div>
                      
                      {/* 您的回答 */}
                      <div>
                        <p className="font-medium text-sm mb-2 text-blue-600">您的回答:</p>
                        <Textarea 
                          value={qa.userAnswer} 
                          readOnly 
                          className="min-h-[100px] bg-blue-50/50 border-blue-200"
                        />
                      </div>
                      
                      {/* AI最佳答案 */}
                      {bestAnswer && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm text-green-600">AI推荐最佳答案:</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowBestAnswers(prev => ({ ...prev, [index]: !showBest }))}
                              className="text-xs"
                            >
                              {showBest ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              {showBest ? "隐藏" : "查看"}最佳答案
                            </Button>
                          </div>
                          {showBest && (
                            <Textarea 
                              value={bestAnswer.bestAnswer} 
                              readOnly 
                              className="min-h-[120px] bg-green-50/50 border-green-200"
                            />
                          )}
                        </div>
                      )}
                      
                      {/* AI评估反馈 */}
                      <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-200">
                        <p className="font-medium text-sm mb-1 text-orange-600">AI评估反馈:</p>
                        <p className="text-sm">{qa.feedback}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Button>
            <Button 
              onClick={() => {
                // 清除之前的数据，开始新的面试
                sessionStorage.clear()
                router.push("/upload")
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              再次练习
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}