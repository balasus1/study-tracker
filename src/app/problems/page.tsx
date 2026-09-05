import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProblemsPage() {
  const supabase = await createClient()
  const { data: problems, error } = await supabase
    .from('problems')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading problems: {error.message}</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Problems</h1>
        <div className="mt-4 sm:mt-0">
          <Link href="/import" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Import Excel
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {problems?.map((problem) => (
            <li key={problem.id}>
              <Link href={`/problems/${problem.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{problem.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                          problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {problem.difficulty}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {problem.topic}
                      </p>
                      {problem.tags && problem.tags.length > 0 && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6 gap-2">
                           {problem.tags.map((t: string) => (
                             <span key={t} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{t}</span>
                           ))}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Status: <span className="font-medium text-gray-900">{problem.status.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {(!problems || problems.length === 0) && (
            <li className="px-4 py-8 text-center text-gray-500">
              No problems found. Start by importing from an Excel file!
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
