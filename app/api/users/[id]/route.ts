import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      expertise: true,
      allocations: {
        include: {
          project: {
            include: { department: true }
          },
          allocationMonth: true
        }
      }
    }
  })

  return NextResponse.json(user)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const { name, email, expertiseId } = await request.json()

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email
  if (expertiseId !== undefined) updateData.expertiseId = expertiseId || null

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { expertise: true }
  })

  return NextResponse.json(user)
}