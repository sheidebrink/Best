import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { name, estimateId } = await request.json()

  const userStory = await prisma.userStory.create({
    data: {
      name,
      estimateId,
      sortOrder: 0
    },
    include: {
      estimateItems: true
    }
  })

  return NextResponse.json(userStory)
}