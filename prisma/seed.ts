import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Expertise areas
  const expertises = await Promise.all([
    prisma.expertise.create({ data: { name: 'QA' } }),
    prisma.expertise.create({ data: { name: 'Software' } }),
    prisma.expertise.create({ data: { name: 'Data' } }),
    prisma.expertise.create({ data: { name: 'Automation' } }),
    prisma.expertise.create({ data: { name: 'Project Management' } }),
  ])

  // Departments
  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Corporate', sortOrder: 1 } }),
    prisma.department.create({ data: { name: 'SISCO', sortOrder: 2 } }),
    prisma.department.create({ data: { name: 'Captives', sortOrder: 3 } }),
    prisma.department.create({ data: { name: 'Transportation', sortOrder: 4 } }),
    prisma.department.create({ data: { name: 'Benefits', sortOrder: 5 } }),
    prisma.department.create({ data: { name: 'BCC', sortOrder: 6 } }),
    prisma.department.create({ data: { name: 'CBCS', sortOrder: 7 } }),
    prisma.department.create({ data: { name: 'Wellness', sortOrder: 8 } }),
  ])

  // Users
  await Promise.all([
    prisma.user.create({ data: { name: 'Kim Smith', email: 'kim.smith@bebetter.com', expertiseId: expertises[0].id } }),
    prisma.user.create({ data: { name: 'David Johnson', email: 'david.johnson@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'George Williams', email: 'george.williams@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Steve Brown', email: 'steve.brown@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Isaac Davis', email: 'isaac.davis@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Josh Miller', email: 'josh.miller@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Blake Wilson', email: 'blake.wilson@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Keegan Moore', email: 'keegan.moore@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Bryce Taylor', email: 'bryce.taylor@bebetter.com', expertiseId: expertises[1].id } }),
    prisma.user.create({ data: { name: 'Jillian Anderson', email: 'jillian.anderson@bebetter.com', expertiseId: expertises[3].id } }),
    prisma.user.create({ data: { name: 'Chloe Thomas', email: 'chloe.thomas@bebetter.com', expertiseId: expertises[3].id } }),
    prisma.user.create({ data: { name: 'Jeff Jackson', email: 'jeff.jackson@bebetter.com', expertiseId: expertises[2].id } }),
    prisma.user.create({ data: { name: 'Dan White', email: 'dan.white@bebetter.com', expertiseId: expertises[2].id } }),
    prisma.user.create({ data: { name: 'Travis', email: 'travis@bebetter.com', expertiseId: expertises[4].id } }),
    prisma.user.create({ data: { name: 'BriAnna', email: 'brianna@bebetter.com', expertiseId: expertises[4].id } }),
    prisma.user.create({ data: { name: 'Jalen', email: 'jalen@bebetter.com', expertiseId: expertises[4].id } }),
  ])

  // Projects
  const corporateProjects = [
    'Overhead', 'PTO', 'Info-capture', 'Janus / Iris / Engage Maintenance / Improvements',
    'Employee Historical DB', 'Carrier / Wholesale Dashboard', 'Janus SSO', 'Janus Roles Power BI', 'Training'
  ]
  const siscoProjects = [
    'Actuaria Drug Warranty Online Claims Submission', 'Verification Phase II', 'Map Field LuminX Phase II',
    'Verification Eligibility Audit (AWS AI)', 'Bank Reconciliation Phase II'
  ]
  const captivesProjects = ['Data Report Power BI vs C#']
  const transportationProjects = [
    'CSR24 Highway Project', 'Independent Contractor Score Card', 'VIN DB Backup Automation',
    'Producer Top 10', 'Client Iris', 'Risk - Management Migration Dashboard', 'NSTD Direct / Backoffice Iris'
  ]
  const benefitsProjects = ['Account Team Changes']
  const bccProjects = ['Carrier premium reporting updates']
  const cbcsProjects = ['Escrow Invoices', 'Data Submission Page', 'Adjuster/Vetiv Evaluation', 'Critical Email Mining Phase II']
  const wellnessProjects = ['Summary Sheet Automation & Efficiencies', 'Wellness', 'Engage360']

  await Promise.all([
    ...corporateProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[0].id } })),
    ...siscoProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[1].id } })),
    ...captivesProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[2].id } })),
    ...transportationProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[3].id } })),
    ...benefitsProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[4].id } })),
    ...bccProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[5].id } })),
    ...cbcsProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[6].id } })),
    ...wellnessProjects.map(name => prisma.project.create({ data: { name, departmentId: departments[7].id } })),
  ])

  // Holidays
  await Promise.all([
    prisma.holiday.create({ data: { name: 'Thanksgiving', date: new Date('2025-11-27') } }),
    prisma.holiday.create({ data: { name: 'Thanksgiving', date: new Date('2025-11-28') } }),
    prisma.holiday.create({ data: { name: 'Christmas', date: new Date('2025-12-25') } }),
  ])

  // Allocation months
  const months = []
  for (let i = 1; i <= 10; i++) {
    const date = new Date(2025, i - 1, 1)
    months.push(await prisma.allocationMonth.create({
      data: {
        name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        month: date,
        isActive: true
      }
    }))
  }

  // Sample allocations
  const kimSmith = await prisma.user.findFirst({ where: { name: 'Kim Smith' } })
  const clientIris = await prisma.project.findFirst({ where: { name: 'Client Iris' } })
  const dataSubmissionPage = await prisma.project.findFirst({ where: { name: 'Data Submission Page' } })
  const octoberMonth = months[9] // October 2025

  if (kimSmith && clientIris && dataSubmissionPage && octoberMonth) {
    await Promise.all([
      prisma.allocation.create({
        data: {
          userId: kimSmith.id,
          projectId: clientIris.id,
          allocationMonthId: octoberMonth.id,
          percentage: 15
        }
      }),
      prisma.allocation.create({
        data: {
          userId: kimSmith.id,
          projectId: dataSubmissionPage.id,
          allocationMonthId: octoberMonth.id,
          percentage: 15
        }
      })
    ])
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })