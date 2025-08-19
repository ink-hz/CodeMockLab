"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, ArrowRight, RefreshCw, AlertCircle, X, BarChart3, Star, Lightbulb, Target, TrendingUp, Users, MessageSquare, Brain, Layers } from "lucide-react"

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [dragOver, setDragOver] = useState(false)
  const [existingResume, setExistingResume] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiProfile, setAiProfile] = useState<any>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisStage, setAnalysisStage] = useState<string>("")
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    // 检查是否已有简历
    checkExistingResume()
  }, [])

  // 当detailedAnalysis数据加载完成时，自动展开报告
  useEffect(() => {
    console.log("详细分析数据变化:", detailedAnalysis)
    console.log("showReport状态:", showReport)
    if (detailedAnalysis && (detailedAnalysis.hasAIProfile || detailedAnalysis.hasAIAnalysis)) {
      console.log("设置showReport为true")
      setShowReport(true)
    }
  }, [detailedAnalysis])

  const checkExistingResume = async () => {
    try {
      const response = await fetch("/api/resume/check")
      const data = await response.json()
      console.log("简历检查结果:", data)
      
      if (data.hasResume) {
        console.log("发现现有简历，ID:", data.resume.id)
        setExistingResume(data.resume)
        
        // 如果有简历，尝试获取AI分析数据
        if (data.resume.id) {
          console.log("开始获取AI分析数据，resumeId:", data.resume.id)
          try {
            const aiResponse = await fetch(`/api/resume/ai-profile/${data.resume.id}`)
            const aiResult = await aiResponse.json()
            console.log("AI分析API响应:", aiResult)
            
            if (aiResult.success && aiResult.data.hasAIProfile) {
              console.log("AI分析数据获取成功:", aiResult.data)
              console.log("技术栈数据:", aiResult.data.techStack)
              setAiProfile(aiResult.data)
              setDetailedAnalysis(aiResult.data)
              setShowReport(true) // 自动展开已有的AI分析报告
            } else {
              console.log("没有AI分析数据或获取失败")
            }
          } catch (aiError) {
            console.log("AI分析数据获取失败，但不影响基础功能:", aiError)
          }
        } else {
          console.log("简历没有ID，无法获取AI分析数据")
        }
      } else {
        console.log("没有发现现有简历")
      }
    } catch (error) {
      console.error("Error checking resume:", error)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setAnalysisStage("准备上传...")

    // 验证文件
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!validTypes.includes(file.type)) {
      setError("不支持的文件类型。请上传PDF或Word文档。")
      setIsUploading(false)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小超过10MB限制。")
      setIsUploading(false)
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    // 将progressTimer移到try外面，确保可以在catch和finally中访问
    let progressTimer: NodeJS.Timeout | null = null
    let isCompleted = false

    try {
      setAnalysisStage("正在上传文件并进行AI分析...")
      console.log("开始上传文件:", file.name, "大小:", file.size, "类型:", file.type)
      
      // 启动进度条（AI分析期间显示更慢的进度）
      progressTimer = setInterval(() => {
        if (!isCompleted) {
          setUploadProgress(prev => {
            // AI分析期间的进度更慢更稳定
            if (prev < 20) return prev + 5  // 上传阶段
            if (prev < 40) return prev + 2  // 解析阶段
            if (prev < 70) return prev + 1  // AI分析阶段（最耗时）
            if (prev < 90) return prev + 0.5 // 等待完成
            return prev
          })
        }
      }, 800) // 增加间隔时间，显示更稳定

      // 添加超时控制（240秒，给AI分析充足时间）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 240000)
      
      console.log("发送上传请求到 /api/resume/upload")
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal
      }).catch(err => {
        console.error("上传请求失败:", err)
        if (err.name === 'AbortError') {
          throw new Error('AI分析超时（超过120秒），请重试。复杂简历可能需要分多次处理')
        }
        throw err
      })
      console.log("上传响应状态:", response.status)
      
      clearTimeout(timeoutId)
      isCompleted = true
      
      // 清理进度条定时器
      if (progressTimer) {
        clearInterval(progressTimer)
      }
      setUploadProgress(100)
      setAnalysisStage("AI分析完成，正在处理结果...")

      const result = await response.json()
      
      if (result.success) {
        setUploadResult(result.data.basicAnalysis)
        
        // 如果有AI分析结果，直接显示
        if (result.data.aiAnalysis && result.data.aiAnalysis.hasAIAnalysis) {
          setAiProfile(result.data.aiAnalysis)
          setDetailedAnalysis(result.data.aiAnalysis)
          setShowReport(true) // 默认展开详细报告
          setAnalysisStage("AI分析完成")
          console.log("AI分析结果:", result.data.aiAnalysis)
        } else {
          // 如果没有AI分析，尝试获取详细分析结果
          if (result.data.resumeId) {
            setAnalysisStage("获取AI分析结果...")
            await fetchAIProfile(result.data.resumeId)
          }
        }
        
        // 如果是更新简历，刷新现有简历信息
        if (existingResume) {
          checkExistingResume()
        }
        
        setAnalysisStage("分析完成，可查看详细报告")
      } else {
        const errorMsg = result.error || result.message || "上传失败"
        setError(errorMsg)
        console.error("上传失败:", result)
      }
    } catch (error: any) {
      console.error("上传异常:", error)
      // 清理进度条定时器
      if (progressTimer) {
        clearInterval(progressTimer)
      }
      setError(error.message || "网络错误，请检查连接后重试")
    } finally {
      setIsUploading(false)
      // 确保清理定时器
      if (progressTimer) {
        clearInterval(progressTimer)
      }
    }
  }

  const fetchAIProfile = async (resumeId: string) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisStage("获取AI分析结果...")

    try {
      // 模拟分析进度
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 500)

      const response = await fetch(`/api/resume/ai-profile/${resumeId}`)

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      const result = await response.json()
      
      if (result.success && result.data.hasAIProfile) {
        setAiProfile(result.data)
        setDetailedAnalysis(result.data)
        setShowReport(true) // 默认展开详细报告
        setAnalysisStage("AI分析完成")
        console.log("AI技术画像获取完成:", result.data)
      } else {
        setAnalysisStage("AI分析暂未完成")
        console.warn("AI分析结果不存在:", result.message)
        // 不设置为错误，因为这可能是正常情况（AI还在处理中）
      }
    } catch (error) {
      console.error("获取AI分析结果出错:", error)
      setAnalysisStage("AI分析获取失败")
      // 不设置error，因为基础简历分析已经成功
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    
    if (file && (file.type === "application/pdf" || file.type.includes("word"))) {
      handleFileUpload(file)
    } else {
      alert("请上传PDF或Word文档")
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  if (uploadResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">简历分析报告</h1>
              <div className="flex gap-2">
                {detailedAnalysis && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReport(!showReport)}
                  >
                    {showReport ? "收起报告" : "查看详细报告"}
                  </Button>
                )}
                <Button 
                  size="sm"
                  onClick={() => router.push("/job-setup")}
                  disabled={isAnalyzing}
                  variant={detailedAnalysis && !showReport ? "outline" : "default"}
                >
                  继续设置岗位
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {isAnalyzing ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="text-center py-8">
                <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <CardTitle className="mb-2">AI正在分析您的技术画像</CardTitle>
                <CardDescription className="mb-4">
                  {analysisStage || "正在过滤敏感信息并生成技术评估报告..."}
                </CardDescription>
                <Progress value={analysisProgress} className="max-w-xs mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">{analysisProgress}%</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* 成功提示 */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-green-800">
                        {existingResume ? "简历更新成功！" : "简历解析成功！"}
                      </h3>
                      <p className="text-sm text-green-700">
                        {detailedAnalysis ? "AI技术画像分析完成，点击下方查看详细报告" : "基础分析完成，可点击继续下一步"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 快速概览 */}
              {detailedAnalysis && !showReport && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold text-blue-800">详细分析报告已生成</h3>
                          <p className="text-sm text-blue-700">查看完整的技术栈分析、项目评估和职业建议</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setShowReport(true)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        查看报告
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Star className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">技术等级</p>
                        <p className="font-semibold">
                          {detailedAnalysis?.experienceLevel === 'junior' ? '初级工程师' : 
                           detailedAnalysis?.experienceLevel === 'mid' ? '中级工程师' : 
                           detailedAnalysis?.experienceLevel === 'senior' ? '高级工程师' : 
                           detailedAnalysis?.experienceLevel === 'lead' ? '技术专家' : '中级工程师'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">技术栈数量</p>
                        <p className="font-semibold">
                          {detailedAnalysis?.stats?.totalTechnologies || uploadResult?.techKeywords?.length || 0} 项技术
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">市场价值评分</p>
                        <p className="font-semibold">
                          {detailedAnalysis?.stats?.avgValueScore || 75}/100
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 详细分析报告 */}
              {showReport && detailedAnalysis && (
                <div className="space-y-6">
                  {/* 核心专长领域 */}
                  {detailedAnalysis.coreExpertise && detailedAnalysis.coreExpertise.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          核心专长领域
                        </CardTitle>
                        <CardDescription>AI识别的技术专长和核心能力</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {detailedAnalysis.coreExpertise.map((expertise: string, index: number) => (
                            <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Layers className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-800">{expertise}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 模拟面试题库 */}
                  {detailedAnalysis.simulatedInterview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          AI生成的模拟面试题库
                        </CardTitle>
                        <CardDescription>基于您的技术栈和经验生成的针对性面试问题</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* 架构设计题 */}
                          {detailedAnalysis.simulatedInterview.architectureDesign && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4 text-green-600" />
                                系统架构设计题
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.architectureDesign.map((question: string, index: number) => (
                                  <div key={index} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-green-800">Q{index + 1}:</p>
                                    <p className="text-green-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 技术深度题 */}
                          {detailedAnalysis.simulatedInterview.techDepth && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-blue-600" />
                                技术深度问题
                              </h4>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {Object.entries(detailedAnalysis.simulatedInterview.techDepth).map(([tech, questions]: [string, any]) => (
                                  <div key={tech} className="border rounded-lg p-4">
                                    <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                                      <Badge variant="outline">{tech}</Badge>
                                    </h5>
                                    <div className="space-y-2">
                                      {questions.map((question: string, qIndex: number) => (
                                        <div key={qIndex} className="bg-blue-50 p-3 rounded text-sm">
                                          <span className="font-medium text-blue-700">Q{qIndex + 1}: </span>
                                          <span className="text-blue-600">{question}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 系统设计题 */}
                          {detailedAnalysis.simulatedInterview.systemDesign && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-indigo-600" />
                                系统设计题
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.systemDesign.map((question: string, index: number) => (
                                  <div key={index} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-indigo-800">Q{index + 1}:</p>
                                    <p className="text-indigo-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 算法编程题 */}
                          {detailedAnalysis.simulatedInterview.algorithmCoding && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-red-600" />
                                算法编程题
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.algorithmCoding.map((question: string, index: number) => (
                                  <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-red-800">Q{index + 1}:</p>
                                    <p className="text-red-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 问题解决题 */}
                          {detailedAnalysis.simulatedInterview.problemSolving && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-orange-600" />
                                问题解决题
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.problemSolving.map((question: string, index: number) => (
                                  <div key={index} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-orange-800">Q{index + 1}:</p>
                                    <p className="text-orange-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 项目经验深挖题 */}
                          {detailedAnalysis.simulatedInterview.projectExperience && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4 text-cyan-600" />
                                项目经验深挖题
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.projectExperience.map((question: string, index: number) => (
                                  <div key={index} className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-cyan-800">Q{index + 1}:</p>
                                    <p className="text-cyan-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 行业洞察题 */}
                          {detailedAnalysis.simulatedInterview.industryInsight && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-teal-600" />
                                行业洞察题
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.industryInsight.map((question: string, index: number) => (
                                  <div key={index} className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-teal-800">Q{index + 1}:</p>
                                    <p className="text-teal-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 领导力题 */}
                          {detailedAnalysis.simulatedInterview.leadership && (
                            <div>
                              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-600" />
                                领导力与团队协作
                              </h4>
                              <div className="space-y-3">
                                {detailedAnalysis.simulatedInterview.leadership.map((question: string, index: number) => (
                                  <div key={index} className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                                    <p className="text-sm font-medium text-purple-800">Q{index + 1}:</p>
                                    <p className="text-purple-700 mt-1">{question}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 技术栈分析 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        技术栈深度分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {detailedAnalysis.techStack?.slice(0, 10).map((tech: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{tech.technology}</span>
                                <Badge variant="outline" className="text-xs">
                                  {tech.category}
                                </Badge>
                                <Badge variant={
                                  tech.proficiency === '专家' ? 'default' :
                                  tech.proficiency === '高级' ? 'secondary' :
                                  tech.proficiency === '中级' ? 'outline' : 'destructive'
                                }>
                                  {tech.proficiency}
                                </Badge>
                              </div>
                              {tech.evidence && tech.evidence.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  证据: {tech.evidence[0]?.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">
                                {tech.valueScore}/100
                              </div>
                              <div className="text-xs text-muted-foreground">
                                市场价值
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 项目经验分析 */}
                  {detailedAnalysis.projectAnalysis && detailedAnalysis.projectAnalysis.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          项目经验分析
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {detailedAnalysis.projectAnalysis.map((project: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold">{project.projectName}</h4>
                                  <p className="text-sm text-muted-foreground">{project.role}</p>
                                </div>
                                <Badge variant={
                                  project.complexity === '极高' ? 'default' :
                                  project.complexity === '高' ? 'secondary' :
                                  project.complexity === '中' ? 'outline' : 'destructive'
                                }>
                                  {project.complexity}复杂度
                                </Badge>
                              </div>
                              <p className="text-sm mb-3">{project.description}</p>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">核心技术栈:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {project.techStack?.slice(0, 6).map((tech: string, techIndex: number) => (
                                      <Badge key={techIndex} variant="outline" className="text-xs">
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                {project.techDepth && project.techDepth.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">技术深度:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {project.techDepth.map((tech: string, techIndex: number) => (
                                        <Badge key={techIndex} variant="secondary" className="text-xs">
                                          {tech}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {project.highlights && project.highlights.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">技术亮点:</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                      {project.highlights.slice(0, 3).map((highlight: string, hIndex: number) => (
                                        <li key={hIndex} className="flex items-start gap-2">
                                          <span className="text-green-500">•</span>
                                          <span>{highlight}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {project.interviewQuestions && project.interviewQuestions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">针对性面试问题:</p>
                                    <div className="space-y-2">
                                      {project.interviewQuestions.slice(0, 2).map((question: string, qIndex: number) => (
                                        <div key={qIndex} className="bg-orange-50 border border-orange-200 rounded p-2">
                                          <p className="text-xs font-medium text-orange-800">Q{qIndex + 1}:</p>
                                          <p className="text-xs text-orange-700 mt-1">{question}</p>
                                        </div>
                                      ))}
                                      {project.interviewQuestions.length > 2 && (
                                        <p className="text-xs text-muted-foreground italic">
                                          还有 {project.interviewQuestions.length - 2} 个问题...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 经验等级详细评估 */}
                  {detailedAnalysis.experienceReasoning && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          经验等级评估
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={
                              detailedAnalysis.experienceLevel === 'lead' ? 'default' :
                              detailedAnalysis.experienceLevel === 'senior' ? 'secondary' :
                              detailedAnalysis.experienceLevel === 'mid' ? 'outline' : 'destructive'
                            } className="text-sm">
                              {detailedAnalysis.experienceLevel === 'junior' ? '初级工程师' : 
                               detailedAnalysis.experienceLevel === 'mid' ? '中级工程师' : 
                               detailedAnalysis.experienceLevel === 'senior' ? '高级工程师' : '技术专家'}
                            </Badge>
                            <span className="text-sm font-medium text-yellow-700">
                              置信度: {Math.round((detailedAnalysis.experienceLevelConfidence || 0.7) * 100)}%
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800 mb-2">AI评估理由:</p>
                            <p className="text-sm text-yellow-700">{detailedAnalysis.experienceReasoning}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 专业能力评估 */}
                  {detailedAnalysis.skillAssessment && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          专业能力评估
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(detailedAnalysis.skillAssessment).map(([skill, score]: [string, any]) => (
                            <div key={skill} className="text-center">
                              <div className="relative w-16 h-16 mx-auto mb-2">
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-gray-200"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={`${2 * Math.PI * 28}`}
                                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - score / 100)}`}
                                    className="text-blue-500"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold">{score}</span>
                                </div>
                              </div>
                              <p className="text-sm font-medium capitalize">{skill}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 职业发展建议 */}
                  {detailedAnalysis.careerSuggestions && detailedAnalysis.careerSuggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          职业发展建议
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {detailedAnalysis.careerSuggestions.map((suggestion: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 岗位匹配分析 */}
                  {detailedAnalysis.roleMatchingAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          岗位匹配度分析
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(detailedAnalysis.roleMatchingAnalysis).map(([role, score]: [string, any]) => (
                            <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium">{role}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold w-12 text-right">{score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* 基础技能展示（当没有详细分析时） */}
              {!detailedAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>识别的技能</CardTitle>
                    <CardDescription>
                      基础解析结果，AI详细分析正在处理中
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {uploadResult.techKeywords?.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 简历评价和优化建议 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Star className="h-5 w-5" />
                    简历评价与优化建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">✅ 简历优势</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {detailedAnalysis?.techStack?.length > 8 && (
                            <li>• 技术栈丰富，覆盖多个领域</li>
                          )}
                          {detailedAnalysis?.stats?.avgValueScore > 80 && (
                            <li>• 掌握高价值技术，市场竞争力强</li>
                          )}
                          {detailedAnalysis?.projectAnalysis?.some((p: any) => p.complexity === '高' || p.complexity === '极高') && (
                            <li>• 有复杂项目经验，技术深度较好</li>
                          )}
                          {detailedAnalysis?.experienceLevel === 'senior' || detailedAnalysis?.experienceLevel === 'lead' ? (
                            <li>• 技术等级较高，有资深经验</li>
                          ) : (
                            <li>• 基础技能扎实，有良好发展潜力</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-orange-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">⚡ 优化建议</h4>
                        <ul className="text-sm text-orange-700 space-y-1">
                          {!detailedAnalysis?.projectAnalysis?.length && (
                            <li>• 建议增加项目经验描述，突出技术应用</li>
                          )}
                          {detailedAnalysis?.stats?.avgValueScore < 70 && (
                            <li>• 考虑学习更多高价值技术，提升竞争力</li>
                          )}
                          {!detailedAnalysis?.skillAssessment?.leadership && (
                            <li>• 可以增加团队协作和领导力相关经验</li>
                          )}
                          <li>• 建议量化项目成果，如性能提升、用户增长等</li>
                          <li>• 可以添加开源贡献或技术博客链接</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-100 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">🎯 面试准备建议</h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        <p>基于您的技术栈分析，建议重点准备以下面试内容：</p>
                        <ul className="space-y-1 ml-4">
                          {detailedAnalysis?.techStack?.slice(0, 3).map((tech: any, index: number) => (
                            <li key={index}>• {tech.technology} 的深度原理和最佳实践</li>
                          ))}
                          {detailedAnalysis?.projectAnalysis?.length > 0 && (
                            <li>• 详细阐述项目中的技术难点和解决方案</li>
                          )}
                          <li>• 系统设计能力和架构思维的展示</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">第1步: 上传简历</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 显示现有简历信息 */}
          {existingResume && !uploadResult && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">当前简历</h3>
                      <p className="text-sm text-muted-foreground">
                        {existingResume.fileName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    已上传
                  </Badge>
                </div>
              </CardHeader>
              {(aiProfile?.techStack || existingResume.techKeywords) && (
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {aiProfile?.techStack ? "核心技术栈（按重要性排序）：" : "识别的技能："}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiProfile?.techStack ? (
                      // 显示AI分析的技术栈，按valueScore排序
                      aiProfile.techStack.slice(0, 8).map((tech: any, index: number) => (
                        <Badge 
                          key={index} 
                          variant={tech.valueScore >= 90 ? "default" : "outline"}
                          className={tech.valueScore >= 90 ? "bg-blue-600" : ""}
                        >
                          {tech.technology} ({tech.valueScore})
                        </Badge>
                      ))
                    ) : (
                      // 备用：显示基础解析的技术关键词
                      existingResume.techKeywords.slice(0, 6).map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {aiProfile && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => router.push("/resume-analysis")}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        查看完整分析报告
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push("/job-setup")}
                    >
                      继续下一步
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {existingResume ? "更新简历" : "上传您的简历"}
              </CardTitle>
              <CardDescription>
                {existingResume 
                  ? "上传新的简历文件将替换现有简历" 
                  : "支持PDF和Word格式，最大10MB。AI将自动分析您的技能和经验。"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">上传失败</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setError(null)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        重试
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isUploading ? (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
                  <p className="text-lg font-medium mb-4">{analysisStage || "正在上传和解析简历..."}</p>
                  <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
                  
                  {/* AI分析提示 */}
                  {uploadProgress > 20 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Brain className="h-4 w-4" />
                        <span className="font-medium">AI深度分析中</span>
                      </div>
                      <p>DeepSeek正在为您生成技术画像和面试题库，请耐心等待（通常需要120-180秒）</p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver 
                      ? "border-primary bg-primary/5" 
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                  }}
                  onDrop={handleDrop}
                >
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    拖拽文件到这里，或点击选择文件
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    支持 PDF、DOC、DOCX 格式
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span>选择文件</span>
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")}
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}