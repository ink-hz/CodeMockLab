"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, ArrowRight, RefreshCw, AlertCircle, X } from "lucide-react"

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

  useEffect(() => {
    // 检查是否已有简历
    checkExistingResume()
  }, [])

  const checkExistingResume = async () => {
    try {
      const response = await fetch("/api/resume/check")
      const data = await response.json()
      if (data.hasResume) {
        setExistingResume(data.resume)
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

    try {
      setAnalysisStage("正在上传文件...")
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setAnalysisStage("处理完成")

      const result = await response.json()
      
      if (result.success) {
        setUploadResult(result.data.basicAnalysis)
        
        // 如果有AI分析结果，直接显示
        if (result.data.aiAnalysis && result.data.aiAnalysis.hasAIAnalysis) {
          setAiProfile(result.data.aiAnalysis)
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
        
        setAnalysisStage("准备跳转...")
        setTimeout(() => {
          router.push("/job-setup")
        }, 3000)
      } else {
        const errorMsg = result.error || result.message || "上传失败"
        setError(errorMsg)
        console.error("上传失败:", result)
      }
    } catch (error) {
      console.error("上传异常:", error)
      setError("网络错误，请检查连接后重试")
    } finally {
      setIsUploading(false)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <CardTitle>AI正在分析您的技术画像</CardTitle>
                <CardDescription>
                  {analysisStage || "正在过滤敏感信息并生成技术评估报告..."}
                </CardDescription>
                <div className="mt-4">
                  <Progress value={analysisProgress} className="max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{analysisProgress}%</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle>
                  {existingResume ? "简历更新成功！" : "简历解析成功！"}
                </CardTitle>
                <CardDescription>
                  {aiProfile 
                    ? "AI技术画像分析完成，正在跳转到下一步..." 
                    : "简历上传完成，正在跳转到下一步..."}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 基础技能识别 */}
              <div>
                <p className="text-sm font-medium mb-2">识别的技能：</p>
                <div className="flex flex-wrap gap-2">
                  {uploadResult.techKeywords?.slice(0, 8).map((skill: string, index: number) => (
                    <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI技术画像结果 */}
              {aiProfile && !isAnalyzing && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    🤖 AI技术画像分析
                  </h3>
                  
                  {/* 经验等级 */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">技术等级评估</span>
                      <Badge variant="secondary">
                        {aiProfile.experienceLevel === 'junior' ? '初级' : 
                         aiProfile.experienceLevel === 'mid' ? '中级' : 
                         aiProfile.experienceLevel === 'senior' ? '高级' : '专家级'}
                      </Badge>
                    </div>
                    <div className="text-xs text-green-700">
                      置信度: {Math.round((aiProfile.experienceLevelConfidence || 0.7) * 100)}%
                    </div>
                  </div>

                  {/* 技术专长 */}
                  {aiProfile.specializations && aiProfile.specializations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">技术专长领域：</p>
                      <div className="flex flex-wrap gap-2">
                        {aiProfile.specializations.slice(0, 4).map((spec: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 技术亮点 */}
                  {aiProfile.techHighlights && aiProfile.techHighlights.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">技术亮点：</p>
                      <div className="space-y-1">
                        {aiProfile.techHighlights.slice(0, 3).map((highlight: string, index: number) => (
                          <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 高价值技术栈 */}
                  {aiProfile.techStack && aiProfile.techStack.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">高价值技术栈：</p>
                      <div className="flex flex-wrap gap-2">
                        {aiProfile.techStack
                          .filter((tech: any) => tech.valueScore >= 70)
                          .slice(0, 6)
                          .map((tech: any, index: number) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs">
                              <span className="font-medium">{tech.technology}</span>
                              <span className="text-blue-600 ml-1">({tech.valueScore}分)</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                className="w-full"
                onClick={() => router.push("/job-setup")}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "AI分析中..." : "继续设置岗位信息"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
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
              {existingResume.techKeywords && existingResume.techKeywords.length > 0 && (
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">识别的技能：</p>
                  <div className="flex flex-wrap gap-2">
                    {existingResume.techKeywords.slice(0, 6).map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
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