import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const months = await prisma.allocationMonth.findMany({
    where: { isActive: true },
    orderBy: { month: 'asc' }
  })
  return NextResponse.json(months)
}