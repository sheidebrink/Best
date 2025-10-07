'use client'

import { useState, useEffect } from 'react'

interface Expertise {
  id: number
  name: string
  sortOrder: number
}

export default function ExpertisePage() {
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [loading, setLoading] = useState(true)
  const [newExpertise, setNewExpertise] = useState({ name: '', sortOrder: 0 })

  useEffect(() => {
    fetchExpertises()
  }, [])

  const fetchExpertises = async () => {
    try {
      const response = await fetch('/api/expertises')
      const data = await response.json()
      setExpertises(data)
    } catch (error) {
      console.error('Error fetching expertises:', error)
    } finally {
      setLoading(false)
    }
  }

  const addExpertise = async () => {
    if (!newExpertise.name) return
    
    try {
      const response = await fetch('/api/expertises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpertise)
      })
      
      if (response.ok) {
        const expertise = await response.json()
        setExpertises([...expertises, expertise])
        setNewExpertise({ name: '', sortOrder: 0 })
      }
    } catch (error) {
      console.error('Error adding expertise:', error)
    }
  }

  const updateExpertise = async (id: number, field: string, value: string | number) => {
    try {
      const response = await fetch(`/api/expertises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      
      if (response.ok) {
        setExpertises(expertises.map(exp => 
          exp.id === id ? { ...exp, [field]: value } : exp
        ))
      }
    } catch (error) {
      console.error('Error updating expertise:', error)
    }
  }

  const deleteExpertise = async (id: number) => {
    try {
      const response = await fetch(`/api/expertises/${id}`, { method: 'DELETE' })
      
      if (response.ok) {
        setExpertises(expertises.filter(exp => exp.id !== id))
      }
    } catch (error) {
      console.error('Error deleting expertise:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Expertise Areas</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add Expertise</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Expertise name"
            value={newExpertise.name}
            onChange={(e) => setNewExpertise({ ...newExpertise, name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <input
            type="number"
            placeholder="Sort order"
            value={newExpertise.sortOrder}
            onChange={(e) => setNewExpertise({ ...newExpertise, sortOrder: parseInt(e.target.value) || 0 })}
            className="border border-gray-300 rounded px-3 py-2 w-32"
          />
          <button
            onClick={addExpertise}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expertises.map((expertise) => (
              <tr key={expertise.id}>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={expertise.name}
                    onChange={(e) => updateExpertise(expertise.id, 'name', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={expertise.sortOrder}
                    onChange={(e) => updateExpertise(expertise.id, 'sortOrder', parseInt(e.target.value) || 0)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                  />
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteExpertise(expertise.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}