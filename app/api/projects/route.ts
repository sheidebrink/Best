import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      department: true,
      projectManager: true,
      estimate: true
    },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const { name, departmentId } = await request.json()

  const project = await prisma.project.create({
    data: {
      name,
      departmentId,
      sortOrder: 0
    },
    include: {
      department: true,
      projectManager: true,
      estimate: true
    }
  })

  return NextResponse.json(project)
}