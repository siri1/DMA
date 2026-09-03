import { PrismaClient, UserRole, AssetStatus, MaintenanceType, WorkOrderOrigin, WorkOrderPriority, WorkOrderStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.stateTransition.deleteMany()
  await prisma.inventoryCountLine.deleteMany()
  await prisma.inventoryCount.deleteMany()
  await prisma.stockBalance.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.requisitionLine.deleteMany()
  await prisma.requisition.deleteMany()
  await prisma.receiptLine.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.purchaseOrderLine.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.intervention.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.quarantine.deleteMany()
  await prisma.maintenancePlan.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPassword = await hash('Admin@2026', 10)
  const userPassword = await hash('User@2026', 10)

  const _admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@kwanda.ao',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      active: true,
    },
  })

  const oficina = await prisma.user.create({
    data: {
      name: 'Técnico Oficina',
      email: 'tecnico@kwanda.ao',
      passwordHash: userPassword,
      role: UserRole.OFICINA,
      active: true,
    },
  })

  const armazem = await prisma.user.create({
    data: {
      name: 'Gestor Armazém',
      email: 'armazem@kwanda.ao',
      passwordHash: userPassword,
      role: UserRole.ARMAZEM,
      active: true,
    },
  })

  const _gestao = await prisma.user.create({
    data: {
      name: 'Gestor DMA',
      email: 'gestao@kwanda.ao',
      passwordHash: userPassword,
      role: UserRole.GESTAO,
      active: true,
    },
  })

  const _cliente = await prisma.user.create({
    data: {
      name: 'Cliente Interno',
      email: 'cliente@kwanda.ao',
      passwordHash: userPassword,
      role: UserRole.CLIENTE_INTERNO,
      active: true,
    },
  })

  const _painel = await prisma.user.create({
    data: {
      name: 'Painel TV',
      email: 'painel@kwanda.ao',
      passwordHash: userPassword,
      role: UserRole.PAINEL,
      active: true,
    },
  })

  console.log('✅ Users created')

  // Create assets (equipamentos industriais de Angola)
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        assetCode: 'EMPI-001',
        description: 'Empilhador Frontal Toyota 3.0T',
        brand: 'Toyota',
        model: '8FGU30',
        serialNumber: 'BF0328742',
        entryDate: new Date('2022-06-15'),
        diagnosis: 'Operacional',
        location: 'Warehouse A',
        responsibleId: oficina.id,
        status: AssetStatus.EM_OPERACAO,
        family: 'Empilhadores',
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: 'GERA-001',
        description: 'Gerador Diesel Perkins 150kVA',
        brand: 'Perkins',
        model: '1106-70TG1',
        serialNumber: 'PK987654',
        entryDate: new Date('2021-03-20'),
        diagnosis: 'Requer manutenção preventiva',
        location: 'Site A',
        responsibleId: oficina.id,
        status: AssetStatus.EM_OPERACAO,
        family: 'Geradores',
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: 'COMP-001',
        description: 'Compressor Parafuso Atlas Copco 30kW',
        brand: 'Atlas Copco',
        model: 'GA30VSD+',
        serialNumber: 'AC45123456',
        entryDate: new Date('2020-09-10'),
        diagnosis: 'Em manutenção',
        location: 'Site B',
        responsibleId: oficina.id,
        status: AssetStatus.EM_MANUTENCAO,
        family: 'Compressores',
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: 'VIAT-001',
        description: 'Viatura Hino 300 para transporte',
        brand: 'Hino',
        model: 'FC 1J',
        serialNumber: 'JHMFD8144Y0098765',
        entryDate: new Date('2019-11-05'),
        diagnosis: 'Fora de serviço',
        location: 'Oficina',
        responsibleId: oficina.id,
        status: AssetStatus.FORA_DE_SERVICO,
        family: 'Viaturas',
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: 'BOMB-001',
        description: 'Bomba Submersível KSB Underwater 7.5kW',
        brand: 'KSB',
        model: 'UPA 300',
        serialNumber: 'KSB-UPA-001234',
        entryDate: new Date('2023-01-12'),
        diagnosis: 'Quarentena - aguardando parecer',
        location: 'Quarentena',
        responsibleId: oficina.id,
        status: AssetStatus.QUARENTENA,
        family: 'Bombas',
      },
    }),
  ])

  console.log('✅ Assets created')

  // Create maintenance plans
  await Promise.all([
    prisma.maintenancePlan.create({
      data: {
        assetId: assets[0].id,
        type: MaintenanceType.PREVENTIVA,
        periodicityDays: 90,
        nextDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      },
    }),
    prisma.maintenancePlan.create({
      data: {
        assetId: assets[1].id,
        type: MaintenanceType.PREVENTIVA,
        periodicityDays: 180,
        nextDueAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        active: true,
      },
    }),
  ])

  console.log('✅ Maintenance plans created')

  // Create work orders
  const workOrder1 = await prisma.workOrder.create({
    data: {
      number: `OT-${new Date().getFullYear()}-0001`,
      assetId: assets[0].id,
      origin: WorkOrderOrigin.AVARIA,
      priority: WorkOrderPriority.ALTA,
      status: WorkOrderStatus.EM_CURSO,
      assignedToId: oficina.id,
      openedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      summary: 'Vibração anormal no motor - diagnóstico necessário',
    },
  })

  const _workOrder2 = await prisma.workOrder.create({
    data: {
      number: `OT-${new Date().getFullYear()}-0002`,
      assetId: assets[2].id,
      origin: WorkOrderOrigin.PLANO,
      priority: WorkOrderPriority.MEDIA,
      status: WorkOrderStatus.ABERTA,
      assignedToId: oficina.id,
      openedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      summary: 'Manutenção preventiva mensal - revisão completa',
    },
  })

  console.log('✅ Work orders created')

  // Create interventions
  await prisma.intervention.create({
    data: {
      workOrderId: workOrder1.id,
      technicianId: oficina.id,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      diagnosis: 'Corrente de comando desgastada - substituição necessária',
      activities: 'Inspeção visual e testes de vibração',
      laborMinutes: 120,
    },
  })

  console.log('✅ Interventions created')

  // Create suppliers
  const _supplier1 = await prisma.supplier.create({
    data: {
      name: 'MECA Ltda. - Peças Industriais',
      nif: '1234567890',
      contact: 'João Silva',
      phone: '+244 923 456 789',
      email: 'vendas@meca.ao',
      leadTimeDays: 5,
      active: true,
    },
  })

  const _supplier2 = await prisma.supplier.create({
    data: {
      name: 'BMS Importação e Comércio',
      nif: '0987654321',
      contact: 'Maria Santos',
      phone: '+244 929 876 543',
      email: 'contacto@bms.ao',
      leadTimeDays: 10,
      active: true,
    },
  })

  console.log('✅ Suppliers created')

  // Create items
  const item1 = await prisma.item.create({
    data: {
      sku: 'CORRENTE-001',
      description: 'Corrente de comando 80cc',
      brand: 'Mitsubishi',
      unit: 'UN',
      minStock: 2,
      maxStock: 10,
      avgCost: 15000,
      barcode: '8716548965214',
      active: true,
    },
  })

  const item2 = await prisma.item.create({
    data: {
      sku: 'OLEO-MOT-10W',
      description: 'Óleo motor 10W40 mineral',
      brand: 'Mobil',
      unit: 'L',
      minStock: 10,
      maxStock: 50,
      avgCost: 2500,
      barcode: '5010620034597',
      active: true,
    },
  })

  const _item3 = await prisma.item.create({
    data: {
      sku: 'FILTRO-AR-P1',
      description: 'Filtro de ar primário',
      brand: 'Donaldson',
      unit: 'UN',
      minStock: 5,
      maxStock: 20,
      avgCost: 8000,
      barcode: '0075981120008',
      active: true,
    },
  })

  console.log('✅ Items created')

  // Create locations
  const loc1 = await prisma.location.create({
    data: {
      code: 'A1-C01-P01-01',
      warehouse: 'Armazém A',
      aisle: 'C01',
      shelf: 'P01',
      position: '01',
    },
  })

  const loc2 = await prisma.location.create({
    data: {
      code: 'A1-C02-P02-05',
      warehouse: 'Armazém A',
      aisle: 'C02',
      shelf: 'P02',
      position: '05',
    },
  })

  console.log('✅ Locations created')

  // Create stock balances and movements
  await prisma.stockBalance.create({
    data: {
      itemId: item1.id,
      locationId: loc1.id,
      qty: 5,
    },
  })

  await prisma.stockMovement.create({
    data: {
      itemId: item1.id,
      locationId: loc1.id,
      type: 'INVENTARIO',
      qty: 5,
      unitCost: 15000,
      userId: armazem.id,
    },
  })

  await prisma.stockBalance.create({
    data: {
      itemId: item2.id,
      locationId: loc2.id,
      qty: 25,
    },
  })

  await prisma.stockMovement.create({
    data: {
      itemId: item2.id,
      locationId: loc2.id,
      type: 'INVENTARIO',
      qty: 25,
      unitCost: 2500,
      userId: armazem.id,
    },
  })

  console.log('✅ Stock balances and movements created')

  // Create requisition
  const requisition = await prisma.requisition.create({
    data: {
      workOrderId: workOrder1.id,
      status: 'AGUARDA_MATERIAL',
    },
  })

  await prisma.requisitionLine.create({
    data: {
      requisitionId: requisition.id,
      itemId: item1.id,
      qtyRequested: 1,
      qtyReserved: 0,
    },
  })

  console.log('✅ Requisitions created')

  // Create state transitions
  await prisma.stateTransition.create({
    data: {
      entityType: 'workorder',
      entityId: workOrder1.id,
      fromState: 'ABERTA',
      toState: 'EM_CURSO',
      reason: 'Técnico iniciou diagnóstico',
      userId: oficina.id,
    },
  })

  console.log('✅ State transitions created')

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
