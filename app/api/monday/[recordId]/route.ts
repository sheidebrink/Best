import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { recordId: string } }) {
  const recordId = params.recordId
  
  try {
    const query = `
      query {
        items (ids: [${recordId}]) {
          id
          name
          state
          column_values {
            id
            text
            value
          }
          board {
            id
            name
          }
        }
      }
    `

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_API_TOKEN || ''
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      throw new Error('Monday.com API request failed')
    }

    const data = await response.json()
    
    if (data.errors) {
      throw new Error(data.errors[0].message)
    }

    return NextResponse.json(data.data.items[0] || null)
  } catch (error: any) {
    console.error('Monday.com API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Monday.com record' },
      { status: 500 }
    )
  }
}