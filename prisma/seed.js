const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('Admin@2026', 10)

  const users = [
    {
      name: 'Admin',
      email: 'admin@kwanda.ao',
      passwordHash: password,
      role: 'ADMIN',
      active: true,
    },
    {
      name: 'Técnico Oficina',
      email: 'oficina@kwanda.ao',
      passwordHash: password,
      role: 'OFICINA',
      active: true,
    },
    {
      name: 'Gestor Armazém',
      email: 'armazem@kwanda.ao',
      passwordHash: password,
      role: 'ARMAZEM',
      active: true,
    },
    {
      name: 'Gestor',
      email: 'gestor@kwanda.ao',
      passwordHash: password,
      role: 'GESTAO',
      active: true,
    },
    {
      name: 'Cliente Interno',
      email: 'cliente@kwanda.ao',
      passwordHash: password,
      role: 'CLIENTE_INTERNO',
      active: true,
    },
    {
      name: 'Painel TV',
      email: 'painel@kwanda.ao',
      passwordHash: password,
      role: 'PAINEL',
      active: true,
    },
  ]

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!existing) {
      await prisma.user.create({ data: user })
      console.log(`✓ Created ${user.email}`)
    } else {
      console.log(`✓ ${user.email} already exists`)
    }
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
