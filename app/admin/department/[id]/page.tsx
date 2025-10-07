import { prisma } from '@/lib/prisma'

export default async function DepartmentDetail({ params }: { params: { id: string } }) {
  const department = await prisma.department.findUnique({
    where: { id: parseInt(params.id) },
    include: { projects: true }
  })

  if (!department) {
    return <div>Department not found</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{department.name} Department</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Department Info</h2>
          <p><strong>Name:</strong> {department.name}</p>
          <p><strong>Sort Order:</strong> {department.sortOrder}</p>
          <p><strong>Total Projects:</strong> {department.projects.length}</p>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4">Projects</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {department.projects.map(project => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`/admin/project/${project.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}