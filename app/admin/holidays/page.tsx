'use client'

import { useState, useEffect } from 'react'

interface Holiday {
  id: number
  name: string
  date: string
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' })

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/holidays')
      const data = await response.json()
      setHolidays(data)
    } catch (error) {
      console.error('Error fetching holidays:', error)
    } finally {
      setLoading(false)
    }
  }

  const addHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return
    
    try {
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHoliday)
      })
      
      if (response.ok) {
        const holiday = await response.json()
        setHolidays([...holidays, holiday])
        setNewHoliday({ name: '', date: '' })
      }
    } catch (error) {
      console.error('Error adding holiday:', error)
    }
  }

  const deleteHoliday = async (id: number) => {
    try {
      const response = await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
      
      if (response.ok) {
        setHolidays(holidays.filter(h => h.id !== id))
      }
    } catch (error) {
      console.error('Error deleting holiday:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Holidays</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add Holiday</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Holiday name"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={addHoliday}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <tr key={holiday.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{holiday.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(holiday.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => deleteHoliday(holiday.id)}
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