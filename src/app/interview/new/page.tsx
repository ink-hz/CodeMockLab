"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Code, Users, FileText, Settings, ArrowRight } from "lucide-react"

const INTERVIEW_TYPES = [
  {
    id: 'TECHNICAL',
    name: '技术面试',
    description: '算法、数据结构、编程题',
    icon: Code
  },
  {
    id: 'BEHAVIORAL',
    name: '行为面试',
    description: '项目经验、团队协作、职业规划',
    icon: Users
  },
  {
    id: 'SYSTEM_DESIGN',
    name: '系统设计',
    description: '架构设计、扩展性、性能优化',
    icon: FileText
  }
]

const COMPANIES = [
  '腾讯', '阿里巴巴', '字节跳动', '美团', '京东', 
  '百度', '网易', '滴滴', '小米', '华为', '自定义'
]

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: '简单', description: '适合新手和基础练习' },
  { value: 'MEDIUM', label: '中等', description: '常见面试题难度' },
  { value: 'HARD', label: '困难', description: '高级岗位和挑战题' }
]

export default function NewInterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'TECHNICAL'

  const [formData, setFormData] = useState({
    type: defaultType,
    company: '',
    position: '',
    level: '',
    difficulty: 'MEDIUM',
    questionCount: 5,
    requirements: '',
    customCompany: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'temp-user-id', // 实际应从session获取
          interviewType: formData.type,
          difficulty: formData.difficulty,
          questionCount: formData.questionCount,
          jobPosition: {
            company: formData.company === '自定义' ? formData.customCompany : formData.company,
            title: formData.position,
            level: formData.level,
            requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean)
          }
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        router.push(`/interview/${result.interviewId}`)
      } else {
        alert('创建面试失败: ' + result.error)
      }
    } catch (error) {
      alert('创建面试失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">创建模拟面试</h1>
        <p className="text-muted-foreground">
          根据您的需求定制专属的面试体验
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 面试类型选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择面试类型</CardTitle>
            <CardDescription>不同类型的面试会生成相应的问题</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {INTERVIEW_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <div
                    key={type.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.type === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  >
                    <Icon className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 职位信息 */}
        <Card>
          <CardHeader>
            <CardTitle>职位信息</CardTitle>
            <CardDescription>模拟真实的面试场景</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">目标公司</Label>
                <Select
                  value={formData.company}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公司" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANIES.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.company === '自定义' && (
                <div>
                  <Label htmlFor="customCompany">自定义公司名称</Label>
                  <Input
                    id="customCompany"
                    value={formData.customCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCompany: e.target.value }))}
                    placeholder="输入公司名称"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="position">职位名称</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="如：高级前端工程师"
                  required
                />
              </div>

              <div>
                <Label htmlFor="level">职位级别</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="初级">初级 (P4-P5)</SelectItem>
                    <SelectItem value="中级">中级 (P6-P7)</SelectItem>
                    <SelectItem value="高级">高级 (P8-P9)</SelectItem>
                    <SelectItem value="专家">专家 (P10+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="requirements">技能要求</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="请输入技能要求，用逗号分隔。如：React, TypeScript, Node.js"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 面试设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              面试设置
            </CardTitle>
            <CardDescription>自定义面试的难度和题目数量</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">难度级别</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="questionCount">题目数量</Label>
                <Select
                  value={formData.questionCount.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, questionCount: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3道题 (~15分钟)</SelectItem>
                    <SelectItem value="5">5道题 (~30分钟)</SelectItem>
                    <SelectItem value="8">8道题 (~45分钟)</SelectItem>
                    <SelectItem value="10">10道题 (~60分钟)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isCreating}>
            {isCreating ? "正在生成面试..." : "开始面试"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}