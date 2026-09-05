import { createClient } from '@/lib/supabase/server'
import ProblemClient from './ProblemClient'
import { notFound } from 'next/navigation'

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: problem, error } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !problem) {
    notFound()
  }

  const { data: solutions } = await supabase
    .from('solutions')
    .select('*')
    .eq('problem_id', id)

  const { data: scratchpads } = await supabase
    .from('scratchpads')
    .select('*')
    .eq('problem_id', id)
    .limit(1)

  return (
    <ProblemClient 
      problem={problem} 
      initialSolutions={solutions || []} 
      initialScratchpad={scratchpads?.[0] || null} 
    />
  )
}
