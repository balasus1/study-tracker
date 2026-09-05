'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

export default function DashboardClient({ user, problems }: { user: any, problems: any[] }) {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })

  const stats = useMemo(() => {
    const total = problems.length
    const completed = problems.filter(p => p.status === 'done').length

    const start = startOfDay(new Date(dateRange.start))
    const end = endOfDay(new Date(dateRange.end))

    const rangeCompleted = problems.filter(p => {
      if (p.status !== 'done' || !p.updated_at) return false
      const updatedDate = new Date(p.updated_at)
      return isWithinInterval(updatedDate, { start, end })
    })

    const chartDataMap: Record<string, number> = {}
    rangeCompleted.forEach(p => {
      const dateStr = format(new Date(p.updated_at), 'MMM dd')
      chartDataMap[dateStr] = (chartDataMap[dateStr] || 0) + 1
    })

    const chartData = Object.keys(chartDataMap).map(date => ({
      date,
      count: chartDataMap[date]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return { total, completed, rangeCompleted: rangeCompleted.length, chartData }
  }, [problems, dateRange])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Problems</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Completed (All Time)</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.completed}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </dd>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Completion Trend</h2>
          <div className="flex space-x-2 items-center">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm border-gray-300 rounded-md"
            />
            <span className="text-gray-500">to</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          <strong>{stats.rangeCompleted}</strong> problems completed in the selected date range.
        </p>

        {stats.chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 w-full flex items-center justify-center text-gray-500 border border-dashed rounded-md bg-gray-50">
            No problems completed in this range.
          </div>
        )}
      </div>
    </div>
  )
}
