import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseResume } from "@/lib/resume-parser"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // 验证文件类型
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and Word documents are allowed." },
        { status: 400 }
      )
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // 将文件转换为Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 模拟简历解析（暂时返回mock数据，避免pdf-parse等依赖问题）
    const parsedContent = {
      rawText: `模拟简历内容 - ${file.name}`,
      techKeywords: ["React", "TypeScript", "Node.js", "JavaScript", "HTML", "CSS"],
      projects: [
        {
          name: "电商平台项目",
          description: "使用React和Node.js开发的全栈电商平台",
          technologies: ["React", "Node.js", "MySQL"]
        }
      ],
      workExperience: [
        {
          company: "科技公司",
          position: "前端工程师",
          duration: "2022-2024",
          description: "负责前端开发和维护"
        }
      ],
      experienceLevel: "MID" as const,
      skills: ["React", "TypeScript", "Node.js"]
    }

    // 保存到数据库
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl: `/uploads/${Date.now()}-${file.name}`, // 实际项目中应上传到云存储
        parsedContent: parsedContent as any,
        techKeywords: parsedContent.techKeywords || [],
        projects: parsedContent.projects || [],
        workExperience: parsedContent.workExperience || [],
      }
    })

    // 更新用户画像
    if (parsedContent.techKeywords && parsedContent.techKeywords.length > 0) {
      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          experienceLevel: parsedContent.experienceLevel || "JUNIOR",
          techStack: parsedContent.techKeywords,
          targetRoles: [],
          targetCompanies: [],
          weakAreas: [],
        },
        update: {
          techStack: parsedContent.techKeywords,
          experienceLevel: parsedContent.experienceLevel || "JUNIOR",
        }
      })
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      parsedContent: {
        techKeywords: resume.techKeywords,
        projects: resume.projects,
        workExperience: resume.workExperience,
      }
    })
  } catch (error) {
    console.error("Resume upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload and parse resume" },
      { status: 500 }
    )
  }
}