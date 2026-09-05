'use client'

import { useState } from 'react'
import { importExcel } from './actions'

export default function ImportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; count?: number; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await importExcel(formData)
      setResult(res)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Import Problems</h1>
      
      <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Excel File</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload an Excel (.xlsx) file containing your problems. The file should have columns for Title, Description, Topic, Tags, Difficulty, Source URL, and Due Date.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">Excel File</label>
            <input 
              type="file" 
              name="file" 
              id="file" 
              accept=".xlsx,.xls" 
              required
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Upload and Import'}
          </button>
        </form>
      </div>

      {result && (
        <div className={`p-4 rounded-md ${result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {result.error ? (
            <p>Error: {result.error}</p>
          ) : (
            <p>Successfully imported {result.count} problems!</p>
          )}
        </div>
      )}
    </div>
  )
}
