const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=')
    env[key.trim()] = rest.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSuperAdmin() {
  const email = 'loanaavila.la@gmail.com'
  console.log(`Checking if superadmin ${email} exists...`)

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: email,
    email_confirm: true,
    user_metadata: { display_name: 'Loana Avila' }
  })

  let userId = null
  if (userError) {
    if (userError.message.includes('already exists') || userError.message.includes('already been registered')) {
      console.log('User already exists in auth.users, getting ID...')
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
      const user = usersData.users.find(u => u.email === email)
      if (user) userId = user.id
    } else {
      console.error('Error creating user:', userError)
      process.exit(1)
    }
  } else {
    userId = userData.user.id
    console.log(`Created auth.user with ID: ${userId}`)
  }

  if (userId) {
    // Ensure role SUPERADMIN exists and assign it
    const { data: roleData } = await supabase.from('roles').select('id').eq('code', 'SUPERADMIN').single()
    if (roleData) {
      // Upsert profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        display_name: 'Loana Avila',
        role_id: roleData.id,
        status: 'ACTIVO',
        activated_at: new Date().toISOString()
      })
      if (profileError) {
        console.error('Error updating profile:', profileError)
      } else {
        console.log('Profile successfully linked with SUPERADMIN role.')
      }
    } else {
      console.error('Role SUPERADMIN not found in DB.')
    }
  }
}

createSuperAdmin()
