'use client'

import { useState, useEffect } from 'react'

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [expertises, setExpertises] = useState<Expertise[]>([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ name: '', email: '', expertiseId: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, expertisesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/expertises')
      ])
      const usersData = await usersRes.json()
      const expertisesData = await expertisesRes.json()
      setUsers(usersData)
      setExpertises(expertisesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserExpertise = async (userId: number, expertiseId: number | null) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertiseId })
      })
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, expertiseId, expertise: expertiseId ? expertises.find(e => e.id === expertiseId) || null : null }
            : user
        ))
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const addUser = async () => {
    if (!newUser.name || !newUser.email) return
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          expertiseId: newUser.expertiseId ? parseInt(newUser.expertiseId) : null
        })
      })
      
      if (response.ok) {
        const user = await response.json()
        setUsers([...users, user])
        setNewUser({ name: '', email: '', expertiseId: '' })
      }
    } catch (error) {
      console.error('Error adding user:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add New User</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <select
            value={newUser.expertiseId}
            onChange={(e) => setNewUser({ ...newUser, expertiseId: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">No Expertise</option>
            {expertises.map((expertise) => (
              <option key={expertise.id} value={expertise.id}>
                {expertise.name}
              </option>
            ))}
          </select>
          <button
            onClick={addUser}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <a href={`/admin/users/${user.id}/edit`} className="text-blue-600 hover:text-blue-900">
                    {user.name}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={user.expertiseId || ''}
                    onChange={(e) => updateUserExpertise(user.id, e.target.value ? parseInt(e.target.value) : null)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="">No Expertise</option>
                    {expertises.map((expertise) => (
                      <option key={expertise.id} value={expertise.id}>
                        {expertise.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}