'use client'

import './globals.css'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(false)

  return (
    <html lang="en">
      <head>
        <title>BEST - Business Excellence & Strategic Tracking</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <div className="min-h-screen bg-gray-50 flex">
          <div className={`bg-blue-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                {sidebarOpen ? (
                  <div className="flex items-center gap-2">
                    <svg width="30" height="30" viewBox="0 0 64 64" fill="none">
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:'#1e40af'}} />
                          <stop offset="100%" style={{stopColor:'#3b82f6'}} />
                        </linearGradient>
                      </defs>
                      <circle cx="32" cy="32" r="30" fill="url(#grad)"/>
                      <path d="M20 40 L32 20 L44 40 L38 40 L32 30 L26 40 Z" fill="white"/>
                      <rect x="28" y="42" width="8" height="4" fill="white"/>
                    </svg>
                    <span className="text-white font-bold text-lg">BEST</span>
                  </div>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                    <defs>
                      <linearGradient id="gradSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#1e40af'}} />
                        <stop offset="100%" style={{stopColor:'#3b82f6'}} />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="30" fill="url(#gradSmall)"/>
                    <path d="M20 40 L32 20 L44 40 L38 40 L32 30 L26 40 Z" fill="white"/>
                    <rect x="28" y="42" width="8" height="4" fill="white"/>
                  </svg>
                )}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-blue-700 p-1 rounded">
                  {sidebarOpen ? '←' : '→'}
                </button>
              </div>
            </div>
            <nav className="mt-4">
              <a href="/" className="block px-4 py-2 hover:bg-blue-700">
                {sidebarOpen ? 'Home' : '🏠'}
              </a>
              <a href="/allocations" className="block px-4 py-2 hover:bg-blue-700">
                {sidebarOpen ? 'Allocations' : '📊'}
              </a>
              <div>
                <button 
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="w-full text-left px-4 py-2 hover:bg-blue-700 flex items-center justify-between"
                >
                  <span>{sidebarOpen ? 'Admin' : '⚙️'}</span>
                  {sidebarOpen && (adminOpen ? '▼' : '▶')}
                </button>
                {adminOpen && sidebarOpen && (
                  <div className="bg-blue-900">
                    <a href="/admin/departments" className="block px-8 py-2 hover:bg-blue-700">Departments</a>
                    <a href="/admin/projects" className="block px-8 py-2 hover:bg-blue-700">Projects</a>
                    <a href="/admin/users" className="block px-8 py-2 hover:bg-blue-700">Users</a>
                    <a href="/admin/holidays" className="block px-8 py-2 hover:bg-blue-700">Holidays</a>
                    <a href="/admin/expertise" className="block px-8 py-2 hover:bg-blue-700">Expertise</a>
                  </div>
                )}
              </div>
            </nav>
          </div>
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}