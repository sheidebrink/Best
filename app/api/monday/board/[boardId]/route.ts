import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { boardId: string } }) {
  const boardId = params.boardId
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1') || 1
  const limit = parseInt(searchParams.get('limit') || '10') || 10
  
  try {
    const boardQuery = `
      query {
        boards (ids: [${boardId}]) {
          id
          name
          description
          state
        }
      }
    `
    
    const itemsQuery = `
      query {
        items (limit: ${limit}, page: ${page}, ids: [${boardId}]) {
          id
          name
          state
        }
      }
    `

    const [boardResponse, itemsResponse] = await Promise.all([
      fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.MONDAY_API_TOKEN || ''
        },
        body: JSON.stringify({ query: boardQuery })
      }),
      fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.MONDAY_API_TOKEN || ''
        },
        body: JSON.stringify({ query: itemsQuery })
      })
    ])

    if (!boardResponse.ok || !itemsResponse.ok) {
      throw new Error('Monday.com API request failed')
    }

    const boardData = await boardResponse.json()
    const itemsData = await itemsResponse.json()
    
    if (boardData.errors || itemsData.errors) {
      throw new Error((boardData.errors || itemsData.errors)[0].message)
    }

    const board = boardData.data.boards[0]
    const items = itemsData.data.items || []
    
    return NextResponse.json({
      ...board,
      items,
      pagination: {
        page,
        limit,
        hasMore: items.length === limit
      }
    })


  } catch (error: any) {
    console.error('Monday.com API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Monday.com board' },
      { status: 500 }
    )
  }
}