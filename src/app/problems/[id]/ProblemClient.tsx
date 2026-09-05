'use client'

import { useState, useEffect } from 'react'
import { generateSolutions, runCode, saveSession, updateProblem, saveScratchpad } from './actions'

export default function ProblemClient({ 
  problem, 
  initialSolutions,
  initialScratchpad
}: { 
  problem: any, 
  initialSolutions: any[],
  initialScratchpad: any
}) {
  const [solutions, setSolutions] = useState(initialSolutions)
  const [activeTab, setActiveTab] = useState('python')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0)
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [durationMin, setDurationMin] = useState(0)

  // Scratchpad state
  const [spLang, setSpLang] = useState(initialScratchpad?.language || 'python')
  const [spCode, setSpCode] = useState(initialScratchpad?.code || '')
  const [spOutput, setSpOutput] = useState(initialScratchpad?.last_run_output || '')
  const [isRunning, setIsRunning] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
    } else if (timeLeft === 0 && activePhase) {
      // Timer finished
      saveSession(problem.id, activePhase, durationMin)
      setActivePhase(null)
      alert(`Timer for ${activePhase} finished!`)
    }
    return () => clearInterval(interval)
  }, [timeLeft, activePhase, durationMin, problem.id])

  const startTimer = (phase: string, minutes: number) => {
    setActivePhase(phase)
    setDurationMin(minutes)
    setTimeLeft(minutes * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    const res = await generateSolutions(problem.id)
    if (res.error) {
      setError(res.error)
    } else {
      // Hard refresh page to get new solutions, or we could fetch them
      window.location.reload()
    }
    setIsGenerating(false)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setSpOutput('Running...')
    const res = await runCode(spLang, spCode)
    if (res.error) {
      setSpOutput('Error: ' + res.error)
    } else {
      setSpOutput(res.output || 'No output')
    }
    setIsRunning(false)
    await saveScratchpad(problem.id, spLang, spCode, res.output)
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateProblem(problem.id, { status: e.target.value })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                  problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                {problem.difficulty}
              </span>
              <span className="text-sm text-gray-500">{problem.topic}</span>
              <select 
                defaultValue={problem.status} 
                onChange={handleStatusChange}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : '✨ Generate Solutions'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">Description</h2>
          <div className="mt-2 text-gray-700 whitespace-pre-wrap">{problem.description}</div>
          {problem.source_url && (
            <a href={problem.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm block">
              Source Link
            </a>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Study Timer</h2>
        <div className="flex space-x-4 mb-4">
          <button onClick={() => startTimer('think', 3)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">3m Think</button>
          <button onClick={() => startTimer('pseudo', 5)} className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">5m Pseudo</button>
          <button onClick={() => startTimer('implement', 20)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">20m Implement</button>
          <button onClick={() => startTimer('implement', 30)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">30m Implement</button>
        </div>
        {activePhase && (
          <div className="text-2xl font-bold text-center py-4 bg-gray-50 rounded-lg border">
            {activePhase.toUpperCase()} - {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scratchpad */}
        <div className="bg-white shadow sm:rounded-lg p-6 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Scratchpad</h2>
            <div className="flex space-x-2">
              <select 
                value={spLang} 
                onChange={(e) => setSpLang(e.target.value)}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
              <button 
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {isRunning ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>
          <textarea
            value={spCode}
            onChange={(e) => setSpCode(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-t-md focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            placeholder="Write your code here..."
            spellCheck={false}
          />
          <div className="h-40 bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-auto rounded-b-md whitespace-pre-wrap">
            {spOutput || 'Output will appear here...'}
          </div>
        </div>

        {/* AI Solutions */}
        <div className="bg-white shadow sm:rounded-lg p-6 flex flex-col h-[600px]">
          <h2 className="text-lg font-medium text-gray-900 mb-4">AI Solutions</h2>
          
          {solutions && solutions.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex space-x-2 border-b mb-4">
                {['python', 'javascript', 'java', 'pseudo'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === lang ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto">
                {solutions.filter((s: any) => s.language === activeTab).map((s: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.explanation}</p>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono">
                      <code>{s.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-center">
              No solutions yet.<br/>Click the "Generate Solutions" button above.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
