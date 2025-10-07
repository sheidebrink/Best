'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const DISCIPLINES = ['Requirements', 'Design', 'UX', 'Development', 'Database', 'Unit Testing', 'QA', 'PM']

interface Project {
  id: number
  name: string
}

interface UserStory {
  id: number
  name: string
  groupId: number | null
  estimateItems: EstimateItem[]
}

interface EstimateItem {
  id: number
  discipline: string
  hours: number
}

interface UserStoryGroup {
  id: number
  name: string
  userStories: UserStory[]
}

interface Estimate {
  id: number
  blendedRate: number
  userStories: UserStory[]
  groups: UserStoryGroup[]
}

export default function EstimatePage() {
  const params = useParams()
  const projectId = parseInt(params.projectId as string)
  
  const [project, setProject] = useState<Project | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStoryName, setNewStoryName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectRes, estimateRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/estimates/${projectId}`)
      ])
      
      const projectData = await projectRes.json()
      setProject(projectData)
      
      if (estimateRes.ok) {
        const estimateData = await estimateRes.json()
        setEstimate(estimateData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createEstimate = async () => {
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, blendedRate: 100 })
      })
      
      if (response.ok) {
        const newEstimate = await response.json()
        setEstimate(newEstimate)
      }
    } catch (error) {
      console.error('Error creating estimate:', error)
    }
  }

  const updateBlendedRate = async (rate: number) => {
    if (!estimate) return
    
    try {
      await fetch(`/api/estimates/${estimate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blendedRate: rate })
      })
      
      setEstimate({ ...estimate, blendedRate: rate })
    } catch (error) {
      console.error('Error updating blended rate:', error)
    }
  }

  const addUserStory = async () => {
    if (!newStoryName || !estimate) return
    
    try {
      const response = await fetch('/api/user-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newStoryName, 
          estimateId: estimate.id 
        })
      })
      
      if (response.ok) {
        const newStory = await response.json()
        
        // Create default estimate items for all disciplines
        const defaultItems = await Promise.all(
          DISCIPLINES.map(discipline => 
            fetch('/api/estimate-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userStoryId: newStory.id, 
                discipline, 
                hours: 8 
              })
            }).then(res => res.json())
          )
        )
        
        const storyWithItems = {
          ...newStory,
          estimateItems: defaultItems
        }
        
        setEstimate({
          ...estimate,
          userStories: [...estimate.userStories, storyWithItems]
        })
        setNewStoryName('')
      }
    } catch (error) {
      console.error('Error adding user story:', error)
    }
  }

  const updateEstimateItem = async (userStoryId: number, discipline: string, hours: number) => {
    if (!estimate) return
    
    try {
      await fetch('/api/estimate-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStoryId, discipline, hours })
      })
      
      setEstimate({
        ...estimate,
        userStories: estimate.userStories.map(story => {
          if (story.id === userStoryId) {
            const existingItem = story.estimateItems.find(item => item.discipline === discipline)
            if (existingItem) {
              return {
                ...story,
                estimateItems: story.estimateItems.map(item => 
                  item.discipline === discipline ? { ...item, hours } : item
                )
              }
            } else {
              return {
                ...story,
                estimateItems: [...story.estimateItems, { id: Date.now(), discipline, hours }]
              }
            }
          }
          return story
        })
      })
    } catch (error) {
      console.error('Error updating estimate item:', error)
    }
  }

  const moveUserStory = async (storyId: number, direction: 'up' | 'down') => {
    if (!estimate) return
    
    const stories = [...estimate.userStories]
    const currentIndex = stories.findIndex(s => s.id === storyId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= stories.length) return
    
    // Swap stories
    const temp = stories[currentIndex]
    stories[currentIndex] = stories[newIndex]
    stories[newIndex] = temp
    
    // Update sort orders
    stories.forEach((story, index) => {
      story.sortOrder = index
    })
    
    try {
      await fetch('/api/user-stories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stories: stories.map(s => ({ id: s.id, sortOrder: s.sortOrder }))
        })
      })
      
      setEstimate({ ...estimate, userStories: stories })
    } catch (error) {
      console.error('Error reordering user stories:', error)
    }
  }

  const deleteUserStory = async (storyId: number, storyName: string) => {
    if (!confirm(`Are you sure you want to delete "${storyName}"?`)) return
    
    try {
      const response = await fetch(`/api/user-stories/${storyId}`, {
        method: 'DELETE'
      })
      
      if (response.ok && estimate) {
        setEstimate({
          ...estimate,
          userStories: estimate.userStories.filter(s => s.id !== storyId)
        })
      }
    } catch (error) {
      console.error('Error deleting user story:', error)
    }
  }

  const getTotalHours = (): number => {
    if (!estimate) return 0
    return estimate.userStories.reduce((total, story) => 
      total + story.estimateItems.reduce((storyTotal, item) => storyTotal + item.hours, 0), 0
    )
  }

  const getTotalCost = (): number => {
    return getTotalHours() * (estimate?.blendedRate || 0)
  }

  const getDisciplineTotal = (discipline: string): number => {
    if (!estimate) return 0
    return estimate.userStories.reduce((total, story) => {
      const item = story.estimateItems.find(i => i.discipline === discipline)
      return total + (item?.hours || 0)
    }, 0)
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!project) return <div className="p-6">Project not found</div>

  if (!estimate) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create Estimate for {project.name}</h1>
        <button
          onClick={createEstimate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Estimate
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Estimate: {project.name}</h1>
      
      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium">Blended Hourly Rate: $</label>
        <input
          type="number"
          value={estimate.blendedRate}
          onChange={(e) => updateBlendedRate(parseFloat(e.target.value) || 0)}
          className="border border-gray-300 rounded px-3 py-2 w-32"
          step="0.01"
        />
        <div className="ml-8 bg-blue-100 px-4 py-2 rounded">
          <span className="font-medium">Total: {getTotalHours().toFixed(1)} hours | ${getTotalCost().toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="User story name"
            value={newStoryName}
            onChange={(e) => setNewStoryName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addUserStory()}
          />
          <button
            onClick={addUserStory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add User Story
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 p-2 w-48">User Story</th>
              {DISCIPLINES.map(discipline => (
                <th key={discipline} className="border border-gray-300 p-2 text-center min-w-24">
                  {discipline}
                </th>
              ))}
              <th className="border border-gray-300 p-2 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.userStories.length === 0 ? (
              <tr>
                <td colSpan={DISCIPLINES.length + 2} className="border border-gray-300 p-4 text-center text-gray-500">
                  No user stories yet. Add some to get started.
                </td>
              </tr>
            ) : (
              estimate.userStories.map(story => (
                <tr key={story.id}>
                  <td className="border border-gray-300 p-2 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveUserStory(story.id, 'up')}
                          disabled={estimate.userStories.indexOf(story) === 0}
                          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveUserStory(story.id, 'down')}
                          disabled={estimate.userStories.indexOf(story) === estimate.userStories.length - 1}
                          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <span>{story.name}</span>
                      <button
                        onClick={() => deleteUserStory(story.id, story.name)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                        title="Delete user story"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                  {DISCIPLINES.map(discipline => {
                    const item = story.estimateItems.find(i => i.discipline === discipline)
                    return (
                      <td key={discipline} className="border border-gray-300 p-1 text-center">
                        <input
                          type="number"
                          value={item?.hours || ''}
                          onChange={(e) => updateEstimateItem(story.id, discipline, parseFloat(e.target.value) || 0)}
                          className="w-full text-center border-0 p-1"
                          step="0.5"
                          min="0"
                        />
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 p-2 text-center font-medium">
                    {story.estimateItems.reduce((sum, item) => sum + item.hours, 0).toFixed(1)}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 p-2">Total Hours</td>
              {DISCIPLINES.map(discipline => (
                <td key={discipline} className="border border-gray-300 p-2 text-center">
                  {getDisciplineTotal(discipline).toFixed(1)}
                </td>
              ))}
              <td className="border border-gray-300 p-2 text-center">
                {getTotalHours().toFixed(1)}
              </td>
            </tr>
            <tr className="bg-blue-100 font-bold">
              <td className="border border-gray-300 p-2">Total Cost</td>
              {DISCIPLINES.map(discipline => (
                <td key={discipline} className="border border-gray-300 p-2 text-center">
                  ${(getDisciplineTotal(discipline) * (estimate?.blendedRate || 0)).toLocaleString()}
                </td>
              ))}
              <td className="border border-gray-300 p-2 text-center">
                ${getTotalCost().toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}