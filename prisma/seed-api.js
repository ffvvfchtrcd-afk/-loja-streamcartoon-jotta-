require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function seed() {
  const { data: admins } = await supabase.from('Admin').select('id').eq('username', 'fghjkl')
  if (!admins?.length) {
    await supabase.from('Admin').insert([
      { username: 'fghjkl', password: await hashPassword('fghjkl123'), role: 'admin' },
      { username: 'jotta', password: await hashPassword('jotta1@'), role: 'admin' },
    ])
    console.log('✓ Admin criado')
  }

  const { data: settings } = await supabase.from('Setting').select('id').eq('key', 'store_name')
  if (!settings?.length) {
    await supabase.from('Setting').insert([
      { key: 'store_name', value: 'StreamCartoon' },
      { key: 'mercadopago_token', value: '' },
    ])
    console.log('✓ Settings criadas')
  }

  const products = [
    { name: 'Netflix 1 Mês', description: 'Assinatura Netflix Premium 1 mês.', price: 19.90, category: '🎬 Netflix', image: '/netflix.svg' },
    { name: 'Netflix 3 Meses', description: 'Assinatura Netflix Premium 3 meses.', price: 49.90, category: '🎬 Netflix', image: '/netflix.svg' },
    { name: 'Disney+ 1 Mês', description: 'Assinatura Disney+ 1 mês.', price: 14.90, category: '📺 Disney+', image: '/disney.svg' },
    { name: 'Disney+ 3 Meses', description: 'Assinatura Disney+ 3 meses.', price: 39.90, category: '📺 Disney+', image: '/disney.svg' },
    { name: 'HBO Max 1 Mês', description: 'Assinatura HBO Max 1 mês.', price: 12.90, category: '🎥 HBO', image: '/hbomax.svg' },
    { name: 'Spotify Premium 1 Mês', description: 'Spotify Premium 1 mês.', price: 9.90, category: '🎵 Spotify', image: '/spotify.svg' },
    { name: 'Amazon Prime 1 Mês', description: 'Amazon Prime 1 mês.', price: 8.90, category: '📦 Amazon', image: '/prime.svg' },
  ]

  for (const p of products) {
    const { data: existing } = await supabase.from('Product').select('id').eq('name', p.name)
    if (!existing?.length) {
      await supabase.from('Product').insert(p)
      console.log(`✓ Produto: ${p.name}`)
    }
  }

  const codes = [
    { product: 'Netflix 1 Mês', values: ['NF1M-A1B2C3', 'NF1M-D4E5F6', 'NF1M-G7H8I9'] },
    { product: 'Disney+ 1 Mês', values: ['DP1M-J1K2L3', 'DP1M-M4N5O6', 'DP1M-P7Q8R9'] },
  ]

  for (const c of codes) {
    const { data: prod } = await supabase.from('Product').select('id').eq('name', c.product).single()
    if (prod) {
      for (const val of c.values) {
        const { data: exists } = await supabase.from('Code').select('id').eq('value', val)
        if (!exists?.length) {
          await supabase.from('Code').insert({ productId: prod.id, value: val })
          console.log(`✓ Código: ${val}`)
        }
      }
    }
  }

  console.log('\n=== Seed concluído! ===')
}

async function hashPassword(pwd) {
  const bcrypt = require('bcryptjs')
  return bcrypt.hash(pwd, 10)
}

seed().catch(console.error)
