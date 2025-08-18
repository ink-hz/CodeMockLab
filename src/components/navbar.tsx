"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Code, User, FileText, History, LogOut } from "lucide-react"

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Code className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">CodeMockLab</span>
        </Link>

        {status === "loading" ? (
          <div className="h-9 w-20 bg-muted animate-pulse rounded" />
        ) : session ? (
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                仪表板
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground">
                个人档案
              </Link>
              <Link href="/interviews" className="text-muted-foreground hover:text-foreground">
                面试记录
              </Link>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <User className="h-4 w-4 mr-2" />
                  {session.user?.name || session.user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    个人档案
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interviews" className="flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    面试记录
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <nav className="flex items-center space-x-4">
            <Link href="/features" className="text-muted-foreground hover:text-foreground">
              功能特性
            </Link>
            <Link href="/login">
              <Button variant="outline">登录</Button>
            </Link>
            <Link href="/register">
              <Button>免费开始</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}