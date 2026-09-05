'use server'

import { createClient } from '@/lib/supabase/server'
import { read, utils } from 'xlsx'
import { revalidatePath } from 'next/cache'

function extractProblemsFromSheet(sheetData: any[], sheetName: string, userId: string) {
  const problems = []
  
  for (const row of sheetData) {
    const getCol = (names: string[]) => {
      const key = Object.keys(row).find(k => names.includes(k.toLowerCase().trim()))
      return key ? row[key] : null
    }

    const title = getCol(['title', 'problem title', 'name'])
    if (!title) continue

    const description = getCol(['description', 'problem statement', 'statement']) || ''
    const difficultyRaw = getCol(['difficulty', 'level'])?.toString().toLowerCase()
    const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium'
    const topic = getCol(['topic', 'category']) || sheetName
    
    const tagsRaw = getCol(['tags', 'tag'])
    const tags = tagsRaw ? tagsRaw.toString().split(',').map((t: string) => t.trim()) : []
    
    const sourceUrl = getCol(['source', 'sourceurl', 'link', 'url']) || null
    
    const dueDateRaw = getCol(['duedate', 'due date', 'due'])
    let dueDate = null
    if (dueDateRaw) {
       if (typeof dueDateRaw === 'number') {
           const date = new Date(Math.round((dueDateRaw - 25569) * 86400 * 1000))
           dueDate = date.toISOString().split('T')[0]
       } else {
           const date = new Date(dueDateRaw)
           if (!isNaN(date.getTime())) {
               dueDate = date.toISOString().split('T')[0]
           }
       }
    }

    problems.push({
      user_id: userId,
      title: title.toString(),
      description: description.toString(),
      difficulty,
      topic: topic.toString(),
      tags,
      source_url: sourceUrl ? sourceUrl.toString() : null,
      due_date: dueDate
    })
  }
  
  return problems
}

export async function importExcel(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer, { type: 'buffer' })
    
    let problemsToInsert: any[] = []
    let foundSpecificSheets = false

    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('dsa') || sheetName.toLowerCase().includes('system design')) {
        foundSpecificSheets = true
        const sheet = workbook.Sheets[sheetName]
        const data = utils.sheet_to_json(sheet)
        problemsToInsert = [...problemsToInsert, ...extractProblemsFromSheet(data, sheetName, user.id)]
      }
    }

    if (!foundSpecificSheets && workbook.SheetNames.length > 0) {
       const sheetName = workbook.SheetNames[0]
       const sheet = workbook.Sheets[sheetName]
       const data = utils.sheet_to_json(sheet)
       problemsToInsert = extractProblemsFromSheet(data, sheetName, user.id)
    }

    if (problemsToInsert.length > 0) {
      const { error } = await supabase.from('problems').insert(problemsToInsert)
      if (error) {
        return { error: 'Failed to insert into database: ' + error.message }
      }
    }

    revalidatePath('/problems')
    revalidatePath('/dashboard')
    
    return { success: true, count: problemsToInsert.length }
  } catch (err: any) {
    return { error: err.message || 'Error processing file' }
  }
}
