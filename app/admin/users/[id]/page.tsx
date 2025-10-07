'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Allocation {
  id: number
  percentage: number
  project: { name: string; department: { name: string } }
  allocationMonth: { name: string }
}

interface User {
  id: number
  name: string
  email: string
  allocations: Allocation[]
}

export default function UserPage() {
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">User not found</div>

  const allocationsByMonth = user.allocations.reduce((acc, allocation) => {
    const month = allocation.allocationMonth.name
    if (!acc[month]) acc[month] = []
    acc[month].push(allocation)
    return acc
  }, {} as Record<string, Allocation[]>)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{user.name} - Allocations</h1>
      
      {Object.keys(allocationsByMonth).length === 0 ? (
        <p className="text-gray-500">No allocations found</p>
      ) : (
        Object.entries(allocationsByMonth).map(([month, allocations]) => (
          <div key={month} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">{month}</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allocations.map(allocation => (
                    <tr key={allocation.id}>
                      <td className="px-4 py-2 text-sm">{allocation.project.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{allocation.project.department.name}</td>
                      <td className="px-4 py-2 text-sm font-medium">{allocation.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-2 text-sm font-medium">Total</td>
                    <td className="px-4 py-2 text-sm font-bold">
                      {allocations.reduce((sum, a) => sum + a.percentage, 0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}