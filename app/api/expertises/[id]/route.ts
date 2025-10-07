import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const { name, sortOrder } = await request.json()

  const expertise = await prisma.expertise.update({
    where: { id },
    data: { 
      ...(name !== undefined && { name }),
      ...(sortOrder !== undefined && { sortOrder })
    }
  })

  return NextResponse.json(expertise)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  await prisma.expertise.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}