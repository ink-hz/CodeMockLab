"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface QuestionData {
  id: string
  content: string
  type: string
  difficulty: string
  category: string
  source: string // 'generated' | 'ai-bank'
  userAnswer: string | null
  modelAnswer: string | null
  score: number | null
  feedback: string | null
  hasAnswer: boolean
  hasEvaluation: boolean
  createdAt: string
  updatedAt: string
  interview: {
    id: string
    targetCompany: string
    targetPosition: string
    createdAt: string
  }
}

interface QuestionStats {
  totalQuestions: number
  answeredQuestions: number
  avgScore: number
  byDifficulty: Record<string, number>
  byCategory: Record<string, number>
  bySource: Record<string, number>
}

export default function QuestionsPage() {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasLoaded, setHasLoaded] = useState(false)
  
  // 筛选和搜索状态
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all") // answered, unanswered, all
  const [filterSource, setFilterSource] = useState<string>("all")
  
  // UI状态
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session?.user?.id && !hasLoaded) {
      fetchQuestions()
    }
  }, [session?.user?.id, hasLoaded])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/questions")
      
      if (!response.ok) {
        throw new Error("获取题目数据失败")
      }
      
      const data = await response.json()
      setQuestions(data.questions || [])
      setStats(data.stats || null)
      setHasLoaded(true)
    } catch (error) {
      console.error("获取题目失败:", error)
      setError(error.message || "获取题目数据失败")
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const handleDownloadReport = async () => {
    try {
      const response = await fetch("/api/dashboard/download-all-reports", {
        method: "POST"
      })
      
      if (!response.ok) {
        throw new Error("下载报告失败")
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `题目总结报告-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("下载报告失败:", error)
      alert("下载报告失败")
    }
  }

  // 过滤题目
  const filteredQuestions = questions.filter((question) => {
    if (searchQuery && !question.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterDifficulty !== "all" && question.difficulty !== filterDifficulty) {
      return false
    }
    if (filterCategory !== "all" && question.category !== filterCategory) {
      return false
    }
    if (filterSource !== "all" && question.source !== filterSource) {
      return false
    }
    if (filterStatus === "answered" && !question.hasAnswer) {
      return false
    }
    if (filterStatus === "unanswered" && question.hasAnswer) {
      return false
    }
    return true
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      case 'expert': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500'
    if (score >= 90) return 'text-green-600 font-bold'
    if (score >= 80) return 'text-green-500'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  // 解析AI最佳答案JSON格式
  const parseModelAnswer = (modelAnswer: string | null) => {
    if (!modelAnswer) return null
    
    try {
      const parsed = JSON.parse(modelAnswer)
      return parsed.answer || modelAnswer
    } catch (error) {
      // 如果不是JSON格式，直接返回原始内容
      return modelAnswer
    }
  }

  if (!session) {
    return <div className="container mx-auto px-4 py-8">请先登录</div>
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">加载题目数据...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-red-600">{error}</div>
            <Button onClick={() => { setHasLoaded(false); fetchQuestions(); }} className="mt-4">重新加载</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">题目看板</h1>
          <p className="text-gray-600">查看和管理您所有的面试题目</p>
        </div>
        <Button onClick={handleDownloadReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          下载完整报告
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                  <div className="text-sm text-gray-600">总题目数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.answeredQuestions}</div>
                  <div className="text-sm text-gray-600">已回答</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">平均得分</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round((stats.answeredQuestions / stats.totalQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">完成进度</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和搜索 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选与搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索题目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="难度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有难度</SelectItem>
                <SelectItem value="easy">简单</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="hard">困难</SelectItem>
                <SelectItem value="expert">专家</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                <SelectItem value="architectureDesign">架构设计</SelectItem>
                <SelectItem value="techDepth">技术深度</SelectItem>
                <SelectItem value="algorithmCoding">算法编程</SelectItem>
                <SelectItem value="systemDesign">系统设计</SelectItem>
                <SelectItem value="leadership">领导力</SelectItem>
                <SelectItem value="problemSolving">问题解决</SelectItem>
                <SelectItem value="projectExperience">项目经验</SelectItem>
                <SelectItem value="industryInsight">行业洞察</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="answered">已回答</SelectItem>
                <SelectItem value="unanswered">未回答</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger>
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有来源</SelectItem>
                <SelectItem value="generated">AI生成</SelectItem>
                <SelectItem value="ai-bank">AI题库</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 题目列表 */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">没有找到匹配的题目</div>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleQuestion(question.id)}
                >
                  <CardHeader className="hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex items-center gap-2">
                          {question.hasAnswer ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                          {expandedQuestions.has(question.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium line-clamp-2">
                            {question.content}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getDifficultyColor(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              {question.source === 'generated' ? 'AI生成' : 'AI题库'}
                            </Badge>
                            <Badge variant="outline">{question.category}</Badge>
                            {question.score !== null && (
                              <Badge variant="outline" className={getScoreColor(question.score)}>
                                {question.score}分
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {question.interview.targetCompany} - {question.interview.targetPosition}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* 我的答案 */}
                      {question.userAnswer && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            我的答案
                          </h4>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="whitespace-pre-wrap text-sm">
                              {question.userAnswer}
                            </div>
                          </div>
                          {question.feedback && (
                            <div className="mt-2">
                              <div className="text-sm font-medium text-gray-700">AI反馈:</div>
                              <div className="text-sm text-gray-600 mt-1">{question.feedback}</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* AI最佳答案 */}
                      {question.modelAnswer && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            AI最佳答案
                          </h4>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>
                                {parseModelAnswer(question.modelAnswer) || ''}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 元数据 */}
                      <div className="text-xs text-gray-500 border-t pt-2">
                        创建时间: {new Date(question.createdAt).toLocaleString()} | 
                        更新时间: {new Date(question.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
      
      {/* 分页信息 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        共找到 {filteredQuestions.length} 道题目
      </div>
    </div>
  )
}