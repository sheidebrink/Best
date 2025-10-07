import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  const { stories } = await request.json()

  await Promise.all(
    stories.map((story: { id: number; sortOrder: number }) =>
      prisma.userStory.update({
        where: { id: story.id },
        data: { sortOrder: story.sortOrder }
      })
    )
  )

  return NextResponse.json({ success: true })
}