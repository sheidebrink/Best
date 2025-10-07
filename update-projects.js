const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateProjectsToGreen() {
  try {
    const result = await prisma.project.updateMany({
      data: {
        status: 'Green'
      }
    })
    
    console.log(`Updated ${result.count} projects to Green status`)
  } catch (error) {
    console.error('Error updating projects:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateProjectsToGreen()