"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Target, MessageSquare, BarChart3, LogOut, CheckCircle, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [resumeInfo, setResumeInfo] = useState<any>(null)
  const [hasResume, setHasResume] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    // 检查用户是否已上传简历
    if (session?.user?.id) {
      checkResume()
    }
  }, [session])

  const checkResume = async () => {
    try {
      const response = await fetch("/api/resume/check")
      const data = await response.json()
      setHasResume(data.hasResume)
      setResumeInfo(data.resume)
      
      // 如果已有简历，自动设置到第2步
      if (data.hasResume) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error("Error checking resume:", error)
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    </div>
  }

  if (!session) return null

  const steps = [
    {
      id: 1,
      title: "上传简历",
      description: "上传您的简历，让AI了解您的技能和经验",
      icon: Upload,
      href: "/upload",
      status: "pending"
    },
    {
      id: 2,
      title: "设置目标岗位",
      description: "选择您想要面试的公司和职位",
      icon: Target,
      href: "/job-setup",
      status: "disabled"
    },
    {
      id: 3,
      title: "开始AI面试",
      description: "与AI面试官进行实时模拟面试",
      icon: MessageSquare,
      href: "/interview/start",
      status: "disabled"
    },
    {
      id: 4,
      title: "查看面试报告",
      description: "获得详细的面试分析和改进建议",
      icon: BarChart3,
      href: "/report",
      status: "disabled"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">CodeMockLab</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              欢迎，{session.user?.name || session.user?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">开始您的AI面试之旅</h2>
          <p className="text-muted-foreground">只需4个简单步骤，获得专业的面试训练</p>
        </div>

        {/* 简历状态显示 */}
        {hasResume && resumeInfo && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold">简历已上传</h3>
                      <p className="text-sm text-muted-foreground">
                        {resumeInfo.fileName} - 上传于 {new Date(resumeInfo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push("/upload")}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    更新简历
                  </Button>
                </div>
              </CardHeader>
              {resumeInfo.techKeywords && resumeInfo.techKeywords.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {resumeInfo.techKeywords.slice(0, 8).map((keyword: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep || (step.id === 1 && hasResume)
              const isDisabled = step.id === 1 ? false : step.id === 2 ? !hasResume : step.id > currentStep

              return (
                <Card 
                  key={step.id}
                  className={`cursor-pointer transition-all ${
                    isActive ? "ring-2 ring-primary shadow-lg" : 
                    isCompleted ? "bg-green-50 border-green-200" :
                    isDisabled ? "opacity-50" : "hover:shadow-md"
                  }`}
                  onClick={() => !isDisabled && router.push(step.href)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`rounded-full p-2 ${
                        isCompleted ? "bg-green-500 text-white" :
                        isActive ? "bg-primary text-primary-foreground" :
                        "bg-muted"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          第{step.id}步: {step.title}
                        </CardTitle>
                        {isActive && !isCompleted && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            当前步骤
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                            已完成
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                    {isActive && !isCompleted && (
                      <Button className="mt-4 w-full">
                        立即开始
                      </Button>
                    )}
                    {step.id === 1 && hasResume && (
                      <Button 
                        className="mt-4 w-full" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push("/upload")
                        }}
                      >
                        重新上传
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}