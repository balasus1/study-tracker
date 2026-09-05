import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: problems } = await supabase.from('problems').select('*')
  
  return <DashboardClient user={user} problems={problems || []} />
}
