"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Building } from "lucide-react"

const COMPANIES = [
  "腾讯", "阿里巴巴", "字节跳动", "美团", "京东", 
  "百度", "网易", "滴滴", "小米", "华为", "其他"
]

const JOB_LEVELS = [
  { value: "junior", label: "初级 (1-3年)", desc: "适合应届生和初级开发者" },
  { value: "mid", label: "中级 (3-5年)", desc: "有一定项目经验" },
  { value: "senior", label: "高级 (5-8年)", desc: "具备架构和团队管理经验" },
  { value: "expert", label: "专家 (8+年)", desc: "技术专家和技术Leader" }
]

export default function JobSetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    level: "",
    requirements: "",
    customCompany: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 从技能要求中提取并规范化技术关键词
      const normalizeRequirements = (reqStr: string): string[] => {
        const techMapping: Record<string, string> = {
          "分布式": "distributed",
          "微服务": "microservices",
          "前端": "frontend",
          "后端": "backend",
          "全栈": "fullstack",
          "数据库": "database",
          "云原生": "cloud-native",
          "容器": "container",
          "消息队列": "messaging"
        }
        
        const requirements = reqStr.split(/[,，、\s]+/).map(r => r.trim()).filter(Boolean)
        
        return requirements.map(req => {
          const lower = req.toLowerCase()
          // 检查中文映射
          for (const [cn, en] of Object.entries(techMapping)) {
            if (req.includes(cn)) {
              return en
            }
          }
          return lower
        })
      }
      
      // 保存岗位信息到会话或数据库
      const jobData = {
        company: formData.company === "其他" ? formData.customCompany : formData.company,
        position: formData.position,
        level: formData.level,
        requirements: normalizeRequirements(formData.requirements)
      }

      // 这里可以保存到数据库或会话存储
      sessionStorage.setItem("jobSetup", JSON.stringify(jobData))
      
      // 跳转到面试页面
      router.push("/interview/start")
    } catch (error) {
      alert("保存失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">第2步: 设置目标岗位</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>目标岗位信息</CardTitle>
                  <CardDescription>
                    告诉我们您想要面试的岗位，AI将为您定制专业的面试内容
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
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

                  {formData.company === "其他" && (
                    <div className="space-y-2">
                      <Label htmlFor="customCompany">公司名称</Label>
                      <Input
                        id="customCompany"
                        value={formData.customCompany}
                        onChange={(e) => setFormData(prev => ({ ...prev, customCompany: e.target.value }))}
                        placeholder="输入公司名称"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="position">职位名称</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="如：高级前端工程师"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">职位级别</Label>
                  <Select 
                    value={formData.level} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择职位级别" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-muted-foreground">{level.desc}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">技能要求</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="请输入技能要求，用逗号分隔&#10;例如：React, TypeScript, Node.js, 系统设计, 数据结构与算法"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI将根据这些技能要求为您生成相应的面试题目
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/upload")}
                  >
                    上一步
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !formData.company || !formData.position || !formData.level}
                  >
                    {isLoading ? "保存中..." : "开始面试"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}