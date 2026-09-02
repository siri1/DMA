# DMA Vision — Arquitectura

## Visão Geral

DMA Vision é uma plataforma web integrada para gestão de manutenção de equipamentos e controlo de peças de reposição do Departamento de Manutenção e Ativos (DMA) da KWANDA, Lda.

A solução é construída em **camadas** e **módulos**, seguindo princípios de clean architecture e domain-driven design.

## 4 Camadas Principais

```
┌─────────────────────────────────────────────────────┐
│ 1. APRESENTAÇÃO                                     │
│    Navegadores web (Desktop/Tablet)                 │
│    5 contextos: Oficina, Armazém, Gestão, Cliente,  │
│    Painel TV                                         │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ 2. APLICAÇÃO                                        │
│    API REST (Next.js Route Handlers)               │
│    Server Actions para formulários                 │
│    Máquina de Estados (Workflow)                   │
│    Motor de Indicadores                            │
│    Orquestração de Notificações                    │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ 3. INTEGRAÇÃO                                       │
│    Migração Excel → BD (scripts)                    │
│    Import/Export (CSV, XLSX, PDF)                  │
│    SMTP (Nodemailer)                               │
│    Códigos de Barras / QR (bwip-js)                │
│    Extensão: ERP, BI (pontos de extensão           │
│    documentados)                                    │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ 4. DADOS                                            │
│    PostgreSQL 16 (fonte única de verdade)          │
│    Trigger PostgreSQL para auditoria imutável      │
│    Ficheiros: disco ou S3-compatível               │
│    Backups diários (pg_dump)                       │
└─────────────────────────────────────────────────────┘
```

## Módulos de Domínio (13)

| # | Módulo | Descrição |
|---|---|---|
| 5.1 | Portal Web | Login, dashboard por perfil, pesquisa global |
| 5.2 | Gestão de Equipamentos | CRUD Asset, fotos, documentos |
| 5.3 | Gestão de Manutenção | Planos, geração automática de OT |
| 5.4 | Ordens de Trabalho | Criação, priorização, indicadores |
| 5.5 | Intervenções | Diagnóstico, actividades, materiais, tempos |
| 5.6 | Gestão de Estados | Máquina de estados com histórico |
| 5.7 | Quarentena e Sucata | Entrada, parecer, decisão |
| 5.8 | Gestão de Peças | Stocks, Compras, Recepção, Requisições, Localizações |
| 5.9 | Painel de Monitorização | Ecrã TV full-screen, auto-refresh |
| 5.10 | Dashboard Executivo | KPI, gráficos, filtros |
| 5.11 | Dashboard Operacional | Listas accionáveis |
| 5.12 | Controlo de Acesso | RBAC, sessões, auditoria |
| 5.13 | Auditoria | Consulta, exportação, imutabilidade |

## Stack Tecnológico

- **Runtime:** Node.js 20+
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript 5.3 (strict)
- **Frontend:** React 18 + Tailwind CSS 3 + shadcn/ui + Lucide
- **Backend:** Server Actions + Route Handlers
- **BD:** PostgreSQL 16
- **ORM:** Prisma 5.6
- **Auth:** Auth.js v5 (JWT sessions)
- **Validação:** Zod (compartilhado cliente/servidor)
- **Testes:** Vitest + Playwright
- **CI/CD:** Git Hooks (Husky) + ESLint + Prettier
- **Infra:** Docker Compose (dev) → Ubuntu 24 VPS (prod)

## Estrutura de Diretórios

```
/app
  /(auth)           Login, recuperação de pwd
  /(oficina)        Rotas da Oficina DMA
  /(armazem)        Rotas do Armazém
  /(gestao)         Rotas de Gestão
  /(painel)         Painel TV (sem chrome)
  /(admin)          Rotas de Administração
  /api              Route Handlers (/health, /metrics, ...)

/components
  /layout           Sidebar, Header, ...
  /ui               shadcn/ui + customizações
  /domain           Componentes de negócio (Asset Card, WO List, ...)

/lib
  auth.ts           Auth.js config
  rbac.ts           Matriz de permissões
  audit.ts          Logging de auditoria
  state-machine.ts  Máquina de estados
  formatters.ts     Data, moeda, número em pt-PT
  prisma.ts         Client singleton

/modules
  /users            Serviços de utilizadores
  /assets           Serviços de equipamentos
  /workorders       Serviços de OT
  /interventions    Serviços de intervenções
  /items            Serviços de artigos
  /stocks           Serviços de movimentos de stock
  /requisitions     Serviços de requisições

/prisma
  schema.prisma     Modelo de dados (single source of truth)
  seed.ts           Dados iniciais
  migrations/       Histórico de migrações

/worker
  cron.ts           Node-cron: notificações, alertas, indicadores

/scripts
  migrate-log-avarias.ts    Importar Log de Avarias (Excel)
  migrate-pecas.ts          Importar Peças (Excel)
  backup.sh                 Cópia de segurança (pg_dump)
  restore.sh                Restauro da BD

/docs
  ARCHITECTURE.md   Este ficheiro
  DATA_MODEL.md     Schema Prisma explicado
  RBAC.md           Matriz de permissões
  STATES.md         Máquina de estados (tabelas)
  API.md            Endpoints REST
  ASSUMPTIONS.md    Pressupostos do projecto
  RUNBOOK.md        Instalação, deploy, troubleshooting
```

## Transversais

### HTTPS & Segurança
- HTTPS obrigatório em produção
- Cabeçalhos de segurança (X-Frame-Options, X-Content-Type-Options, ...)
- Rate limiting no login (NextAuth)
- Senhas ≥ 10 caracteres + bcryptjs

### RBAC (Role-Based Access Control)
- 6 perfis: ADMIN, OFICINA, ARMAZEM, GESTAO, CLIENTE_INTERNO, PAINEL
- Permissões por módulo × operação: view | create | edit | delete | approve | admin
- Guard verificado em todas as Server Actions e Route Handlers
- CLIENTE_INTERNO nunca vê custos, fornecedores ou auditoria

### Auditoria Imutável
- Trigger PostgreSQL: `AuditLog` é append-only (sem UPDATE/DELETE)
- Cada escrita de negócio gera log com: userId, action, entityType, entityId, before, after, ip
- Consultável por filtros e exportável

### Notificações
- Canal APP (in-app): Notification model
- Canal EMAIL: Nodemailer com templates React Email
- Configurável por evento (novo asset, mudança de estado, stock mínimo, OT atrasada, resumo diário)
- Worker cron dispara notificações agendadas

## Fluxos Principais

### Fluxo 1: Asset → WorkOrder → Intervention → Resolução
```
1. Criar Asset (CRUD)
   ↓
2. Asset muda estado: EM_OPERACAO → EM_MANUTENCAO (state-machine)
   ↓
3. Gerar WorkOrder (manual ou automático por plano)
   ↓
4. Criar Intervention(s) com diagnóstico/actividades
   ↓
5. Requisição de peças → Requisition.status = AGUARDA_MATERIAL
   ↓
6. WorkOrder muda para AGUARDA_MATERIAL até recepção
   ↓
7. Intervention completa com result = CONCLUIDA
   ↓
8. WorkOrder passa para EM_INSPECCAO → RESOLVIDA
   ↓
9. Asset volta a EM_OPERACAO
```

### Fluxo 2: Requisição de Peças
```
1. Oficina cria Requisition (WorkOrder obrigatório)
   ↓
2. Armazém valida stock: RESERVADA ou AGUARDA_MATERIAL
   ↓
3. Se stock suficiente: StockMovement tipo SAIDA (CMP recalculado)
   ↓
4. Se falta: alerta e WorkOrder fica em AGUARDA_MATERIAL
   ↓
5. Recepção de Compra: StockMovement tipo ENTRADA (CMP atualizado)
   ↓
6. Requisition muda para ENTREGUE
```

## Integração de Componentes

```
┌─────────────────────────────────────────────────────┐
│ Cliente (Browser)                                   │
│ React + Tailwind + shadcn/ui                        │
│ useFormState (Server Actions)                       │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ Next.js App Router & API                            │
│ ├─ /app/(context)/page.tsx, layout.tsx             │
│ ├─ /app/api/*/route.ts (REST endpoints)            │
│ └─ lib/ (shared utilities)                         │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ Camada de Negócio (modules/)                       │
│ ├─ Services: lógica de domínio                     │
│ ├─ Validators: Zod schemas                         │
│ ├─ Actions: Server Actions com auditoria          │
│ └─ Máquina de Estados (state-machine.ts)          │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ Prisma ORM                                          │
│ ├─ Queries & Mutations                            │
│ └─ Hooks PostgreSQL (trigger de auditoria)        │
└────────────┬────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────┐
│ PostgreSQL 16                                       │
│ ├─ Tables: User, Asset, WorkOrder, Item, ...      │
│ ├─ Indices: performance                           │
│ └─ Triggers: AuditLog imutável, CMP              │
└─────────────────────────────────────────────────────┘
```

## Requisitos Não Funcionais

| Categoria | Requisito | Implementação |
|---|---|---|
| Segurança | Senhas bcrypt, HTTPS | nextauth + bcryptjs |
| Desempenho | < 2s com 10k assets, 100k OT | Índices Prisma + query optimization |
| Fiabilidade | Backup diário, health check | scripts/backup.sh + /api/health |
| Usabilidade | Português pré-AO90, AOA | Formatters, locales |
| Observabilidade | Logs estruturados | Pino + requestId |

## Próximos Passos (Fases)

- **Fase 0 (Fundações):** Infra, Auth, RBAC, Seed — **ACTUAL**
- **MVP 1 (Log de Avarias):** Portal, Assets, Estados, Painel TV
- **MVP 2 (Oficina):** WorkOrders, Interventions, Notificações
- **MVP 3 (Peças):** Stocks, Compras, Requisições, Quarentena
- **MVP 4 (Gestão):** Dashboards, Auditoria, Controlo de Acesso, Prod
