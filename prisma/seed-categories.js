// Script para adicionar categorias padrão
// Execute com: node prisma/seed-categories.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Netflix', icon: '🎬', order: 1 },
  { name: 'Disney+', icon: '📺', order: 2 },
  { name: 'HBO', icon: '🎥', order: 3 },
  { name: 'Spotify', icon: '🎵', order: 4 },
  { name: 'Amazon', icon: '📦', order: 5 },
  { name: 'Jogos', icon: '🎮', order: 6 },
  { name: 'Apps', icon: '📱', order: 7 },
  { name: 'Outros', icon: '🛒', order: 8 },
]

async function main() {
  console.log('🌱 Inserindo categorias padrão...')
  
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    console.log(`  ✅ ${cat.icon} ${cat.name}`)
  }
  
  console.log('✅ Categorias inseridas com sucesso!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())