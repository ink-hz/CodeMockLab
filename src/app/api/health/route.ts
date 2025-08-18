import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`
    
    // 检查环境变量
    const requiredEnvs = [
      'DATABASE_URL',
      'NEXTAUTH_URL', 
      'NEXTAUTH_SECRET',
      'DEEPSEEK_API_KEY'
    ]
    
    const missingEnvs = requiredEnvs.filter(env => !process.env[env])
    
    if (missingEnvs.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: `Missing environment variables: ${missingEnvs.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Application is running properly',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      services: {
        prisma: 'ok',
        deepseek: process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing',
        auth: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}