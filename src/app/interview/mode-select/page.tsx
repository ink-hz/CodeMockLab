"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Zap, 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Sparkles,
  Database
} from "lucide-react"

export default function ModeSelectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [resumeInfo, setResumeInfo] = useState<any>(null)
  const [aiProfile, setAiProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      checkResume()
    }
  }, [session])

  const checkResume = async () => {
    try {
      const response = await fetch("/api/resume/check")
      const data = await response.json()
      setResumeInfo(data.resume)
      
      if (data.hasResume && data.resume.id) {
        try {
          const aiResponse = await fetch(`/api/resume/ai-profile/${data.resume.id}`)
          const aiResult = await aiResponse.json()
          if (aiResult.success && aiResult.data.hasAIProfile) {
            setAiProfile(aiResult.data)
            // 调试：查看实际的数据结构
            console.log('AI Profile simulatedInterview:', aiResult.data.simulatedInterview)
            if (aiResult.data.simulatedInterview) {
              const allQuestions = Object.values(aiResult.data.simulatedInterview)
              console.log('All questions arrays:', allQuestions)
              console.log('Flattened length:', allQuestions.flat().length)
            }
          }
        } catch (aiError) {
          console.log("AI分析数据获取失败:", aiError)
        }
      }
    } catch (error) {
      console.error("Error checking resume:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleModeSelect = (mode: 'ai-bank' | 'ai-generate') => {
    if (mode === 'ai-generate') {
      // AI实时生成模式需要先设置岗位信息
      router.push('/job-setup?next=interview')
    } else {
      // AI题库模式直接开始面试
      router.push(`/interview/start?mode=${mode}`)
    }
  }

  if (!session) {
    return <div className="container mx-auto px-4 py-8">请先登录</div>
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎯 选择刷题模式</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            选择最适合你的面试准备方式，AI内置题库系统性练习，实时生成挑战新题
          </p>
        </div>

        {/* 简历状态提示 */}
        {aiProfile && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">AI分析完成</h3>
                    <p className="text-sm text-green-700">
                      已为您生成 {(() => {
                        if (!aiProfile.simulatedInterview) return '50+';
                        let count = 0;
                        const interview = aiProfile.simulatedInterview;
                        // 计算所有题目数量
                        Object.entries(interview).forEach(([key, value]) => {
                          if (key === 'techDepth' && typeof value === 'object') {
                            // techDepth 是嵌套对象
                            Object.values(value).forEach(questions => {
                              if (Array.isArray(questions)) count += questions.length;
                            });
                          } else if (Array.isArray(value)) {
                            // 其他字段是数组
                            count += value.length;
                          }
                        });
                        return count;
                      })()} 道个性化题目，
                      覆盖 {aiProfile.specializations?.length || 3} 个专业领域
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 模式选择卡片 */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* AI内置题库模式 */}
            <Card className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500 text-white rounded-full">
                      <Database className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-blue-800">AI内置题库</CardTitle>
                      <CardDescription className="text-blue-600 font-medium">
                        基于简历分析的专业题库
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-blue-500 text-white">推荐</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 特点标签 */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <BookOpen className="w-3 h-3 mr-1" />
                    50+道精选题目
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <Target className="w-3 h-3 mr-1" />
                    个性化匹配
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    系统性提升
                  </Badge>
                </div>

                {/* 优势描述 */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>即刻开始</strong>：基于您的简历AI分析已生成完整题库，无需等待
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>精准匹配</strong>：覆盖8大技能领域，针对您的技术栈和经验水平
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>系统练习</strong>：适合长期刷题和系统性能力提升
                    </p>
                  </div>
                </div>

                {/* 统计信息 */}
                {aiProfile && (
                  <div className="bg-white/70 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">您的题库包含：</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {aiProfile.specializations?.slice(0, 4).map((spec: string, index: number) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          {spec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => handleModeSelect('ai-bank')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  开始刷题库
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* AI实时生成模式 */}
            <Card className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500 text-white rounded-full">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-purple-800">AI实时生成</CardTitle>
                      <CardDescription className="text-purple-600 font-medium">
                        动态生成的全新题目
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-500 text-white">新颖</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 特点标签 */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    全新题目
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Target className="w-3 h-3 mr-1" />
                    岗位定制
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Clock className="w-3 h-3 mr-1" />
                    即时挑战
                  </Badge>
                </div>

                {/* 优势描述 */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>题目新颖</strong>：AI根据您的简历和目标岗位实时生成全新题目
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>高度定制</strong>：结合具体公司和职位需求，模拟真实面试
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>挑战升级</strong>：每次都是新体验，适合面试前冲刺准备
                    </p>
                  </div>
                </div>

                {/* 生成设置预览 */}
                <div className="bg-white/70 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">生成配置：</h4>
                  <div className="text-sm space-y-1">
                    <div>📝 题目数量：3-5道</div>
                    <div>⚡ 生成时间：~30秒</div>
                    <div>🎯 难度调节：根据简历自适应</div>
                    <div>🏢 岗位匹配：基于目标公司职位</div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleModeSelect('ai-generate')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  生成新题目
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">💡 使用建议</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>日常练习</strong>：推荐使用AI内置题库，系统性提升技能</p>
                <p><strong>面试冲刺</strong>：使用AI实时生成，针对性准备特定岗位</p>
                <p>两种模式可以结合使用，全面提升面试成功率 🚀</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}