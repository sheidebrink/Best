import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { projectId, blendedRate } = await request.json()

  // Check if estimate already exists
  const existingEstimate = await prisma.estimate.findUnique({
    where: { projectId },
    include: {
      userStories: {
        include: { estimateItems: true }
      },
      groups: {
        include: { userStories: true }
      }
    }
  })

  if (existingEstimate) {
    return NextResponse.json(existingEstimate)
  }

  const estimate = await prisma.estimate.create({
    data: {
      projectId,
      blendedRate
    },
    include: {
      userStories: {
        include: { estimateItems: true }
      },
      groups: {
        include: { userStories: true }
      }
    }
  })

  return NextResponse.json(estimate)
}