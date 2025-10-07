'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface WeeklyReport {
  id: number
  projectId: number
  weekStarting: string
  accomplishments: string | null
  challenges: string | null
  goals: string | null
  createdAt: string
  updatedAt: string
}

interface Project {
  id: number
  name: string
}

export default function WeeklyReports() {
  const params = useParams()
  const projectId = parseInt(params.projectId as string)
  
  const [project, setProject] = useState<Project | null>(null)
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentReport, setCurrentReport] = useState<Partial<WeeklyReport>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const [projectRes, reportsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/weekly-reports?projectId=${projectId}`)
      ])
      
      const projectData = await projectRes.json()
      const reportsData = await reportsRes.json()
      
      setProject(projectData)
      setReports(reportsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setIsLoading(false)
  }

  const getWeekStarting = (date: Date): string => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  const handleNewReport = () => {
    const today = new Date()
    const weekStarting = getWeekStarting(today)
    
    setCurrentReport({
      projectId,
      weekStarting,
      accomplishments: '',
      challenges: '',
      goals: ''
    })
    setShowForm(true)
  }

  const handleEditReport = (report: WeeklyReport) => {
    setCurrentReport(report)
    setShowForm(true)
  }

  const handleSaveReport = async () => {
    try {
      await fetch('/api/weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentReport)
      })
      
      setShowForm(false)
      setCurrentReport({})
      loadData()
    } catch (error) {
      console.error('Error saving report:', error)
    }
  }

  const formatWeekRange = (weekStarting: string): string => {
    const start = new Date(weekStarting)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Weekly Reports - {project?.name}</h1>
        <button
          onClick={handleNewReport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Report
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Week of {formatWeekRange(currentReport.weekStarting || '')}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Accomplishments</label>
              <textarea
                className="w-full border rounded px-3 py-2 h-24"
                value={currentReport.accomplishments || ''}
                onChange={(e) => setCurrentReport({...currentReport, accomplishments: e.target.value})}
                placeholder="What was accomplished this week?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Challenges</label>
              <textarea
                className="w-full border rounded px-3 py-2 h-24"
                value={currentReport.challenges || ''}
                onChange={(e) => setCurrentReport({...currentReport, challenges: e.target.value})}
                placeholder="What challenges were encountered?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Goals for Next Week</label>
              <textarea
                className="w-full border rounded px-3 py-2 h-24"
                value={currentReport.goals || ''}
                onChange={(e) => setCurrentReport({...currentReport, goals: e.target.value})}
                placeholder="What are the goals for next week?"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveReport}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Week of {formatWeekRange(report.weekStarting)}
              </h3>
              <button
                onClick={() => handleEditReport(report)}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">Accomplishments</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {report.accomplishments || 'No accomplishments recorded'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-red-700 mb-2">Challenges</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {report.challenges || 'No challenges recorded'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Goals</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {report.goals || 'No goals recorded'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No weekly reports yet. Create your first report!
          </div>
        )}
      </div>
    </div>
  )
}