'use server'

import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})
import { revalidatePath } from 'next/cache'

export async function generateSolutions(problemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: problem, error: probErr } = await supabase.from('problems').select('*').eq('id', problemId).single()
  if (probErr || !problem) return { error: 'Problem not found' }

  try {
    const { object } = await generateObject({
      model: openrouter('openai/gpt-4o-2024-08-06'), 
      schema: z.object({
        python: z.string(),
        python_explanation: z.string(),
        javascript: z.string(),
        javascript_explanation: z.string(),
        java: z.string(),
        java_explanation: z.string(),
        pseudo: z.string(),
        pseudo_explanation: z.string()
      }),
      prompt: `Given this DSA/System Design problem, generate solutions.
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Topic: ${problem.topic}
Description: ${problem.description}

Generate:
- Python solution with explanation
- JavaScript solution with explanation
- Java solution with explanation
- Pseudo code
- A short conceptual explanation of the approach`
    })

    await supabase.from('solutions').delete().eq('problem_id', problemId)

    const solutionsToInsert = [
      { problem_id: problemId, language: 'python', code: object.python, explanation: object.python_explanation },
      { problem_id: problemId, language: 'javascript', code: object.javascript, explanation: object.javascript_explanation },
      { problem_id: problemId, language: 'java', code: object.java, explanation: object.java_explanation },
      { problem_id: problemId, language: 'pseudo', code: object.pseudo, explanation: object.pseudo_explanation }
    ]

    const { error: insertErr } = await supabase.from('solutions').insert(solutionsToInsert)
    if (insertErr) return { error: insertErr.message }

    revalidatePath(`/problems/${problemId}`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function runCode(language: string, code: string) {
  const langMap: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    java: 'java'
  }
  
  const versionMap: Record<string, string> = {
    python: '3.10.0',
    javascript: '18.15.0',
    java: '15.0.2'
  }

  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langMap[language] || 'python',
        version: versionMap[language] || '*',
        files: [{ content: code }]
      })
    })

    const data = await res.json()
    if (data.compile?.stderr) {
      return { output: data.compile.stderr + '\n' + (data.run?.output || '') }
    }
    return { output: data.run?.output || data.run?.stderr || 'No output' }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function saveSession(problemId: string, phase: string, durationMin: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    problem_id: problemId,
    phase,
    duration_min: durationMin,
    ended_at: new Date().toISOString()
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateProblem(problemId: string, updates: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('problems').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', problemId)
  if (error) return { error: error.message }
  
  revalidatePath(`/problems/${problemId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function saveScratchpad(problemId: string, language: string, code: string, lastRunOutput: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('scratchpads').upsert({
    user_id: user.id,
    problem_id: problemId,
    language,
    code,
    last_run_output: lastRunOutput,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id, problem_id' })

  if (error) return { error: error.message }
  return { success: true }
}
