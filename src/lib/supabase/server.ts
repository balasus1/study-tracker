import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const useAdmin = process.env.NEXT_PUBLIC_SKIP_LOGIN === 'true'
  const key = useAdmin ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  if (useAdmin) {
    client.auth.getUser = async () => {
      const { data: profile } = await client.from('profiles').select('*').limit(1).single()
      if (profile) {
        return { data: { user: { id: profile.id, email: profile.email } }, error: null } as any
      }
      
      const { data: newUser } = await client.auth.admin.createUser({
        email: 'dev@studytracker.local',
        password: 'password123',
        email_confirm: true,
        user_metadata: { display_name: 'Admin' }
      })
      if (newUser.user) {
         return { data: { user: { id: newUser.user.id, email: newUser.user.email } }, error: null } as any
      }
      return { data: { user: null }, error: null } as any
    }
  }

  return client
}
