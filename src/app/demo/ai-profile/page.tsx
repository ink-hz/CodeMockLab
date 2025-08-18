"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Shield, TrendingUp, Users, Code, Database } from "lucide-react"

export default function AIProfileDemo() {
  const [resumeText, setResumeText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [demoData, setDemoData] = useState<any>(null)

  // 加载演示数据
  const loadDemoData = async () => {
    try {
      const response = await fetch("/api/demo/ai-profile")
      const data = await response.json()
      if (data.success) {
        setDemoData(data)
        setResumeText(data.demoResume)
      }
    } catch (error) {
      console.error("加载演示数据失败:", error)
    }
  }

  // 执行AI分析
  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      alert("请输入简历内容或加载演示数据")
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const response = await fetch("/api/demo/ai-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: resumeText
        })
      })

      const result = await response.json()
      if (result.success) {
        setAnalysisResult(result)
      } else {
        alert("分析失败: " + result.error)
      }
    } catch (error) {
      console.error("分析出错:", error)
      alert("分析失败，请重试")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            AI简历技术画像演示
          </h1>
          <p className="text-muted-foreground mt-1">
            演示AI如何分析简历、过滤敏感信息并生成技术画像
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 输入区域 */}
          <Card>
            <CardHeader>
              <CardTitle>步骤1：输入简历内容</CardTitle>
              <CardDescription>
                粘贴您的简历文本，或使用演示数据体验AI分析功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline" 
                  onClick={loadDemoData}
                  disabled={isAnalyzing}
                >
                  加载演示数据
                </Button>
                <Button 
                  onClick={analyzeResume}
                  disabled={isAnalyzing || !resumeText.trim()}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      AI分析中...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      开始AI分析
                    </>
                  )}
                </Button>
              </div>
              
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="请粘贴您的简历内容..."
                rows={8}
                disabled={isAnalyzing}
              />
              
              <div className="text-sm text-muted-foreground">
                字符数: {resumeText.length} | 支持中文简历分析
              </div>
            </CardContent>
          </Card>

          {/* 分析结果 */}
          {analysisResult && (
            <div className="space-y-6">
              
              {/* 隐私保护信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    步骤2：隐私保护处理
                  </CardTitle>
                  <CardDescription>
                    AI自动识别并过滤敏感个人信息，保护隐私安全
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">内容处理：</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">原始长度</span>
                          <span className="text-sm font-mono">{analysisResult.originalLength} 字符</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">过滤后长度</span>
                          <span className="text-sm font-mono">{analysisResult.filteredLength} 字符</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">已过滤的敏感信息：</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.privacyInfo.removedFields.length > 0 ? 
                          analysisResult.privacyInfo.removedFields.map((field: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {field === 'phone' ? '手机号' : 
                               field === 'email' ? '邮箱' : 
                               field === 'address' ? '地址' : field}
                            </Badge>
                          )) : 
                          <span className="text-sm text-muted-foreground">无敏感信息</span>
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI技术画像 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    步骤3：AI技术画像分析
                  </CardTitle>
                  <CardDescription>
                    基于AI的深度简历分析，生成综合技术画像评估
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    
                    {/* 经验等级评估 */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">经验等级评估</span>
                          <Badge variant="default">
                            {analysisResult.aiProfile.experienceLevel === 'junior' ? '初级' : 
                             analysisResult.aiProfile.experienceLevel === 'mid' ? '中级' : 
                             analysisResult.aiProfile.experienceLevel === 'senior' ? '高级' : '专家'}
                          </Badge>
                        </div>
                        <div className="text-sm text-blue-700">
                          AI置信度: {Math.round(analysisResult.aiProfile.experienceLevelConfidence * 100)}%
                        </div>
                      </div>

                      {/* 技能评估雷达图 */}
                      <div>
                        <p className="font-medium mb-3">综合技能评估</p>
                        <div className="space-y-2">
                          {Object.entries(analysisResult.aiProfile.skillAssessment).map(([skill, score]: [string, any]) => (
                            <div key={skill} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>
                                  {skill === 'technical' ? '技术能力' :
                                   skill === 'communication' ? '沟通能力' :
                                   skill === 'leadership' ? '领导力' :
                                   skill === 'learning' ? '学习能力' :
                                   skill === 'problemSolving' ? '问题解决' : skill}
                                </span>
                                <span className="font-medium">{score}/100</span>
                              </div>
                              <Progress value={score} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 技术专长和亮点 */}
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          技术专长领域
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.aiProfile.specializations.map((spec: string, index: number) => (
                            <Badge key={index} variant="outline">{spec}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-2">技术亮点</p>
                        <div className="space-y-2">
                          {analysisResult.aiProfile.techHighlights.map((highlight: string, index: number) => (
                            <div key={index} className="text-sm flex items-start gap-2">
                              <span className="text-green-500">•</span>
                              <span>{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 技术栈分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-600" />
                    核心技术栈分析
                  </CardTitle>
                  <CardDescription>
                    按市场价值和熟练度排序的技术能力评估
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysisResult.aiProfile.techStack.map((tech: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{tech.technology}</span>
                            <div className="text-xs text-muted-foreground">{tech.category}</div>
                          </div>
                          <Badge variant={tech.valueScore >= 90 ? "default" : tech.valueScore >= 80 ? "secondary" : "outline"}>
                            {tech.valueScore}分
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>熟练度: {tech.proficiency}</span>
                          <span>证据数: {tech.evidenceCount}</span>
                        </div>
                        <Progress value={tech.valueScore} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 岗位匹配分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    岗位匹配度分析
                  </CardTitle>
                  <CardDescription>
                    基于技术画像分析的岗位适配度评估
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(analysisResult.aiProfile.roleMatchingAnalysis).map(([role, score]: [string, any]) => (
                      <div key={role} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{role}</span>
                          <span className="text-sm">{score}% 匹配</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 发展建议 */}
              <Card>
                <CardHeader>
                  <CardTitle>AI职业发展建议</CardTitle>
                  <CardDescription>
                    基于技术画像的个性化职业发展路径建议
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.aiProfile.careerSuggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}