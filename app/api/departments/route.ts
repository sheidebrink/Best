import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const departments = await prisma.department.findMany({
    include: { 
      projects: {
        include: {
          projectManager: true,
          estimate: true
        },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })
  return NextResponse.json(departments)
}