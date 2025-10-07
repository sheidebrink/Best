import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const holidays = await prisma.holiday.findMany({
    orderBy: { date: 'asc' }
  })

  return NextResponse.json(holidays)
}

export async function POST(request: NextRequest) {
  const { name, date } = await request.json()

  const holiday = await prisma.holiday.create({
    data: {
      name,
      date: new Date(date)
    }
  })

  return NextResponse.json(holiday)
}