import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const expertises = await prisma.expertise.findMany({
    include: {
      users: {
        include: { expertise: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })
  return NextResponse.json(expertises)
}

export async function POST(request: NextRequest) {
  const { name, sortOrder } = await request.json()

  const expertise = await prisma.expertise.create({
    data: { name, sortOrder }
  })

  return NextResponse.json(expertise)
}