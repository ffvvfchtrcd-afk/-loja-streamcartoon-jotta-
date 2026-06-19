const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.admin.findUnique({ where: { username: 'fghjkl' } })
  if (!adminExists) {
    await prisma.admin.create({
      data: {
        username: 'fghjkl',
        password: await bcrypt.hash('fghjkl123', 10),
      },
    })
    console.log('✓ Admin criado: fghjkl / fghjkl123')
  }

  await prisma.setting.upsert({
    where: { key: 'mercadopago_token' },
    update: { value: '' },
    create: { key: 'mercadopago_token', value: '' },
  })

  await prisma.setting.upsert({
    where: { key: 'store_name' },
    update: {},
    create: { key: 'store_name', value: 'StreamCartoon' },
  })

  const products = [
    { name: 'Netflix 1 Mês', description: 'Assinatura Netflix Premium 1 mês. Conta compartilhada, tela HD/4K.', price: 19.90, category: '🎬 Netflix', image: '/netflix.svg' },
    { name: 'Netflix 3 Meses', description: 'Assinatura Netflix Premium 3 meses. Economia e praticidade!', price: 49.90, category: '🎬 Netflix', image: '/netflix.svg' },
    { name: 'Disney+ 1 Mês', description: 'Assinatura Disney+ 1 mês. Todos os filmes e séries da Marvel, Star Wars e mais!', price: 14.90, category: '📺 Disney+', image: '/disney.svg' },
    { name: 'Disney+ 3 Meses', description: 'Assinatura Disney+ 3 meses. O melhor custo-benefício!', price: 39.90, category: '📺 Disney+', image: '/disney.svg' },
    { name: 'HBO Max 1 Mês', description: 'Assinatura HBO Max 1 mês. Séries, filmes e lançamentos exclusivos.', price: 12.90, category: '🎥 HBO', image: '/hbomax.svg' },
    { name: 'Spotify Premium 1 Mês', description: 'Spotify Premium 1 mês. Música sem anúncios, offline e ilimitada.', price: 9.90, category: '🎵 Spotify', image: '/spotify.svg' },
    { name: 'Amazon Prime 1 Mês', description: 'Amazon Prime 1 mês. Frete grátis, Prime Video, Prime Music e mais!', price: 8.90, category: '📦 Amazon', image: '/prime.svg' },
  ]

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } })
    if (!exists) {
      await prisma.product.create({ data: p })
      console.log(`✓ Produto criado: ${p.name} - R$ ${p.price.toFixed(2)}`)
    }
  }

  const codes = [
    { name: 'Netflix 1 Mês', values: ['NF1M-A1B2C3', 'NF1M-D4E5F6', 'NF1M-G7H8I9'] },
    { name: 'Disney+ 1 Mês', values: ['DP1M-J1K2L3', 'DP1M-M4N5O6', 'DP1M-P7Q8R9'] },
  ]

  for (const c of codes) {
    const product = await prisma.product.findFirst({ where: { name: c.name } })
    if (product) {
      for (const val of c.values) {
        const exists = await prisma.code.findFirst({ where: { value: val } })
        if (!exists) {
          await prisma.code.create({ data: { productId: product.id, value: val } })
          console.log(`✓ Código adicionado: ${val} (${c.name})`)
        }
      }
    }
  }

  const jottaAdminExists = await prisma.admin.findUnique({ where: { username: 'jotta' } })
  if (!jottaAdminExists) {
    await prisma.admin.create({
      data: {
        username: 'jotta',
        password: await bcrypt.hash('jotta1@', 10),
      },
    })
    console.log('✓ Admin criado: jotta / jotta1@')
  }

  console.log('\n=== Seed concluído! ===')
  console.log('Admin: fghjkl / fghjkl123')
  console.log('Admin: jotta / jotta1@')
  console.log('Produtos: 7 criados')
  console.log('Códigos de teste: 6 criados')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
