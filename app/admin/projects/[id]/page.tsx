'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Project {
  id: number
  name: string
  description: string | null
  status: string
  departmentId: number
  startDate: string | null
  targetDate: string | null
  actualCompletionDate: string | null
  mondayBoardId: string | null
  projectManagerId: number | null
  estimate: { id: number } | null
  expertises: { expertise: { id: number; name: string } }[]
}

interface Department {
  id: number
  name: string
}

interface User {
  id: number
  name: string
}

interface Expertise {
  id: number
  name: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [projectManagers, setProjectManagers] = useState<User[]>([])
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectRes, deptsRes, pmRes, expRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch('/api/departments'),
        fetch('/api/users?expertise=Project Management'),
        fetch('/api/expertises')
      ])
      const projectData = await projectRes.json()
      const deptsData = await deptsRes.json()
      const pmData = await pmRes.json()
      const expData = await expRes.json()
      setProject(projectData)
      setDepartments(deptsData)
      setProjectManagers(pmData)
      setExpertises(expData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (field: string, value: any) => {
    if (!project) return
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      
      if (response.ok) {
        setProject({ ...project, [field]: value })
      }
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const createEstimate = async () => {
    if (!project) return
    
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, blendedRate: 100 })
      })
      
      if (response.ok) {
        const newEstimate = await response.json()
        setProject({ ...project, estimate: newEstimate })
        window.location.href = `/estimates/${project.id}`
      }
    } catch (error) {
      console.error('Error creating estimate:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!project) return <div className="p-6">Project not found</div>

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-900"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Edit Project</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Project Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => updateProject('name', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={project.description || ''}
                onChange={(e) => updateProject('description', e.target.value || null)}
                className="border border-gray-300 rounded px-3 py-2 w-full h-24"
                placeholder="Project description..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={project.status || 'Green'}
                onChange={(e) => updateProject('status', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              >
                <option value="Business Hold">Business Hold</option>
                <option value="Complete">Complete</option>
                <option value="Green">Green</option>
                <option value="New Request">New Request</option>
                <option value="Yellow">Yellow</option>
                <option value="Red">Red</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select
                value={project.departmentId}
                onChange={(e) => updateProject('departmentId', parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Project Manager</label>
              <select
                value={project.projectManagerId || ''}
                onChange={(e) => updateProject('projectManagerId', e.target.value ? parseInt(e.target.value) : null)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              >
                <option value="">No PM</option>
                {projectManagers.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Monday Board ID</label>
              <input
                type="text"
                value={project.mondayBoardId || ''}
                onChange={(e) => updateProject('mondayBoardId', e.target.value || null)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Expertises</label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
                {expertises.map((expertise) => (
                  <label key={expertise.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={project.expertises?.some(pe => pe.expertise.id === expertise.id) || false}
                      onChange={(e) => {
                        const currentIds = project.expertises?.map(pe => pe.expertise.id) || []
                        const newIds = e.target.checked 
                          ? [...currentIds, expertise.id]
                          : currentIds.filter(id => id !== expertise.id)
                        updateProject('expertiseIds', newIds)
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{expertise.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Dates</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => updateProject('startDate', e.target.value || null)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Target Date</label>
              <input
                type="date"
                value={project.targetDate ? new Date(project.targetDate).toISOString().split('T')[0] : ''}
                onChange={(e) => updateProject('targetDate', e.target.value || null)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Completion Date</label>
              <input
                type="date"
                value={project.actualCompletionDate ? new Date(project.actualCompletionDate).toISOString().split('T')[0] : ''}
                onChange={(e) => updateProject('actualCompletionDate', e.target.value || null)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-md font-semibold mb-4">Estimate</h3>
            {project.estimate ? (
              <a 
                href={`/estimates/${project.id}`}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                View Estimate
              </a>
            ) : (
              <button
                onClick={createEstimate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Estimate
              </button>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-md font-semibold mb-4">Weekly Reports</h3>
            <a 
              href={`/weekly-reports/${project.id}`}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 inline-block"
            >
              View Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}