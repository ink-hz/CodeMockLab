"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, User, Briefcase, Target } from "lucide-react"

export default function ProfilePage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", "temp-user-id") // 实际应从session获取

    try {
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        setUploadResult(result.parsedContent)
      } else {
        alert("上传失败: " + result.error)
      }
    } catch (error) {
      alert("上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">个人档案</h1>
        <p className="text-muted-foreground">完善您的信息以获得更精准的面试体验</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 简历上传 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              简历上传与解析
            </CardTitle>
            <CardDescription>
              上传您的简历，AI将自动提取技能和项目经验
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="mb-4">
                  <Label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">
                      支持 PDF、Word 格式，最大 10MB
                    </span>
                  </Label>
                </div>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button 
                  onClick={() => document.getElementById('resume-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "解析中..." : "选择文件"}
                </Button>
              </div>
            </div>

            {uploadResult && (
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">解析结果：</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">技术栈</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {uploadResult.techKeywords?.map((tech: string, index: number) => (
                        <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">项目经验</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      发现 {uploadResult.projects?.length || 0} 个项目
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="experience-level">经验级别</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择经验级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR">初级 (0-2年)</SelectItem>
                  <SelectItem value="MID">中级 (2-5年)</SelectItem>
                  <SelectItem value="SENIOR">高级 (5-8年)</SelectItem>
                  <SelectItem value="LEAD">专家 (8+年)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="current-role">当前职位</Label>
              <Input id="current-role" placeholder="如：前端工程师" />
            </div>
            <div>
              <Label htmlFor="location">所在城市</Label>
              <Input id="location" placeholder="如：北京" />
            </div>
          </CardContent>
        </Card>

        {/* 求职意向 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              求职意向
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="target-role">目标职位</Label>
              <Input id="target-role" placeholder="如：高级前端工程师" />
            </div>
            <div>
              <Label htmlFor="target-companies">目标公司</Label>
              <Input id="target-companies" placeholder="如：腾讯,阿里,字节" />
            </div>
            <div>
              <Label htmlFor="expected-salary">期望薪资</Label>
              <Input id="expected-salary" placeholder="如：20-30K" />
            </div>
          </CardContent>
        </Card>

        {/* 技能评估 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              技能评估
            </CardTitle>
            <CardDescription>
              评估您在各个技术领域的水平
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['算法与数据结构', '系统设计', '前端开发', '后端开发', '数据库'].map((skill) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{skill}</span>
                  <Select>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="评分" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1分</SelectItem>
                      <SelectItem value="2">2分</SelectItem>
                      <SelectItem value="3">3分</SelectItem>
                      <SelectItem value="4">4分</SelectItem>
                      <SelectItem value="5">5分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Button className="w-full">保存个人档案</Button>
        </div>
      </div>
    </div>
  )
}