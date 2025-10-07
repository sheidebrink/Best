'use client'

import React, { useState, useEffect } from 'react'

interface Project {
  id: number
  name: string
  description: string | null
  status: string
  startDate: string | null
  targetDate: string | null
  department: { id: number; name: string }
  projectManager: { id: number; name: string } | null
  expertises: { expertise: { id: number; name: string } }[]
}

interface Department {
  id: number
  name: string
}

interface Expertise {
  id: number
  name: string
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>(['Green', 'Yellow', 'Red'])
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([])
  const [pmFilter, setPmFilter] = useState<string[]>([])
  const [expertiseFilter, setExpertiseFilter] = useState<string[]>([])
  const [weekFilter, setWeekFilter] = useState<string>('')
  const [weeklyReports, setWeeklyReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState<string>('')
  const [showInsights, setShowInsights] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [projectManagers, setProjectManagers] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsRes, deptsRes, expertisesRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/departments'),
        fetch('/api/expertises')
      ])
      
      const projectsData = await projectsRes.json()
      const deptsData = await deptsRes.json()
      const expertisesData = await expertisesRes.json()
      
      setProjects(projectsData)
      setDepartments(deptsData)
      setExpertises(expertisesData)
      
      // Load project managers
      const pmRes = await fetch('/api/users?expertise=Project Management')
      const pmData = await pmRes.json()
      setProjectManagers(pmData)
      
      // Set default week to current week
      const today = new Date()
      const currentWeek = getWeekStarting(today)
      setWeekFilter(currentWeek)
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setIsLoading(false)
  }

  const generateAIInsights = async () => {
    setLoadingInsights(true)
    try {
      const projectData = {
        totalProjects: projects.length,
        projectsByStatus: projects.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        projectsByDepartment: projects.reduce((acc, p) => {
          acc[p.department.name] = (acc[p.department.name] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        projectsWithoutPM: projects.filter(p => !p.projectManager).length,
        projectsWithoutTargetDate: projects.filter(p => !p.targetDate).length,
        overdueProjects: projects.filter(p => p.targetDate && new Date(p.targetDate) < new Date()).length
      }

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectOverview: projectData })
      })

      if (response.ok) {
        const insights = await response.json()
        setAiInsights(insights.analysis)
        setShowInsights(true)
      }
    } catch (error) {
      console.error('Error generating AI insights:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Green': return 'bg-green-100 text-green-800'
      case 'Yellow': return 'bg-yellow-100 text-yellow-800'
      case 'Red': return 'bg-red-100 text-red-800'
      case 'Complete': return 'bg-blue-100 text-blue-800'
      case 'Business Hold': return 'bg-gray-100 text-gray-800'
      case 'New Request': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWeekStarting = (date: Date): string => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  const loadWeeklyReports = async (weekStarting: string) => {
    try {
      const allReports = await Promise.all(
        projects.map(async (project) => {
          const res = await fetch(`/api/weekly-reports?projectId=${project.id}`)
          const projectReports = await res.json()
          const weekReport = projectReports.find((r: any) => r.weekStarting.split('T')[0] === weekStarting)
          return weekReport ? { ...weekReport, projectId: project.id } : null
        })
      )
      setWeeklyReports(allReports.filter(Boolean))
    } catch (error) {
      console.error('Error loading weekly reports:', error)
    }
  }

  const getWeeklyReportForProject = (projectId: number) => {
    return weeklyReports.find(report => report && report.projectId === projectId)
  }

  useEffect(() => {
    if (weekFilter && projects.length > 0) {
      loadWeeklyReports(weekFilter)
    }
  }, [weekFilter, projects])

  const filteredProjects = projects.filter(project => {
    // Apply all filters
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(project.status)
    const deptMatch = departmentFilter.length === 0 || departmentFilter.includes(project.department.id.toString())
    const pmMatch = pmFilter.length === 0 || 
      (pmFilter.includes('unassigned') && !project.projectManager) ||
      (project.projectManager && pmFilter.includes(project.projectManager.name))
    const expertiseMatch = expertiseFilter.length === 0 || 
      (project.expertises && project.expertises.some(pe => expertiseFilter.includes(pe.expertise.id.toString())))
    
    // If only default status filters applied, use them
    if (departmentFilter.length === 0 && pmFilter.length === 0 && expertiseFilter.length === 0) {
      return statusMatch
    }
    
    // If any filter is applied, show all matching projects (including Complete/Business Hold)
    return statusMatch && deptMatch && pmMatch && expertiseMatch
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="gradHome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#1e40af'}} />
              <stop offset="100%" style={{stopColor:'#3b82f6'}} />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#gradHome)"/>
          <path d="M20 40 L32 20 L44 40 L38 40 L32 30 L26 40 Z" fill="white"/>
          <rect x="28" y="42" width="8" height="4" fill="white"/>
        </svg>
        <div>
          <h1 className="text-3xl font-bold">BEST - Business Elevated Synergetic Tracking</h1>
        </div>
      </div>
      
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Status:</label>
          <div className="border rounded p-2 max-h-32 overflow-y-auto">
            {['Business Hold', 'Complete', 'Green', 'New Request', 'Yellow', 'Red'].map(status => (
              <label key={status} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(status)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setStatusFilter([...statusFilter, status])
                    } else {
                      setStatusFilter(statusFilter.filter(s => s !== status))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Department:</label>
          <div className="border rounded p-2 max-h-32 overflow-y-auto">
            {departments.map(dept => (
              <label key={dept.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={departmentFilter.includes(dept.id.toString())}
                  onChange={(e) => {
                    const deptId = dept.id.toString()
                    if (e.target.checked) {
                      setDepartmentFilter([...departmentFilter, deptId])
                    } else {
                      setDepartmentFilter(departmentFilter.filter(d => d !== deptId))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{dept.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Filter by PM:</label>
          <div className="border rounded p-2 max-h-32 overflow-y-auto">
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={pmFilter.includes('unassigned')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPmFilter([...pmFilter, 'unassigned'])
                  } else {
                    setPmFilter(pmFilter.filter(p => p !== 'unassigned'))
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">Unassigned</span>
            </label>
            {[...new Set(projects.filter(p => p.projectManager).map(p => p.projectManager!.name))].map(pmName => (
              <label key={pmName} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={pmFilter.includes(pmName)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPmFilter([...pmFilter, pmName])
                    } else {
                      setPmFilter(pmFilter.filter(p => p !== pmName))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{pmName}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Expertise:</label>
          <div className="border rounded p-2 max-h-32 overflow-y-auto">
            {expertises.map(exp => (
              <label key={exp.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={expertiseFilter.includes(exp.id.toString())}
                  onChange={(e) => {
                    const expId = exp.id.toString()
                    if (e.target.checked) {
                      setExpertiseFilter([...expertiseFilter, expId])
                    } else {
                      setExpertiseFilter(expertiseFilter.filter(e => e !== expId))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{exp.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Work Week:</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={weekFilter}
            onChange={(e) => {
              setWeekFilter(e.target.value)
              if (e.target.value) loadWeeklyReports(e.target.value)
            }}
          />
        </div>
          <button
            onClick={() => { setStatusFilter([]); setDepartmentFilter([]); setPmFilter([]); setExpertiseFilter([]); setWeekFilter('') }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Filters
          </button>
          <button
            onClick={generateAIInsights}
            disabled={loadingInsights}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loadingInsights ? 'Generating...' : '🤖 AI Insights'}
          </button>
      </div>

      {showInsights && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-purple-800">AI Project Insights</h3>
            <button
              onClick={() => setShowInsights(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-purple-700 whitespace-pre-wrap">
            {aiInsights}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
              {weekFilter && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weekly Report</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProjects.map(project => {
              const getRowClass = (status: string) => {
                switch (status) {
                  case 'Green': return 'hover:bg-green-50 border-l-4 border-l-green-400'
                  case 'Yellow': return 'hover:bg-yellow-50 border-l-4 border-l-yellow-400'
                  case 'Red': return 'hover:bg-red-50 border-l-4 border-l-red-400'
                  case 'Complete': return 'hover:bg-blue-50 border-l-4 border-l-blue-400'
                  case 'Business Hold': return 'hover:bg-gray-50 border-l-4 border-l-gray-400'
                  case 'New Request': return 'hover:bg-purple-50 border-l-4 border-l-purple-400'
                  default: return 'hover:bg-gray-50'
                }
              }
              
              return (
              <tr key={project.id} className={getRowClass(project.status)}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <a 
                      href={`/admin/projects/${project.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 truncate"
                    >
                      {project.name}
                    </a>
                    {project.description && (
                      <div className="relative group">
                        <span className="text-gray-400 cursor-help">?</span>
                        <div className="absolute left-0 top-6 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          <h4 className="font-semibold text-gray-900 mb-2">Project Description</h4>
                          <p className="text-sm text-gray-700">{project.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{project.department.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="border rounded p-1 max-h-20 overflow-y-auto text-xs">
                    {expertises.map(exp => (
                      <label key={exp.id} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          checked={project.expertises?.some(pe => pe.expertise.id === exp.id) || false}
                          onChange={async (e) => {
                            const currentIds = project.expertises?.map(pe => pe.expertise.id) || []
                            const newIds = e.target.checked 
                              ? [...currentIds, exp.id]
                              : currentIds.filter(id => id !== exp.id)
                            
                            try {
                              await fetch(`/api/projects/${project.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ expertiseIds: newIds })
                              })
                              // Update local state immediately
                              setProjects(prev => prev.map(p => 
                                p.id === project.id 
                                  ? { ...p, expertises: newIds.map(id => ({ expertise: expertises.find(exp => exp.id === id)! })) }
                                  : p
                              ))
                            } catch (error) {
                              console.error('Error updating expertise:', error)
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-xs">{exp.name}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <select
                    className="text-sm border rounded px-3 py-2 w-full bg-white"
                    value={project.projectManager?.id || ''}
                    onChange={async (e) => {
                      const pmId = e.target.value ? parseInt(e.target.value) : null
                      try {
                        await fetch(`/api/projects/${project.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ projectManagerId: pmId })
                        })
                        const selectedPM = pmId ? projectManagers.find(pm => pm.id === pmId) : null
                        setProjects(prev => prev.map(p => 
                          p.id === project.id 
                            ? { ...p, projectManager: selectedPM }
                            : p
                        ))
                      } catch (error) {
                        console.error('Error updating project manager:', error)
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {projectManagers.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Not set'}
                </td>
                {weekFilter && (
                  <td className="px-6 py-4 text-sm">
                    {getWeeklyReportForProject(project.id) ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={`/weekly-reports/${project.id}`}
                          className="text-green-600 hover:text-green-800 underline"
                        >
                          View Report
                        </a>
                        <div className="relative group">
                          <span className="text-gray-500 hover:text-gray-700 cursor-pointer">🔍</span>
                          <div className="absolute right-0 top-8 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            {(() => {
                              const report = getWeeklyReportForProject(project.id)
                              return (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Week Report</h4>
                                  <div>
                                    <h5 className="text-sm font-medium text-green-700">Accomplishments</h5>
                                    <p className="text-xs text-gray-600">{report?.accomplishments || 'None'}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-medium text-red-700">Challenges</h5>
                                    <p className="text-xs text-gray-600">{report?.challenges || 'None'}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-medium text-blue-700">Goals</h5>
                                    <p className="text-xs text-gray-600">{report?.goals || 'None'}</p>
                                  </div>
                                </div>
                              )
                            })()} 
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a 
                        href={`/weekly-reports/${project.id}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Create Report
                      </a>
                    )}
                  </td>
                )}
              </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No projects match the current filters.
          </div>
        )}
      </div>
    </div>
  )
}