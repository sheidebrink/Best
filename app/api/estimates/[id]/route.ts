import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  const estimate = await prisma.estimate.findUnique({
    where: { projectId: id },
    include: {
      userStories: {
        include: { estimateItems: true },
        orderBy: { sortOrder: 'asc' }
      },
      groups: {
        include: { userStories: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  }

  return NextResponse.json(estimate)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const { blendedRate } = await request.json()

  const estimate = await prisma.estimate.update({
    where: { id },
    data: { blendedRate }
  })

  return NextResponse.json(estimate)
}