import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        rounds: {
          include: {
            questions: {
              select: {
                id: true,
                content: true,
                type: true,
                difficulty: true,
                category: true,
                userAnswer: true,
                score: true
              }
            }
          }
        },
        jobPosition: true
      }
    })

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      )
    }

    const questions = interview.rounds.flatMap(round => round.questions)

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        type: interview.type,
        status: interview.status,
        createdAt: interview.createdAt
      },
      questions,
      jobPosition: interview.jobPosition
    })

  } catch (error) {
    console.error('Get interview error:', error)
    return NextResponse.json(
      { error: "Failed to get interview" },
      { status: 500 }
    )
  }
}