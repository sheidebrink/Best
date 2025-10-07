'use client'

import { useState, useEffect } from 'react'

interface Project {
  id: number
  name: string
  department: { name: string }
  startDate: string | null
  targetDate: string | null
  actualCompletionDate: string | null
  projectManager: { name: string } | null
  estimate: { id: number } | null
}

interface Department {
  id: number
  name: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [newProject, setNewProject] = useState({ name: '', departmentId: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, deptsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/departments')
      ])
      const projectsData = await projectsRes.json()
      const deptsData = await deptsRes.json()
      setProjects(projectsData)
      setDepartments(deptsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProject = async () => {
    if (!newProject.name || !newProject.departmentId) return
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          departmentId: parseInt(newProject.departmentId)
        })
      })
      
      if (response.ok) {
        const project = await response.json()
        setProjects([...projects, project])
        setNewProject({ name: '', departmentId: '' })
      }
    } catch (error) {
      console.error('Error adding project:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add New Project</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Project name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <select
            value={newProject.departmentId}
            onChange={(e) => setNewProject({ ...newProject, departmentId: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <button
            onClick={addProject}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <a href={`/admin/projects/${project.id}`} className="text-blue-600 hover:text-blue-900">
                    {project.name}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{project.department.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {project.projectManager?.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <a 
                      href={`/admin/projects/${project.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </a>
                    {project.estimate ? (
                      <a 
                        href={`/estimates/${project.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        View Estimate
                      </a>
                    ) : (
                      <a 
                        href={`/estimates/${project.id}`}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Create Estimate
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}