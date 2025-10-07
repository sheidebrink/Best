import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  await prisma.holiday.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}