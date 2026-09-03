import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
})

export async function sendWorkOrderCreatedEmail(
  workOrderId: string,
  technicianEmail: string,
  workOrderNumber: string,
  assetDescription: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@kwanda.ao',
      to: technicianEmail,
      subject: `Nova Ordem de Trabalho: ${workOrderNumber}`,
      html: `
        <h2>Nova Ordem de Trabalho</h2>
        <p><strong>Número:</strong> ${workOrderNumber}</p>
        <p><strong>Equipamento:</strong> ${assetDescription}</p>
        <p><a href="${process.env.NEXTAUTH_URL}/oficina/workorders/${workOrderId}">Ver OT</a></p>
      `,
    })

    // Log notification
    await prisma.notification.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email: technicianEmail } }))?.id || '',
        channel: 'EMAIL',
        event: 'work_order_created',
        payload: { workOrderNumber, assetDescription },
        sentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Email send failed:', error)
  }
}

export async function sendStateChangeEmail(
  userId: string,
  entityType: string,
  _entityId: string,
  newState: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@kwanda.ao',
      to: user.email,
      subject: `Mudança de Estado: ${entityType}`,
      html: `
        <h2>Mudança de Estado</h2>
        <p><strong>Tipo:</strong> ${entityType}</p>
        <p><strong>Novo Estado:</strong> ${newState}</p>
        <p>Tempo: ${new Date().toLocaleString('pt-PT')}</p>
      `,
    })

    await prisma.notification.create({
      data: {
        userId,
        channel: 'EMAIL',
        event: 'state_changed',
        payload: { entityType, newState },
        sentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Email send failed:', error)
  }
}

export async function sendDailySummaryEmail(
  userEmail: string,
  summary: { overdueWOs: number; lowStockItems: number; newAssets: number }
) {
  const html = `
    <h2>Resumo Diário — ${new Date().toLocaleDateString('pt-PT')}</h2>
    <ul>
      <li>Ordens Atrasadas: <strong>${summary.overdueWOs}</strong></li>
      <li>Artigos Abaixo do Mínimo: <strong>${summary.lowStockItems}</strong></li>
      <li>Novos Equipamentos: <strong>${summary.newAssets}</strong></li>
    </ul>
    <p><a href="${process.env.NEXTAUTH_URL}">Aceder ao Painel</a></p>
  `

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@kwanda.ao',
      to: userEmail,
      subject: `Resumo Diário — ${new Date().toLocaleDateString('pt-PT')}`,
      html,
    })
  } catch (error) {
    console.error('Daily summary email failed:', error)
  }
}
