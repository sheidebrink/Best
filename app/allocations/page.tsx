'use client'

import React, { useState, useEffect } from 'react'

interface User {
  id: number
  name: string
  expertise: { name: string }
}

interface Project {
  id: number
  name: string
  startDate: string | null
  targetDate: string | null
  actualCompletionDate: string | null
  projectManager: { name: string } | null
  department: { id: number; name: string; sortOrder: number }
  estimate?: { totalHours: number }
}

interface Department {
  id: number
  name: string
  sortOrder: number
  projects: Project[]
}

interface Expertise {
  id: number
  name: string
  users: User[]
}

interface AllocationMonth {
  id: number
  name: string
  month: string
}

interface Holiday {
  id: number
  name: string
  date: string
}

interface Allocation {
  id: number
  userId: number
  projectId: number
  percentage: number
}

export default function Allocations() {
  const [allocationMonths, setAllocationMonths] = useState<AllocationMonth[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedMonthId, setSelectedMonthId] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedExpertises, setExpandedExpertises] = useState<Set<number>>(new Set())
  const [projectEstimates, setProjectEstimates] = useState<Map<number, number>>(new Map())
  const [aiInsights, setAiInsights] = useState<string>('')
  const [showInsights, setShowInsights] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [showStandUp, setShowStandUp] = useState(false)
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0)
  const [standUpResponses, setStandUpResponses] = useState<Record<number, {status: string, roadblocks: string}>>({})

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedMonthId > 0) {
      loadAllocations()
    }
  }, [selectedMonthId])

  const loadInitialData = async () => {
    try {
      const [monthsRes, deptsRes, expertisesRes, holidaysRes] = await Promise.all([
        fetch('/api/allocation-months'),
        fetch('/api/departments'),
        fetch('/api/expertises'),
        fetch('/api/holidays')
      ])
      
      const months = await monthsRes.json()
      const depts = await deptsRes.json()
      const exps = await expertisesRes.json()
      const hols = await holidaysRes.json()

      setAllocationMonths(months)
      setDepartments(depts)
      setExpertises(exps)
      setHolidays(hols)
      setExpandedExpertises(new Set(exps.map((exp: any) => exp.id)))
      
      // Load estimates for all projects that have them (async)
      loadEstimates(depts)

      if (months.length > 0) {
        const currentDate = new Date()
        const currentMonth = months.find(month => {
          const monthDate = new Date(month.name + ' 1')
          return monthDate.getMonth() === currentDate.getMonth() && monthDate.getFullYear() === currentDate.getFullYear()
        })
        setSelectedMonthId(currentMonth?.id || months[0].id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadEstimates = async (depts: Department[]) => {
    const estimatesMap = new Map<number, number>()
    for (const dept of depts) {
      for (const project of dept.projects) {
        if (project.estimate) {
          try {
            const estimateRes = await fetch(`/api/estimates/${project.id}`)
            if (estimateRes.ok) {
              const estimate = await estimateRes.json()
              const totalHours = estimate.userStories.reduce((total: number, story: any) => 
                total + story.estimateItems.reduce((storyTotal: number, item: any) => storyTotal + item.hours, 0), 0
              )
              estimatesMap.set(project.id, totalHours)
            }
          } catch (error) {
            console.error(`Error loading estimate for project ${project.id}:`, error)
          }
        }
      }
    }
    setProjectEstimates(estimatesMap)
  }

  const generateAIInsights = async () => {
    setLoadingInsights(true)
    try {
      const allocationData = {
        month: allocationMonths.find(m => m.id === selectedMonthId)?.name,
        availableHours: calculateAvailableHours(),
        expertises: expertises.map(exp => ({
          name: exp.name,
          users: exp.users.map(user => ({
            name: user.name,
            totalAllocation: getUserTotal(user.id),
            allocatedHours: (getUserTotal(user.id) * calculateAvailableHours()) / 100
          }))
        })),
        projects: departments.flatMap(dept => 
          getFilteredProjects(dept.projects).map(project => ({
            name: project.name,
            department: dept.name,
            allocatedHours: getProjectTotalHours(project.id),
            estimatedHours: projectEstimates.get(project.id) || 0,
            targetDate: project.targetDate,
            projectManager: project.projectManager?.name
          }))
        )
      }

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocationData)
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

  const getFilteredProjects = (projects: Project[]): Project[] => {
    if (selectedMonthId === 0) return projects
    
    const selectedMonth = allocationMonths.find(m => m.id === selectedMonthId)
    if (!selectedMonth) return projects
    
    const selectedDate = new Date(selectedMonth.month)
    
    return projects.filter(project => {
      // Must not have actual completion date
      if (project.actualCompletionDate) return false
      
      // Case 1: Has target date - target date must be in or after selected month
      if (project.targetDate) {
        const targetDate = new Date(project.targetDate)
        return targetDate >= selectedDate
      }
      
      // Case 2: No target date - must have start date before or during selected month
      if (project.startDate) {
        const startDate = new Date(project.startDate)
        return startDate <= selectedDate
      }
      
      return false
    })
  }

  const loadAllocations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/allocations?monthId=${selectedMonthId}`)
      const data = await res.json()
      setAllocations(data)
    } catch (error) {
      console.error('Error loading allocations:', error)
    }
    setIsLoading(false)
  }

  const toggleExpertise = (expertiseId: number) => {
    const newExpanded = new Set(expandedExpertises)
    if (newExpanded.has(expertiseId)) {
      newExpanded.delete(expertiseId)
    } else {
      newExpanded.add(expertiseId)
    }
    setExpandedExpertises(newExpanded)
  }

  const getAllocationValue = (userId: number, projectId: number): number => {
    const allocation = allocations.find(a => a.userId === userId && a.projectId === projectId)
    return allocation?.percentage || 0
  }

  const getUserTotal = (userId: number): number => {
    return allocations.filter(a => a.userId === userId).reduce((sum, a) => sum + a.percentage, 0)
  }

  const getTotalClass = (total: number): string => {
    if (total > 100) return 'total-over'
    if (total === 100) return 'total-exact'
    return 'total-under'
  }

  const updateAllocation = async (userId: number, projectId: number, percentage: number) => {
    try {
      await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectId,
          allocationMonthId: selectedMonthId,
          percentage
        })
      })
      
      const existingIndex = allocations.findIndex(a => a.userId === userId && a.projectId === projectId)
      if (existingIndex >= 0) {
        if (percentage === 0) {
          setAllocations(prev => prev.filter((_, i) => i !== existingIndex))
        } else {
          setAllocations(prev => prev.map((a, i) => 
            i === existingIndex ? { ...a, percentage } : a
          ))
        }
      } else if (percentage > 0) {
        setAllocations(prev => [...prev, {
          id: Date.now(),
          userId,
          projectId,
          percentage
        }])
      }
    } catch (error) {
      console.error('Error updating allocation:', error)
    }
  }

  const calculateAvailableHours = (): number => {
    const selectedMonth = allocationMonths.find(m => m.id === selectedMonthId)
    if (!selectedMonth) return 0
    
    const monthDate = new Date(selectedMonth.month)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    
    let workDays = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
        workDays++
      }
    }
    
    const monthHolidays = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date)
      return holidayDate.getFullYear() === year && holidayDate.getMonth() === month
    })
    
    return (workDays - monthHolidays.length) * 8
  }

  const getProjectTotalHours = (projectId: number): number => {
    const projectAllocations = allocations.filter(a => a.projectId === projectId)
    const totalPercentage = projectAllocations.reduce((sum, a) => sum + a.percentage, 0)
    return (totalPercentage * calculateAvailableHours()) / 100
  }

  const totalProjectCount = departments.reduce((sum, dept) => {
    const filteredCount = getFilteredProjects(dept.projects).length
    return sum + (filteredCount > 0 ? filteredCount : 1)
  }, 0)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Resource Allocations</h1>

      <div className="mb-6 flex items-center gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Month:</label>
          <select 
            className="border rounded px-3 py-2"
            value={selectedMonthId}
            onChange={(e) => setSelectedMonthId(Number(e.target.value))}
          >
            {allocationMonths.map(month => (
              <option key={month.id} value={month.id}>{month.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-blue-100 px-4 py-2 rounded">
          <span className="text-sm font-medium text-blue-800">
            Available Hours Per Resource: {calculateAvailableHours()}
          </span>
        </div>
        <div className="bg-indigo-100 px-4 py-2 rounded">
          <span className="text-sm font-medium text-indigo-800">
            Available Hours Per Team: {(calculateAvailableHours() * expertises.reduce((total, exp) => total + exp.users.length, 0)).toFixed(1)}
          </span>
        </div>
        {projectEstimates.size > 0 && (
          <div className="bg-green-100 px-4 py-2 rounded">
            <span className="text-sm font-medium text-green-800">
              Projects with Estimates: {Array.from(projectEstimates.values()).reduce((sum, hours) => sum + hours, 0).toFixed(1)} total hours
            </span>
          </div>
        )}
        <button
          onClick={generateAIInsights}
          disabled={loadingInsights}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loadingInsights ? 'Generating...' : '🤖 AI Insights'}
        </button>
        <button
          onClick={() => {
            setShowStandUp(true)
            setCurrentResourceIndex(0)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📋 Conduct Stand-Up
        </button>
      </div>

      {showInsights && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-purple-800">AI Allocation Insights</h3>
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

      {showStandUp && (() => {
        const allUsers = expertises.flatMap(exp => exp.users)
        const currentUser = allUsers[currentResourceIndex]
        
        if (!currentUser) return null
        
        const userAllocations = allocations.filter(a => a.userId === currentUser.id)
        const userProjects = departments.flatMap(dept => 
          getFilteredProjects(dept.projects).filter(project => 
            userAllocations.some(a => a.projectId === project.id)
          )
        )
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-blue-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl animate-bounce">👋</div>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-800">Stand-Up Time!</h2>
                    <p className="text-lg text-purple-700 font-semibold">{currentUser.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">📊</div>
                  <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                    {currentResourceIndex + 1} of {allUsers.length}
                  </div>
                </div>
              </div>
              
              <div className="mb-6 bg-white rounded-lg p-4 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-800">Your Current Projects ({getUserTotal(currentUser.id)}%):</h3>
                </div>
                <div className="grid gap-3">
                  {userProjects.map(project => {
                    const allocation = getAllocationValue(currentUser.id, project.id)
                    return (
                      <div key={project.id} className="flex justify-between items-center bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg border-l-4 border-blue-400 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">🚀</div>
                          <span className="font-medium">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg">⚡</div>
                          <span className="font-bold text-blue-700">{allocation}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-2xl animate-spin">✨</div>
                    <label className="text-lg font-semibold text-green-700">Status Update:</label>
                  </div>
                  <textarea
                    className="w-full border-2 border-green-200 rounded-lg px-4 py-3 h-24 focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all"
                    value={standUpResponses[currentUser.id]?.status || ''}
                    onChange={(e) => setStandUpResponses(prev => ({
                      ...prev,
                      [currentUser.id]: {
                        ...prev[currentUser.id],
                        status: e.target.value
                      }
                    }))}
                    placeholder="🎉 What did you accomplish? What are you working on today?"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-2xl animate-pulse">🚧</div>
                    <label className="text-lg font-semibold text-red-700">Roadblocks/Issues:</label>
                  </div>
                  <textarea
                    className="w-full border-2 border-red-200 rounded-lg px-4 py-3 h-24 focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all"
                    value={standUpResponses[currentUser.id]?.roadblocks || ''}
                    onChange={(e) => setStandUpResponses(prev => ({
                      ...prev,
                      [currentUser.id]: {
                        ...prev[currentUser.id],
                        roadblocks: e.target.value
                      }
                    }))}
                    placeholder="🤔 Any blockers or challenges we can help with?"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setShowStandUp(false)}
                  className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <span>❌</span> Cancel
                </button>
                <div className="flex gap-3">
                  {currentResourceIndex > 0 && (
                    <button
                      onClick={() => setCurrentResourceIndex(prev => prev - 1)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors transform hover:scale-105"
                    >
                      <span>⬅️</span> Previous
                    </button>
                  )}
                  {currentResourceIndex < allUsers.length - 1 ? (
                    <button
                      onClick={() => setCurrentResourceIndex(prev => prev + 1)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
                    >
                      Next <span>➡️</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('Stand-up responses:', standUpResponses)
                        setShowStandUp(false)
                        setStandUpResponses({})
                        setCurrentResourceIndex(0)
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors transform hover:scale-105 animate-pulse"
                    >
                      <span>🎉</span> Complete Stand-Up
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="allocation-matrix bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="border border-gray-300 p-2 w-48">Resource</th>
                {departments.map(dept => {
                  const filteredProjects = getFilteredProjects(dept.projects)
                  return (
                    <th 
                      key={dept.id}
                      colSpan={filteredProjects.length > 0 ? filteredProjects.length : 1}
                      className="border border-gray-300 p-2 text-center dept-header cursor-pointer bg-gray-100"
                      onClick={() => window.open(`/admin/department/${dept.id}`, '_blank')}
                    >
                      {dept.name}
                    </th>
                  )
                })}
              </tr>
              <tr>
                <th className="border border-gray-300 p-2"></th>
                {departments.map(dept => {
                  const filteredProjects = getFilteredProjects(dept.projects)
                  return filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                      <th 
                        key={project.id}
                        className="border border-gray-300 p-2 text-center project-header cursor-pointer text-xs"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', minWidth: '80px', maxWidth: '80px' }}
                        onClick={() => window.open(`/admin/project/${project.id}`, '_blank')}
                        title={`Start: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} | Target: ${project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Not set'}`}
                      >
                        <div>{project.name}</div>
                        {project.projectManager && (
                          <div className="text-xs text-gray-600 mt-1">PM: {project.projectManager.name}</div>
                        )}
                        <div className="text-xs mt-1">
                          <a 
                            href={`/weekly-reports/${project.id}`}
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Reports
                          </a>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th key={`${dept.id}-no-projects`} className="border border-gray-300 p-2 text-center text-xs text-gray-500">
                      No Projects
                    </th>
                  )
                })}
              </tr>
              <tr>
                <th className="border border-gray-300 p-2 text-right text-xs bg-blue-50">Total Hours Allocated</th>
                {departments.map(dept => {
                  const filteredProjects = getFilteredProjects(dept.projects)
                  return filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                      <th key={`${project.id}-hours`} className="border border-gray-300 p-1 text-center text-xs bg-blue-50">
                        <div className="text-blue-600 font-medium">
                          {getProjectTotalHours(project.id).toFixed(1)}h
                        </div>
                      </th>
                    ))
                  ) : (
                    <th key={`${dept.id}-no-hours`} className="border border-gray-300 p-1 text-center text-xs bg-blue-50">
                      -
                    </th>
                  )
                })}
              </tr>
              <tr>
                <th className="border border-gray-300 p-2 text-right text-xs bg-green-50">Estimated Hours</th>
                {departments.map(dept => {
                  const filteredProjects = getFilteredProjects(dept.projects)
                  return filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                      <th key={`${project.id}-estimate`} className="border border-gray-300 p-1 text-center text-xs bg-green-50">
                        {projectEstimates.has(project.id) ? (
                          <div className="text-green-600 font-medium">
                            {projectEstimates.get(project.id)?.toFixed(1)}h
                            <a 
                              href={`/estimates/${project.id}`}
                              className="ml-1 text-green-700 hover:text-green-900 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </th>
                    ))
                  ) : (
                    <th key={`${dept.id}-no-estimate`} className="border border-gray-300 p-1 text-center text-xs bg-green-50">
                      -
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {expertises.map(expertise => (
                <React.Fragment key={expertise.id}>
                  <tr>
                    <td 
                      colSpan={totalProjectCount + 1}
                      className="border border-gray-300 p-2 expertise-header cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleExpertise(expertise.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{expandedExpertises.has(expertise.id) ? '▼' : '▶'}</span>
                        <span>{expertise.name}</span>
                      </div>
                    </td>
                  </tr>
                  {expandedExpertises.has(expertise.id) && expertise.users.map(user => (
                    <tr key={user.id}>
                      <td 
                        className="border border-gray-300 p-2 user-name cursor-pointer"
                        onClick={() => window.open(`/admin/person/${user.id}`, '_blank')}
                      >
                        {user.name}
                        <span className={`ml-2 ${getTotalClass(getUserTotal(user.id))} relative group`}>
                          ({getUserTotal(user.id)}%)
                          <div className="absolute left-0 top-8 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            {(getUserTotal(user.id) * calculateAvailableHours() / 100).toFixed(1)} hours
                          </div>
                        </span>
                      </td>
                      {departments.map(dept => {
                        const filteredProjects = getFilteredProjects(dept.projects)
                        return filteredProjects.length > 0 ? (
                          filteredProjects.map(project => (
                            <td key={project.id} className="border border-gray-300 p-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  className="allocation-input flex-1"
                                  value={getAllocationValue(user.id, project.id) || ''}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    updateAllocation(user.id, project.id, value)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                                {getAllocationValue(user.id, project.id) > 0 && (
                                  <div className="relative group">
                                    <span className="text-xs text-gray-400 cursor-help">ℹ</span>
                                    <div className="absolute left-0 top-8 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                      {(getAllocationValue(user.id, project.id) * calculateAvailableHours() / 100).toFixed(1)} hours
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          ))
                        ) : (
                          <td key={`${dept.id}-no-projects`} className="border border-gray-300 p-1 text-center text-gray-400">
                            -
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}