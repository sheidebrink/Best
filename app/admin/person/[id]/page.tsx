import { prisma } from '@/lib/prisma'

export default async function PersonDetail({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      expertise: true,
      allocations: {
        include: {
          project: {
            include: { department: true }
          },
          allocationMonth: true
        },
        orderBy: [
          { allocationMonth: { month: 'asc' } },
          { project: { name: 'asc' } }
        ]
      }
    }
  })

  if (!user) {
    return <div>Person not found</div>
  }

  const monthlyTotals = user.allocations.reduce((acc, allocation) => {
    const monthId = allocation.allocationMonth.id
    if (!acc[monthId]) {
      acc[monthId] = {
        month: allocation.allocationMonth,
        total: 0
      }
    }
    acc[monthId].total += allocation.percentage
    return acc
  }, {} as Record<number, { month: any, total: number }>)

  const getStatusClass = (total: number) => {
    if (total > 100) return 'text-red-600 font-bold'
    if (total === 100) return 'text-green-600 font-bold'
    return 'text-orange-600 font-bold'
  }

  const getStatusText = (total: number) => {
    if (total > 100) return 'Over Allocated'
    if (total === 100) return 'Fully Allocated'
    return 'Under Allocated'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{user.name}</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Person Info</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Expertise:</strong> {user.expertise.name}</p>
          <p><strong>Total Allocations:</strong> {user.allocations.length}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Current Allocations</h3>
        {user.allocations.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {user.allocations.map(allocation => (
                  <tr key={allocation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.project.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.project.department.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.allocationMonth.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{allocation.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No allocations found for this person.</p>
        )}
      </div>

      {Object.keys(monthlyTotals).length > 0 && (
        <div>
          <h4 className="text-xl font-bold mb-4">Monthly Totals</h4>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.values(monthlyTotals).map(({ month, total }) => (
                  <tr key={month.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{month.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{total}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusClass(total)}>
                        {getStatusText(total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}