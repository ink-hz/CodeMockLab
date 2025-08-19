"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Building, Clock, Star, Trash2, RefreshCw } from "lucide-react"

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

interface JobPreference {
  id: string
  company: string | null
  customCompany: string | null
  position: string | null
  level: string | null
  requirements: string | null
  jobResponsibilities?: string | null
  jobRequirements?: string | null
  isDefault: boolean
  usageCount: number
  lastUsedAt: string
}

export default function JobSetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute = searchParams.get('next') // 获取跳转参数
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [savedPreferences, setSavedPreferences] = useState<JobPreference[]>([])
  
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    level: "",
    requirements: "",
    customCompany: "",
    jobResponsibilities: "",  // 工作职责
    jobRequirements: ""       // 任职要求
  })

  // 加载用户的岗位偏好设置
  useEffect(() => {
    const loadJobPreferences = async () => {
      if (!session?.user?.id) return
      
      try {
        // 加载最近使用的偏好设置
        const latestResponse = await fetch('/api/job-preference?type=latest')
        if (latestResponse.ok) {
          const { data } = await latestResponse.json()
          if (data) {
            setFormData({
              company: data.company || "",
              position: data.position || "", 
              level: data.level || "",
              requirements: data.requirements || "",
              customCompany: data.customCompany || "",
              jobResponsibilities: data.jobResponsibilities || "",
              jobRequirements: data.jobRequirements || ""
            })
          }
        }

        // 加载所有偏好设置历史
        const allResponse = await fetch('/api/job-preference?type=all')
        if (allResponse.ok) {
          const { data } = await allResponse.json()
          setSavedPreferences(data || [])
        }
      } catch (error) {
        console.error('加载偏好设置失败:', error)
      } finally {
        setLoadingPreferences(false)
      }
    }

    loadJobPreferences()
  }, [session])

  // 应用选中的偏好设置
  const applyPreference = (preference: JobPreference) => {
    setFormData({
      company: preference.company || "",
      position: preference.position || "",
      level: preference.level || "",
      requirements: preference.requirements || "",
      customCompany: preference.customCompany || "",
      jobResponsibilities: preference.jobResponsibilities || "",
      jobRequirements: preference.jobRequirements || ""
    })
  }

  // 删除偏好设置
  const deletePreference = async (preferenceId: string) => {
    try {
      const response = await fetch(`/api/job-preference?id=${preferenceId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSavedPreferences(prev => prev.filter(p => p.id !== preferenceId))
      }
    } catch (error) {
      console.error('删除偏好设置失败:', error)
    }
  }

  // 保存当前设置为偏好
  const saveAsPreference = async (isDefault = false) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/job-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company: formData.company,
          customCompany: formData.customCompany,
          position: formData.position,
          level: formData.level,
          requirements: formData.requirements,
          jobResponsibilities: formData.jobResponsibilities,
          jobRequirements: formData.jobRequirements,
          isDefault
        })
      })

      if (response.ok) {
        const { data } = await response.json()
        // 更新偏好设置列表
        setSavedPreferences(prev => {
          const existing = prev.find(p => p.id === data.id)
          if (existing) {
            return prev.map(p => p.id === data.id ? data : p)
          }
          return [data, ...prev].slice(0, 10) // 只保留最近10个
        })
      }
    } catch (error) {
      console.error('保存偏好设置失败:', error)
    }
  }

  // 清空表单
  const clearForm = () => {
    setFormData({
      company: "",
      position: "",
      level: "",
      requirements: "",
      customCompany: "",
      jobResponsibilities: "",
      jobRequirements: ""
    })
  }

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
        requirements: normalizeRequirements(formData.requirements),
        jobResponsibilities: formData.jobResponsibilities?.trim() || "",
        jobRequirements: formData.jobRequirements?.trim() || ""
      }

      // 保存到会话存储用于面试使用
      sessionStorage.setItem("jobSetup", JSON.stringify(jobData))
      
      // 自动保存偏好设置（如果用户已登录）
      if (session?.user?.id) {
        await saveAsPreference(false) // 不设为默认，只记录使用历史
      }
      
      // 根据 next 参数决定跳转目标
      if (nextRoute === 'interview') {
        // 从模式选择页面过来的，直接进入实时生成面试
        router.push("/interview/start?mode=ai-generate")
      } else {
        // 默认跳转到刷题模式选择页面
        router.push("/interview/mode-select")
      }
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
              {/* 偏好设置快速选择区域 */}
              {!loadingPreferences && savedPreferences.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">最近使用的设置</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => saveAsPreference(true)}
                      className="text-xs"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      设为默认
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {savedPreferences.slice(0, 3).map((preference) => (
                      <div
                        key={preference.id}
                        className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                        onClick={() => applyPreference(preference)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 text-sm">
                            {preference.isDefault && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            <span className="font-medium truncate">
                              {preference.company === "其他" ? preference.customCompany : preference.company}
                            </span>
                            <span className="text-gray-500">-</span>
                            <span className="truncate">{preference.position}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            使用{preference.usageCount}次 · {new Date(preference.lastUsedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              applyPreference(preference)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePreference(preference.id)
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {savedPreferences.length > 3 && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-gray-500">
                        还有 {savedPreferences.length - 3} 个历史设置
                      </span>
                    </div>
                  )}
                </div>
              )}

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

                {/* 工作职责 */}
                <div className="space-y-2">
                  <Label htmlFor="jobResponsibilities">工作职责</Label>
                  <Textarea
                    id="jobResponsibilities"
                    value={formData.jobResponsibilities}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobResponsibilities: e.target.value }))}
                    placeholder="请粘贴岗位JD中的完整工作职责描述..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    详细的工作职责描述将帮助AI生成更精准的项目经验和架构设计类题目
                  </p>
                </div>

                {/* 任职要求 */}
                <div className="space-y-2">
                  <Label htmlFor="jobRequirements">任职要求</Label>
                  <Textarea
                    id="jobRequirements"
                    value={formData.jobRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobRequirements: e.target.value }))}
                    placeholder="请粘贴岗位JD中的完整任职要求..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    任职要求将帮助AI生成针对性的技术深度、经验层次和软技能类题目
                  </p>
                </div>

                {/* 技能要求（简化版，作为补充） */}
                <div className="space-y-2">
                  <Label htmlFor="requirements">核心技术栈（可选）</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="如果上述内容未涵盖核心技术，可补充关键技术栈，用逗号分隔&#10;例如：Golang, Kubernetes, Redis, MySQL, 微服务架构"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    此字段为补充信息，主要用于技术栈覆盖度检查
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/upload")}
                  >
                    上一步
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={clearForm}
                      className="text-gray-500"
                    >
                      清空表单
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !formData.company || !formData.position || !formData.level || !formData.jobResponsibilities?.trim() || !formData.jobRequirements?.trim()}
                    >
                      {isLoading ? "保存中..." : "开始面试"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}