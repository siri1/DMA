# MVP 4 — Demonstração ao Cliente: Gestão e Monitorização

**Data:** 2026-09-03  
**Duração prevista:** 30 min  
**Público:** DMA (Gestão, Supervisão), IT (Administração)

---

## Setup Inicial (5 min)

### 1. Credenciais de Acesso
```
URL: http://localhost:3000/login
Gestor: gestor@kwanda.ao / Gestor@2026
Admin: admin@kwanda.ao / Admin@2026
```

### 2. Navegação
- Gestor acede a `/dashboard-exec` e `/dashboard-ops`
- Admin acede a `/admin/users` e `/admin/audit`

---

## Fluxo de Demonstração (25 min)

### 1. Dashboard Executivo (5 min)

**Acesso:** Menu > Painel Executivo (GESTAO)

**KPIs mostrados:**
- ✓ Equipamentos em Manutenção: 3
- ✓ OT Abertas: 5
- ✓ OT Concluídas: 12
- ✓ OT Atrasadas: 2
- ✓ Manutenções Vencidas: 1
- ✓ Tempo Médio Resolução: 4.5 dias
- ✓ Valor Total de Stock: 150 000,00 Kz

**Funcionalidades:**
1. Filtro por período (últimos 30 dias por defeito)
2. Gráfico de barras: Abertas vs. Concluídas vs. Atrasadas
3. Cartão de valor de stock em verde

---

### 2. Dashboard Operacional (5 min)

**Acesso:** Menu > Painel Operacional

**O que mostra:**
- Distribuição de equipamentos por estado (gráficos cards)
- Top 10 OT atrasadas com cores de prioridade
- Manutenções vencidas (lista accionável)
- Artigos abaixo do mínimo (tabela: SKU, descrição, défice)

**Interactividade:**
- Clicar em OT atrasada abre `/workorders/[id]`
- Artigos com défice em vermelho — link para comprar

---

### 3. Controlo de Utilizadores (8 min)

**Acesso:** Menu > Utilizadores (ADMIN)

**Funcionalidades:**

#### a) Criar Novo Utilizador (3 min)
1. Clicar `+ Novo Utilizador`
2. Preencher:
   - Nome: `João Silva`
   - Email: `joao@kwanda.ao`
   - Perfil: `OFICINA`
   - Palavra-passe: `Password@2026`
3. Confirmar — utilizador aparece na lista com status **Activo**

#### b) Gerir Utilizadores Existentes (3 min)
- Mostrar lista de 6 utilizadores (1 por cada perfil)
- Clicar em utilizador OFICINA → Mostrar "Último Acesso: 2026-09-03 14:30"
- Botão "Desactivar" → Muda status para **Inactivo** (não aparece mais no login)

#### c) Editar Perfil (2 min)
- Seleccionar utilizador ARMAZEM
- Clique no nome → detalhe (futura página de edit)
- Demonstrar RBAC: ADMIN consegue editar, OFICINA não consegue aceder

---

### 4. Auditoria (4 min)

**Acesso:** Menu > Auditoria (ADMIN, GESTAO)

**Funcionalidades:**

#### a) Visualizar Logs (2 min)
- Tabela com: Timestamp | Utilizador | Acção | Módulo | Entidade
- Exemplo de linhas:
  - `2026-09-03 14:32 | Técnico Silva | CREATE | workorders | workorder:OT-2026-0005`
  - `2026-09-03 14:31 | João | STATE_CHANGE | assets | asset:EMPI-001`

#### b) Filtrar (1 min)
1. Módulo: seleccionar `workorders` → mostra só WO
2. Acção: seleccionar `CREATE` → mostra só criações
3. Período: `01/09/2026` a `03/09/2026`
4. Resultado: 3 registos

#### c) Exportar (1 min)
- Clicar `Exportar CSV`
- Browser descarrega `auditoria-2026-09-03.csv`
- Abrir no Excel: dados estruturados com BOM UTF-8

---

## Pontos-Chave da Demonstração

✅ **Visibilidade executiva:** Gestores veem métricas consolidadas (stock, OT, manutenção) sem aceder a cada módulo

✅ **Governança:** Admin controla quem tem acesso; RBAC enforced em todas as rotas

✅ **Rastreabilidade:** Cada acção é auditada — quem fez, quando, o quê; impossível falsificar

✅ **Usabilidade:** Dashboards em Português pré-AO90; tabelas exportáveis; filtros intuitivos

✅ **Pronto para produção:** TypeScript strict, ESLint clean, 56 testes unitários passing

---

## Checklist Técnico (antes da demo)

- [ ] Base de dados com pelo menos 5 work orders de teste
- [ ] Pelo menos 2 OT com status OVERDUE (dueAt no passado)
- [ ] Stock value > 100k Kz
- [ ] Dashboard Executive com gráfico renderizado
- [ ] 6 utilizadores criados (1 por cada perfil)
- [ ] Auditoria mostra pelo menos 10 logs (CREATE/UPDATE)
- [ ] Exportação CSV funciona (abrir em Excel/Calc)
- [ ] RBAC funciona: OFICINA não consegue aceder `/admin/users`

---

## Transição para Produção

**Documentação complementar:**
- `/docs/RUNBOOK.md` — instalação, backup, restauro, actualização
- `/docs/API.md` — endpoints de dashboards e auditoria
- `/docs/RBAC.md` — matriz completa de permissões

**Próximas fases:**
- Tests E2E com Playwright (login → dashboard → export)
- Dockerfile multi-stage + NGINX para VPS Ubuntu 24
- Integração de notificações por e-mail (resumos diários)

---

## Fim da Demonstração

**Perguntas do Cliente?**
- "Posso adicionar mais métricas ao dashboard?" → Sim, extensível em `/modules/dashboards/services.ts`
- "Quem foi que alterou este utilizador?" → Consulte Auditoria, filtre por módulo `users`
- "Posso restringir acesso a apenas um equipamento?" → Seria uma extensão (RBAC level 3), fora de MVP 4
