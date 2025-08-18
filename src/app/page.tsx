import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <Code className="h-16 w-16 text-primary mr-4" />
          <h1 className="text-5xl font-bold">CodeMockLab</h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          AI驱动的程序员模拟面试平台
          <br />
          上传简历 → 设置岗位 → AI面试 → 获得反馈
        </p>
        
        <div className="space-y-4">
          <Link href="/register">
            <Button size="lg" className="w-48">
              开始面试练习
            </Button>
          </Link>
          <br />
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-48">
              已有账户？登录
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
