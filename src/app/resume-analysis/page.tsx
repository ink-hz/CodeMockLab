"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Brain, BarChart3, Star, Lightbulb, Target, TrendingUp, Users, MessageSquare, Layers } from "lucide-react"

export default function ResumeAnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [aiProfile, setAiProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAIProfile()
    }
  }, [session])

  const fetchAIProfile = async () => {
    setLoading(true)
    try {
      // 先获取简历ID
      const resumeResponse = await fetch("/api/resume/check")
      const resumeData = await resumeResponse.json()
      
      if (!resumeData.hasResume) {
        setError("请先上传简历")
        return
      }

      // 获取AI分析数据
      const aiResponse = await fetch(`/api/resume/ai-profile/${resumeData.resume.id}`)
      const aiResult = await aiResponse.json()
      
      if (aiResult.success && aiResult.data.hasAIProfile) {
        setAiProfile(aiResult.data)
      } else {
        setError("暂无AI分析数据，请重新上传简历")
      }
    } catch (error) {
      console.error("获取AI分析数据失败:", error)
      setError("获取分析数据失败")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">加载AI分析报告...</p>
        </div>
      </div>
    )
  }

  if (error || !aiProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">无法获取分析报告</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/upload")}>
            重新上传简历
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回控制台
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI简历分析报告
            </h1>
            <p className="text-lg text-muted-foreground">
              基于DeepSeek AI的深度技术画像分析
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* 经验等级评估 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                经验等级评估
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {aiProfile.experienceLevel || "中级"}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    AI置信度：{Math.round((aiProfile.experienceLevelConfidence || 0.7) * 100)}%
                  </div>
                  <Progress 
                    value={(aiProfile.experienceLevelConfidence || 0.7) * 100} 
                    className="mb-4"
                  />
                  {aiProfile.experienceReasoning && (
                    <p className="text-sm text-gray-600">
                      <strong>评估依据：</strong>{aiProfile.experienceReasoning}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-3">岗位匹配度分析</h4>
                  <div className="space-y-2">
                    {aiProfile.roleMatchingAnalysis && Object.entries(aiProfile.roleMatchingAnalysis).slice(0, 5).map(([role, score]: [string, any]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm">{role}</span>
                        <Badge variant="outline">{score}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 核心技术栈 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                核心技术栈（按重要性排序）
              </CardTitle>
              <CardDescription>
                基于简历内容分析的技术栈价值评分
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {aiProfile.techStack?.slice(0, 12).map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={tech.valueScore >= 90 ? "default" : "secondary"}
                        className={tech.valueScore >= 90 ? "bg-blue-600" : ""}
                      >
                        {tech.valueScore}分
                      </Badge>
                      <div>
                        <div className="font-medium">{tech.technology}</div>
                        <div className="text-sm text-muted-foreground">
                          {tech.category} · {tech.proficiency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      最后使用：{tech.lastUsed}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 核心专长领域 */}
          {aiProfile.coreExpertise && aiProfile.coreExpertise.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  核心专长领域
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {aiProfile.coreExpertise.map((expertise: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 font-semibold">{index + 1}</span>
                      </div>
                      <span className="font-medium">{expertise}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 专业方向 */}
          {aiProfile.specializations && aiProfile.specializations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  专业方向
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aiProfile.specializations.map((spec: string, index: number) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 项目经验分析 */}
          {aiProfile.projectAnalysis && aiProfile.projectAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  项目经验分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {aiProfile.projectAnalysis.map((project: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-lg">{project.projectName}</h4>
                        <Badge variant={project.complexity === "极高" ? "destructive" : project.complexity === "高" ? "default" : "secondary"}>
                          {project.complexity}复杂度
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                      
                      {project.techStack && project.techStack.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium">技术栈：</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.techStack.map((tech: string, techIndex: number) => (
                              <Badge key={techIndex} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {project.highlights && (
                        <div className="text-sm">
                          <span className="font-medium">亮点成果：</span>
                          <span className="text-gray-600 ml-2">{project.highlights}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 模拟面试题库 */}
          {aiProfile.simulatedInterview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                  AI生成的模拟面试题库
                </CardTitle>
                <CardDescription>
                  基于您的技术画像生成的个性化面试题目
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 架构设计题 */}
                  {aiProfile.simulatedInterview.architectureDesign && (
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-600">系统架构设计题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.architectureDesign.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">Q{index + 1}：</span>
                            <span className="text-sm text-blue-700 ml-2">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 技术深度题 */}
                  {aiProfile.simulatedInterview.techDepth && (
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">技术深度考察题</h4>
                      <div className="space-y-4">
                        {Object.entries(aiProfile.simulatedInterview.techDepth).map(([tech, questions]: [string, any]) => (
                          <div key={tech} className="border-l-4 border-green-500 pl-4">
                            <h5 className="font-medium text-green-700 mb-2">{tech}</h5>
                            <div className="space-y-2">
                              {questions.map((question: string, index: number) => (
                                <div key={index} className="p-3 bg-green-50 rounded-lg">
                                  <span className="text-sm font-medium text-green-800">Q{index + 1}：</span>
                                  <span className="text-sm text-green-700 ml-2">{question}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 领导力题 */}
                  {aiProfile.simulatedInterview.leadership && (
                    <div>
                      <h4 className="font-semibold mb-3 text-purple-600">领导力与管理题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.leadership.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-purple-800">Q{index + 1}：</span>
                            <span className="text-sm text-purple-700 ml-2">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 职业发展建议 */}
          {aiProfile.careerSuggestions && aiProfile.careerSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI职业发展建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiProfile.careerSuggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                        <span className="text-yellow-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-sm text-yellow-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 底部操作按钮 */}
          <div className="flex justify-center gap-4 py-6">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              返回控制台
            </Button>
            <Button onClick={() => router.push("/job-setup")}>
              开始设置面试岗位
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}