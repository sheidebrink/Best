import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const monthId = searchParams.get('monthId')

  if (!monthId) {
    return NextResponse.json({ error: 'monthId is required' }, { status: 400 })
  }

  const allocations = await prisma.allocation.findMany({
    where: { allocationMonthId: parseInt(monthId) }
  })

  return NextResponse.json(allocations)
}

export async function POST(request: NextRequest) {
  const { userId, projectId, allocationMonthId, percentage } = await request.json()

  if (percentage === 0) {
    await prisma.allocation.deleteMany({
      where: { userId, projectId, allocationMonthId }
    })
  } else {
    await prisma.allocation.upsert({
      where: {
        userId_projectId_allocationMonthId: {
          userId,
          projectId,
          allocationMonthId
        }
      },
      update: { percentage },
      create: { userId, projectId, allocationMonthId, percentage }
    })
  }

  return NextResponse.json({ success: true })
}