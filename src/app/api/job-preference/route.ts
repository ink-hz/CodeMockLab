import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'

// 获取用户的岗位偏好设置
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'latest' // latest | default | all

  try {
    let preferences

    if (type === 'default') {
      // 获取默认偏好设置
      preferences = await prisma.userJobPreference.findFirst({
        where: {
          userId: session.user.id,
          isDefault: true
        }
      })
    } else if (type === 'latest') {
      // 获取最近使用的偏好设置
      preferences = await prisma.userJobPreference.findFirst({
        where: {
          userId: session.user.id
        },
        orderBy: {
          lastUsedAt: 'desc'
        }
      })
    } else {
      // 获取所有偏好设置
      preferences = await prisma.userJobPreference.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: [
          { isDefault: 'desc' },
          { lastUsedAt: 'desc' }
        ],
        take: 10 // 限制返回数量
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    console.error('获取岗位偏好失败:', error)
    return NextResponse.json(
      { error: '获取偏好设置失败' }, 
      { status: 500 }
    )
  }
})

// 保存或更新用户的岗位偏好设置
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const body = await request.json()
  const { 
    company, 
    customCompany, 
    position, 
    level, 
    requirements,
    jobResponsibilities,
    jobRequirements,
    isDefault = false 
  } = body

  try {
    // 检查是否已存在相同的偏好设置
    const existingPreference = await prisma.userJobPreference.findFirst({
      where: {
        userId: session.user.id,
        company: company,
        position: position,
        level: level
      }
    })

    let preference

    if (existingPreference) {
      // 更新现有偏好设置
      preference = await prisma.userJobPreference.update({
        where: {
          id: existingPreference.id
        },
        data: {
          customCompany,
          requirements,
          jobResponsibilities,
          jobRequirements,
          usageCount: existingPreference.usageCount + 1,
          lastUsedAt: new Date(),
          isDefault
        }
      })
    } else {
      // 如果设为默认，先取消其他默认设置
      if (isDefault) {
        await prisma.userJobPreference.updateMany({
          where: {
            userId: session.user.id,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        })
      }

      // 创建新的偏好设置
      preference = await prisma.userJobPreference.create({
        data: {
          userId: session.user.id,
          company,
          customCompany,
          position,
          level,
          requirements,
          jobResponsibilities,
          jobRequirements,
          isDefault,
          usageCount: 1,
          lastUsedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: preference
    })
  } catch (error) {
    console.error('保存岗位偏好失败:', error)
    return NextResponse.json(
      { error: '保存偏好设置失败' }, 
      { status: 500 }
    )
  }
})

// 删除岗位偏好设置
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const preferenceId = searchParams.get('id')

  if (!preferenceId) {
    return NextResponse.json({ error: '缺少偏好设置ID' }, { status: 400 })
  }

  try {
    await prisma.userJobPreference.delete({
      where: {
        id: preferenceId,
        userId: session.user.id // 确保只能删除自己的偏好设置
      }
    })

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除岗位偏好失败:', error)
    return NextResponse.json(
      { error: '删除偏好设置失败' }, 
      { status: 500 }
    )
  }
})