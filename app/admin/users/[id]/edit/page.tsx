'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  expertiseId: number | null
  expertise: { id: number; name: string } | null
}

interface Expertise {
  id: number
  name: string
}

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [userRes, expertisesRes] = await Promise.all([
        fetch(`/api/users/${params.id}`),
        fetch('/api/expertises')
      ])
      const userData = await userRes.json()
      const expertisesData = await expertisesRes.json()
      setUser(userData)
      setExpertises(expertisesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (field: string, value: string | number | null) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">User not found</div>

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-900"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Edit User</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => updateUser('name', e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => updateUser('email', e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Expertise</label>
            <select
              value={user.expertiseId || ''}
              onChange={(e) => updateUser('expertiseId', e.target.value ? parseInt(e.target.value) : null)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            >
              <option value="">No Expertise</option>
              {expertises.map((expertise) => (
                <option key={expertise.id} value={expertise.id}>
                  {expertise.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}