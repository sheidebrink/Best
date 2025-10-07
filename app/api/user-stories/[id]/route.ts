import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  // Delete estimate items first (cascade)
  await prisma.estimateItem.deleteMany({
    where: { userStoryId: id }
  })

  // Delete user story
  await prisma.userStory.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}