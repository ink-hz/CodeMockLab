import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 查询用户最新的简历
    const resume = await prisma.resume.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        fileName: true,
        createdAt: true,
        techKeywords: true,
        projects: true,
        workExperience: true
      }
    })

    return NextResponse.json({
      hasResume: !!resume,
      resume: resume
    })
  } catch (error) {
    console.error("Check resume error:", error)
    return NextResponse.json(
      { error: "Failed to check resume" },
      { status: 500 }
    )
  }
}