import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const expertise = searchParams.get('expertise')

  const users = await prisma.user.findMany({
    where: expertise ? {
      expertise: { name: expertise }
    } : undefined,
    include: { expertise: true },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const { name, email, expertiseId } = await request.json()

  const user = await prisma.user.create({
    data: {
      name,
      email,
      expertiseId: expertiseId || null
    },
    include: { expertise: true }
  })

  return NextResponse.json(user)
}