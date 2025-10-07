'use client'

import { useState, useEffect } from 'react'

interface Project {
  id: number
  name: string
  sortOrder: number
  startDate: string | null
  targetDate: string | null
  actualCompletionDate: string | null
  mondayBoardId: string | null
  projectManagerId: number | null
  projectManager: { name: string } | null
}

interface Department {
  id: number
  name: string
  sortOrder: number
  projects: Project[]
}

interface User {
  id: number
  name: string
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [projectManagers, setProjectManagers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [deptRes, pmRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/users?expertise=Project Management')
      ])
      const deptData = await deptRes.json()
      const pmData = await pmRes.json()
      setDepartments(deptData)
      setProjectManagers(pmData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (projectId: number, field: string, value: string | number | null) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      
      if (response.ok) {
        setDepartments(departments.map(dept => ({
          ...dept,
          projects: dept.projects.map(project => {
            if (project.id === projectId) {
              const updatedProject = { ...project, [field]: value }
              if (field === 'projectManagerId') {
                const pm = projectManagers.find(p => p.id === value)
                updatedProject.projectManager = pm ? { name: pm.name } : null
              }
              return updatedProject
            }
            return project
          })
        })))
      }
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Departments & Projects</h1>
      
      {departments.map(dept => (
        <div key={dept.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">{dept.name}</h2>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sort</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monday Board</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dept.projects.map(project => (
                  <tr key={project.id}>
                    <td className="px-4 py-2 text-sm font-medium">{project.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={project.sortOrder}
                        onChange={(e) => updateProject(project.id, 'sortOrder', parseInt(e.target.value) || 0)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateProject(project.id, 'startDate', e.target.value || null)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={project.targetDate ? new Date(project.targetDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateProject(project.id, 'targetDate', e.target.value || null)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={project.actualCompletionDate ? new Date(project.actualCompletionDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateProject(project.id, 'actualCompletionDate', e.target.value || null)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={project.mondayBoardId || ''}
                        onChange={(e) => updateProject(project.id, 'mondayBoardId', e.target.value || null)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                        placeholder="Board ID"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={project.projectManagerId || ''}
                        onChange={(e) => updateProject(project.id, 'projectManagerId', e.target.value ? parseInt(e.target.value) : null)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      >
                        <option value="">No PM</option>
                        {projectManagers.map(pm => (
                          <option key={pm.id} value={pm.id}>{pm.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}