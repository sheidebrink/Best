import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { userStoryId, discipline, hours } = await request.json()

  const estimateItem = await prisma.estimateItem.upsert({
    where: {
      userStoryId_discipline: {
        userStoryId,
        discipline
      }
    },
    update: {
      hours
    },
    create: {
      userStoryId,
      discipline,
      hours
    }
  })

  return NextResponse.json(estimateItem)
}