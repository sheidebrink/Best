'use client'

import { useState, useEffect } from 'react'

interface Project {
  id: number
  name: string
  startDate: string | null
  targetDate: string | null
  actualCompletionDate: string | null
  mondayBoardId: string | null
  projectManagerId: number | null
  department: { name: string }
  expertises: { expertise: { id: number; name: string } }[]
  allocations: { user: { name: string }; allocationMonth: { name: string }; percentage: number }[]
}

interface Expertise {
  id: number
  name: string
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [projectManagers, setProjectManagers] = useState<{ id: number; name: string }[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    targetDate: '',
    actualCompletionDate: '',
    mondayBoardId: '',
    projectManagerId: null as number | null,
    expertiseIds: [] as number[]
  })

  useEffect(() => {
    loadProject()
    loadExpertises()
  }, [])

  const loadProject = async () => {
    const res = await fetch(`/api/projects/${params.id}`)
    const data = await res.json()
    setProject(data)
    setFormData({
      name: data.name,
      startDate: data.startDate ? data.startDate.split('T')[0] : '',
      targetDate: data.targetDate ? data.targetDate.split('T')[0] : '',
      actualCompletionDate: data.actualCompletionDate ? data.actualCompletionDate.split('T')[0] : '',
      mondayBoardId: data.mondayBoardId || '',
      projectManagerId: data.projectManagerId || null,
      expertiseIds: data.expertises?.map((pe: any) => pe.expertise.id) || []
    })
  }

  const loadExpertises = async () => {
    const res = await fetch('/api/expertises')
    const data = await res.json()
    setExpertises(data)
    
    const pmRes = await fetch('/api/users?expertise=Project Management')
    const pmData = await pmRes.json()
    setProjectManagers(pmData)
  }

  const handleSave = async () => {
    await fetch(`/api/projects/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    setIsEditing(false)
    loadProject()
  }

  const toggleExpertise = (expertiseId: number) => {
    setFormData(prev => ({
      ...prev,
      expertiseIds: prev.expertiseIds.includes(expertiseId)
        ? prev.expertiseIds.filter(id => id !== expertiseId)
        : [...prev.expertiseIds, expertiseId]
    }))
  }

  if (!project) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Project Info</h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date:</label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Date:</label>
                <input 
                  type="date" 
                  value={formData.targetDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Actual Completion Date:</label>
                <input 
                  type="date" 
                  value={formData.actualCompletionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualCompletionDate: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monday.com Board ID:</label>
                <input 
                  type="text" 
                  value={formData.mondayBoardId}
                  onChange={(e) => setFormData(prev => ({ ...prev, mondayBoardId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., 4074545697"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Project Manager:</label>
                <select 
                  value={formData.projectManagerId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectManagerId: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">No Project Manager</option>
                  {projectManagers.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expertises:</label>
                <div className="space-y-2">
                  {expertises.map(expertise => (
                    <label key={expertise.id} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.expertiseIds.includes(expertise.id)}
                        onChange={() => toggleExpertise(expertise.id)}
                        className="mr-2"
                      />
                      {expertise.name}
                    </label>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div>
              <p><strong>Name:</strong> {project.name}</p>
              <p><strong>Department:</strong> {project.department.name}</p>
              <p><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</p>
              <p><strong>Target Date:</strong> {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Not set'}</p>
              <p><strong>Actual Completion:</strong> {project.actualCompletionDate ? new Date(project.actualCompletionDate).toLocaleDateString() : 'Not completed'}</p>
              <p><strong>Monday.com Board:</strong> {project.mondayBoardId ? (
                <a 
                  href={`https://cottinghambutler-force.monday.com/boards/${project.mondayBoardId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open Board
                </a>
              ) : 'Not set'}</p>
              <p><strong>Expertises:</strong> {project.expertises?.map(pe => pe.expertise.name).join(', ') || 'None assigned'}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4">Current Allocations</h3>
        {project.allocations.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {project.allocations.map((allocation, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.allocationMonth.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No allocations found for this project.</p>
        )}
      </div>
    </div>
  )
}