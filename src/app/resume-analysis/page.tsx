"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Brain, BarChart3, Star, Lightbulb, Target, TrendingUp, Users, MessageSquare, Layers, CheckCircle } from "lucide-react"

export default function ResumeAnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [aiProfile, setAiProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 只在确认未认证且不是loading状态时重定向
    if (status === "unauthenticated") {
      console.log("用户未认证，重定向到登录页面")
      router.push("/login")
    }
  }, [status, router])
  
  // 如果还在认证检查中，显示加载状态
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">验证用户身份...</p>
        </div>
      </div>
    )
  }
  
  // 如果未认证，不渲染任何内容（避免闪烁）
  if (status === "unauthenticated") {
    return null
  }

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

  if (loading) {
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
          {/* 统计信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">技术等级</p>
                    <p className="font-semibold">
                      {aiProfile?.experienceLevel === 'junior' ? '初级工程师' : 
                       aiProfile?.experienceLevel === 'mid' ? '中级工程师' : 
                       aiProfile?.experienceLevel === 'senior' ? '高级工程师' : 
                       aiProfile?.experienceLevel === 'lead' ? '技术专家' : 
                       aiProfile?.experienceLevel?.includes('专家') ? '资深专家' : '中级工程师'}
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
                      {aiProfile?.stats?.totalTechnologies || aiProfile?.techStack?.length || 0} 项技术
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
                      {aiProfile?.stats?.avgValueScore || 75}/100
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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

                  {/* 系统设计题 */}
                  {aiProfile.simulatedInterview.systemDesign && (
                    <div>
                      <h4 className="font-semibold mb-3 text-indigo-600">系统设计题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.systemDesign.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-indigo-50 rounded-lg">
                            <span className="text-sm font-medium text-indigo-800">Q{index + 1}：</span>
                            <span className="text-sm text-indigo-700 ml-2">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 算法编程题 */}
                  {aiProfile.simulatedInterview.algorithmCoding && (
                    <div>
                      <h4 className="font-semibold mb-3 text-red-600">算法编程题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.algorithmCoding.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-red-800">Q{index + 1}：</span>
                            <span className="text-sm text-red-700 ml-2">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 问题解决题 */}
                  {aiProfile.simulatedInterview.problemSolving && (
                    <div>
                      <h4 className="font-semibold mb-3 text-orange-600">问题解决题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.problemSolving.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-orange-50 rounded-lg">
                            <span className="text-sm font-medium text-orange-800">Q{index + 1}：</span>
                            <span className="text-sm text-orange-700 ml-2">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 项目经验深挖题 */}
                  {aiProfile.simulatedInterview.projectExperience && (
                    <div>
                      <h4 className="font-semibold mb-3 text-cyan-600">项目经验深挖题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.projectExperience.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-cyan-50 rounded-lg">
                            <span className="text-sm font-medium text-cyan-800">Q{index + 1}：</span>
                            <span className="text-sm text-cyan-700 ml-2">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 行业洞察题 */}
                  {aiProfile.simulatedInterview.industryInsight && (
                    <div>
                      <h4 className="font-semibold mb-3 text-teal-600">行业洞察题</h4>
                      <div className="space-y-2">
                        {aiProfile.simulatedInterview.industryInsight.map((question: string, index: number) => (
                          <div key={index} className="p-3 bg-teal-50 rounded-lg">
                            <span className="text-sm font-medium text-teal-800">Q{index + 1}：</span>
                            <span className="text-sm text-teal-700 ml-2">{question}</span>
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

          {/* 简历评价与优化建议 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                简历评价与优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ 简历优势</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {aiProfile?.techStack?.length > 8 && (
                        <li>• 技术栈丰富，覆盖多个领域</li>
                      )}
                      {aiProfile?.stats?.avgValueScore > 80 && (
                        <li>• 掌握高价值技术，市场竞争力强</li>
                      )}
                      {aiProfile?.projectAnalysis?.some((p: any) => p.complexity === '高' || p.complexity === '极高') && (
                        <li>• 有复杂项目经验，技术深度较好</li>
                      )}
                      {aiProfile?.experienceLevel === 'senior' || aiProfile?.experienceLevel === 'lead' || aiProfile?.experienceLevel?.includes('专家') ? (
                        <li>• 技术等级较高，有资深经验</li>
                      ) : (
                        <li>• 基础技能扎实，有良好发展潜力</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-orange-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">⚡ 优化建议</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {!aiProfile?.projectAnalysis?.length && (
                        <li>• 建议增加项目经验描述，突出技术应用</li>
                      )}
                      {aiProfile?.stats?.avgValueScore < 70 && (
                        <li>• 考虑学习更多高价值技术，提升竞争力</li>
                      )}
                      {!aiProfile?.skillAssessment?.leadership && (
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
                      {aiProfile?.techStack?.slice(0, 3).map((tech: any, index: number) => (
                        <li key={index}>• {tech.technology} 的深度原理和最佳实践</li>
                      ))}
                      <li>• 系统设计能力和架构思维的展示</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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