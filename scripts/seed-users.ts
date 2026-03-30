import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local before anything else
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '\n❌  Missing env vars. Make sure .env.local contains:\n' +
    '   NEXT_PUBLIC_SUPABASE_URL\n' +
    '   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY\n'
  )
  process.exit(1)
}

// Service-role client — bypasses RLS, never use client-side
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'SeedUser123!'

const PERSONAS = [
  { username: 'marisol',        email: 'marisol@peerpods.dev' },
  { username: 'theo_k',         email: 'theo@peerpods.dev'    },
  { username: 'quietobserver',  email: 'quiet@peerpods.dev'   },
  { username: 'nadia_r',        email: 'nadia@peerpods.dev'   },
  { username: 'dan',            email: 'dan@peerpods.dev'     },
  { username: 'elliot',         email: 'elliot@peerpods.dev'  },
  { username: 'priya',          email: 'priya@peerpods.dev'   },
]

async function seed() {
  console.log('\n🌱  Seeding users...\n')

  for (const { username, email } of PERSONAS) {
    // 1. Create auth user (email auto-confirmed so they can log in immediately)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      })

    if (authError) {
      // Supabase returns "already been registered" if the email exists
      if (authError.message.toLowerCase().includes('already')) {
        console.log(`⏭   ${username} — auth user already exists, skipping`)
        continue
      }
      console.error(`❌  ${username} — auth error: ${authError.message}`)
      continue
    }

    const userId = authData.user.id

    // 2. Insert profile row
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: userId, username })

    if (profileError) {
      if (profileError.code === '23505') {
        console.log(`⏭   ${username} — profile already exists`)
      } else {
        console.error(`❌  ${username} — profile error: ${profileError.message}`)
      }
      continue
    }

    console.log(`✅  ${username.padEnd(16)} ${email.padEnd(26)} ${userId}`)
  }

  console.log('\n✨  Done. All users are ready to log in with: ' + PASSWORD + '\n')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
