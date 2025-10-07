import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      department: true,
      estimate: true,
      expertises: {
        include: { expertise: true }
      },
      allocations: {
        include: {
          user: true,
          allocationMonth: true
        }
      }
    }
  })

  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { name, description, status, sortOrder, startDate, targetDate, actualCompletionDate, mondayBoardId, projectManagerId, expertiseIds } = body
  
  // Only delete and recreate expertises if expertiseIds is provided
  if (expertiseIds !== undefined) {
    await prisma.projectExpertise.deleteMany({
      where: { projectId: parseInt(params.id) }
    })
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description || null
  if (status !== undefined) updateData.status = status
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
  if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null
  if (actualCompletionDate !== undefined) updateData.actualCompletionDate = actualCompletionDate ? new Date(actualCompletionDate) : null
  if (mondayBoardId !== undefined) updateData.mondayBoardId = mondayBoardId || null
  if (projectManagerId !== undefined) updateData.projectManagerId = projectManagerId || null
  
  if (expertiseIds !== undefined) {
    updateData.expertises = {
      create: expertiseIds.map((expertiseId: number) => ({
        expertiseId
      }))
    }
  }

  const project = await prisma.project.update({
    where: { id: parseInt(params.id) },
    data: updateData
  })

  return NextResponse.json(project)
}