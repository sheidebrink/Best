import { NextRequest, NextResponse } from 'next/server'

function generateLocalInsights(data: any): string {
  const overAllocated = data.expertises.flatMap((exp: any) => 
    exp.users.filter((user: any) => user.totalAllocation > 100)
  )
  const underAllocated = data.expertises.flatMap((exp: any) => 
    exp.users.filter((user: any) => user.totalAllocation < 80)
  )
  
  const projectVariances = data.projects.map((proj: any) => ({
    name: proj.name,
    variance: proj.allocatedHours - proj.estimatedHours,
    allocated: proj.allocatedHours,
    estimated: proj.estimatedHours
  })).filter((p: any) => Math.abs(p.variance) > 5)
  
  const totalAllocated = data.projects.reduce((sum: number, proj: any) => sum + proj.allocatedHours, 0)
  const totalEstimated = data.projects.reduce((sum: number, proj: any) => sum + proj.estimatedHours, 0)
  
  return `📊 RESOURCE ALLOCATION ANALYSIS - ${data.month}

🎯 OVERVIEW:
• Available Hours: ${data.availableHours}
• Total Allocated: ${totalAllocated.toFixed(1)}h
• Total Estimated: ${totalEstimated.toFixed(1)}h
• Variance: ${(totalAllocated - totalEstimated).toFixed(1)}h

⚠️ ALLOCATION ISSUES:
• Over-allocated: ${overAllocated.length} team members
• Under-utilized: ${underAllocated.length} team members
${overAllocated.length > 0 ? '• Critical: ' + overAllocated.map((u: any) => `${u.name} (${u.totalAllocation}%)`).join(', ') : ''}

📈 PROJECT INSIGHTS:
${projectVariances.slice(0, 3).map((proj: any) => 
  `• ${proj.name}: ${proj.variance > 0 ? 'Over' : 'Under'} by ${Math.abs(proj.variance).toFixed(1)}h`
).join('\n')}

💡 RECOMMENDATIONS:
${overAllocated.length > 0 ? '• Redistribute workload from over-allocated resources\n' : ''}${underAllocated.length > 0 ? '• Utilize under-allocated team members\n' : ''}• Review project estimates vs actual allocations
• Consider timeline adjustments for over-allocated projects`
}

function generateProjectInsights(data: any): string {
  const statusCounts = data.projectsByStatus
  const deptCounts = data.projectsByDepartment
  const riskProjects = data.projectsWithoutPM + data.projectsWithoutTargetDate + data.overdueProjects
  
  return `📊 PROJECT PORTFOLIO ANALYSIS

🎯 OVERVIEW:
• Total Projects: ${data.totalProjects}
• Risk Projects: ${riskProjects} (${((riskProjects/data.totalProjects)*100).toFixed(1)}%)

📈 STATUS BREAKDOWN:
${Object.entries(statusCounts).map(([status, count]) => `• ${status}: ${count}`).join('\n')}

🏢 DEPARTMENT DISTRIBUTION:
${Object.entries(deptCounts).map(([dept, count]) => `• ${dept}: ${count}`).join('\n')}

⚠️ RISK FACTORS:
${data.projectsWithoutPM > 0 ? `• ${data.projectsWithoutPM} projects without Project Manager\n` : ''}${data.projectsWithoutTargetDate > 0 ? `• ${data.projectsWithoutTargetDate} projects without target dates\n` : ''}${data.overdueProjects > 0 ? `• ${data.overdueProjects} overdue projects\n` : ''}

💡 RECOMMENDATIONS:
• Assign PMs to unmanaged projects
• Set target dates for planning
• Review overdue project priorities
• Balance workload across departments`
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    
    let analysis: string
    
    if (requestData.projectOverview) {
      // Project overview analysis
      analysis = generateProjectInsights(requestData.projectOverview)
    } else {
      // Resource allocation analysis
      analysis = generateLocalInsights(requestData)
    }
    
    return NextResponse.json({
      analysis
    })
  } catch (error: any) {
    console.error('AI Insights error:', error)
    return NextResponse.json(
      { error: `Failed to generate insights: ${error.message || error}` },
      { status: 500 }
    )
  }
}