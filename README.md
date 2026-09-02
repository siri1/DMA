# DMA Vision — Sistema de Gestão de Manutenção e Peças

Plataforma web integrada para a KWANDA, Lda. — Departamento de Manutenção e Ativos (DMA).

**Status:** MVP 1 — Log de Avarias (Completa) | Próximo: MVP 2 — Oficina

---

## 🚀 Quick Start (Desenvolvimento)

### Requisitos
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (ou via Docker)

### Instalação

```bash
# Clonar repositório
git clone <repo> dma-vision
cd dma-vision

# Instalar dependências
npm install

# Copiar ambiente
cp .env.example .env

# Iniciar containers (dev)
docker-compose up -d

# Executar migrações
npm run db:generate
npm run db:migrate

# Seed com dados de demonstração
npm run db:seed

# Iniciar servidor dev
npm run dev
```

Aceda a **http://localhost:3001**

**Credenciais de Demonstração:**
- Email: `admin@kwanda.ao`
- Password: `Admin@2026`

---

## 📋 Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript 5.3 |
| Frontend | React 18 + Tailwind CSS + shadcn/ui |
| Backend | Server Actions + Route Handlers |
| BD | PostgreSQL 16 |
| ORM | Prisma 5.6 |
| Auth | Auth.js v5 |
| Validação | Zod |
| Testes | Vitest + Playwright |
| Qualidade | ESLint + Prettier + Husky |
| Infra | Docker Compose (dev) → Ubuntu 24 VPS (prod) |

---

## 📂 Estrutura do Projecto

```
.
├── app/                    # Next.js App Router
│   ├── (auth)             # Rotas de autenticação
│   ├── (oficina)          # Contexto Oficina
│   ├── (armazem)          # Contexto Armazém
│   ├── (gestao)           # Contexto Gestão
│   ├── (painel)           # Painel TV
│   ├── (admin)            # Administração
│   └── api/               # Route Handlers
├── components/            # React components (shadcn/ui + domain)
├── lib/                   # Utilities (auth, rbac, prisma, audit, state-machine, formatters)
├── modules/               # Domain logic (services, validators, actions)
├── prisma/
│   ├── schema.prisma      # Modelo de dados (single source of truth)
│   ├── migrations/        # Histórico de migrações
│   └── seed.ts            # Dados iniciais
├── worker/                # Node-cron (notificações, alertas)
├── scripts/               # Migração, backup, restauro
├── docs/                  # Documentação (ARCHITECTURE, DATA_MODEL, RBAC, STATES, ASSUMPTIONS)
├── tests/                 # Unit & E2E tests
└── docker-compose.yml     # Dev environment

```

---

## 🔐 Perfis de Utilizador

| Perfil | Funções | Acesso |
|---|---|---|
| ADMIN | Administração total | Todas as funcionalidades |
| OFICINA | Técnico de manutenção | Assets, WorkOrders, Interventions |
| ARMAZEM | Gestor de peças | Items, Stocks, Requisições, Compras |
| GESTAO | Gestor DMA | Tudo + Dashboards + Auditoria |
| CLIENTE_INTERNO | Leitor | Assets, Items (sem custos) |
| PAINEL | TV monitoring | Ecrã de monitorização |

---

## 📚 Documentação

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Visão geral da arquitetura
- [DATA_MODEL.md](docs/DATA_MODEL.md) — Schema Prisma detalhado
- [RBAC.md](docs/RBAC.md) — Matriz de permissões
- [STATES.md](docs/STATES.md) — Máquina de estados
- [ASSUMPTIONS.md](docs/ASSUMPTIONS.md) — Pressupostos do projeto
- [RUNBOOK.md](docs/RUNBOOK.md) — Instalação, deploy, troubleshooting (TODO)
- [API.md](docs/API.md) — Endpoints REST (TODO)

---

## 🧪 Testes

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Check
```bash
npm run typecheck
```

### Lint & Format
```bash
npm run lint
npm run format
```

---

## 📦 Scripts Úteis

```bash
# Base de dados
npm run db:generate      # Gerar Prisma Client
npm run db:migrate       # Executar migrações
npm run db:seed          # Seed com dados de demo
npm run db:push          # Sync schema com BD (dev)
npm run db:studio        # Abrir Prisma Studio

# Desenvolvimento
npm run dev              # Iniciar servidor dev
npm run build            # Build para produção
npm run start            # Iniciar servidor prod

# Qualidade
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript strict check
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E

# Infra
npm run backup           # Backup BD (pg_dump)
npm run restore          # Restaurar BD

```

---

## 🔄 Fases de Desenvolvimento

- **Fase 0 (Actual)** — Fundações: Auth, RBAC, Schema, Seed, Layouts base
- **MVP 1** — Log de Avarias: Portal, Assets, Estados, Painel TV
- **MVP 2** — Oficina: WorkOrders, Interventions, Notificações
- **MVP 3** — Armazém: Peças, Stocks, Compras, Requisições, Quarentena
- **MVP 4** — Gestão: Dashboards, Auditoria, Controlo de Acesso, Prod

---

## 🌐 Ambientes

### Desenvolvimento
```bash
docker-compose up -d
npm run dev
```

Serviços:
- App: http://localhost:3001
- Postgres: localhost:5432
- MailHog: http://localhost:8025 (SMTP testing)

### Produção
Usar Dockerfile multi-stage + NGINX + Ubuntu 24 VPS (ver RUNBOOK.md)

---

## 🔑 Variáveis de Ambiente

Ver `.env.example`:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<min 32 chars>
NEXTAUTH_URL=http://localhost:3000
SMTP_HOST=localhost
TIMEZONE=Africa/Luanda
```

---

## 📋 Requisitos Não Funcionais

- **Segurança:** HTTPS (prod), cabeçalhos, rate limiting, bcrypt
- **Desempenho:** < 2s com 10k assets, 100k OT, 500k movimentos
- **Fiabilidade:** Backup diário, health check (/api/health)
- **Usabilidade:** Português pré-AO90, AOA, dd/mm/aaaa
- **Observabilidade:** Logs estruturados (pino), requestId

---

## 🛡️ Segurança

- Autenticação JWT stateless
- RBAC matrix (lib/rbac.ts)
- Auditoria append-only (trigger PostgreSQL)
- Validação Zod (cliente + servidor)
- Senhas ≥ 10 caracteres + bcryptjs
- Rate limiting no login

---

## 📞 Suporte

- Documentação: `/docs`
- Issues: [GitHub Issues](https://github.com/...)
- Contacto: support@kwanda.ao

---

## 📄 Licença

Proprietary — KWANDA, Lda. (2026)

---

**Built with ❤️ by MLK — Mobile Lógico Kappa**
