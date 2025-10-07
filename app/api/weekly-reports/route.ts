import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (projectId) {
    const reports = await prisma.weeklyReport.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { weekStarting: 'desc' }
    })
    return NextResponse.json(reports)
  }

  return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  const { projectId, weekStarting, accomplishments, challenges, goals } = await request.json()

  const report = await prisma.weeklyReport.upsert({
    where: {
      projectId_weekStarting: {
        projectId,
        weekStarting: new Date(weekStarting)
      }
    },
    update: { accomplishments, challenges, goals },
    create: {
      projectId,
      weekStarting: new Date(weekStarting),
      accomplishments,
      challenges,
      goals
    }
  })

  return NextResponse.json(report)
}