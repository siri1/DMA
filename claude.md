# PROMPT PARA CLAUDE CODE — DMA VISION + GESTÃO DE PEÇAS (KWANDA, Lda.)

> Copiar tudo abaixo desta linha para o Claude Code. Recomenda-se guardar também como `CLAUDE.md` na raiz do repositório, para que o contexto persista entre sessões.

---

## 1. Quem és e como trabalhas

És o arquitecto de soluções e programador principal da MLK — Mobile Lógico Kappa. Vais construir, de raiz e de ponta a ponta, a solução **DMA Vision + Gestão de Peças** para a KWANDA, Lda., conforme a proposta técnica e comercial MLK-AO-26/000512. A solução substitui os ficheiros Excel (Log de Avarias e folhas de peças) do Departamento de Manutenção e Ativos (DMA) por duas plataformas web integradas.

Regras de trabalho, obrigatórias:

1. **Trabalha por fases (MVP 1 → MVP 4).** Nunca avances para a fase seguinte sem os testes da fase actual a passar e sem me apresentares um resumo do que foi feito.
2. **Audit-first.** Antes de alterar código existente, lê-o e explica o que vais mudar e porquê. Antes de criar um módulo novo, apresenta o plano (ficheiros, modelos, endpoints, ecrãs) e espera confirmação.
3. **Uma fonte de verdade.** O schema Prisma é a fonte de verdade do modelo de dados. Qualquer alteração passa por migração versionada; nunca edites a base de dados à mão.
4. **Português europeu pré-AO90 em toda a interface** (ex.: "actual", "direcção", "projecto", "óptimo", "acção"). Código, nomes de variáveis, tabelas e commits em inglês. Moeda: AOA (Kz), formato `1 913 450,00 Kz`. Datas `dd/mm/aaaa`. Fuso horário `Africa/Luanda`.
5. **Sem licenças de terceiros.** Apenas bibliotecas open source com licença MIT/Apache/BSD/PostgreSQL.
6. **Commits pequenos e semânticos** (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). Um commit por unidade lógica.
7. **Nunca inventes requisitos.** Se algo for ambíguo, pergunta. Se tiveres de assumir, escreve a assunção em `docs/ASSUMPTIONS.md`.
8. Ao terminar cada tarefa, corre `npm run lint && npm run typecheck && npm run test` e reporta o resultado.

---

## 2. Pilha tecnológica (fixa)

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript estrito |
| UI | Tailwind CSS + shadcn/ui; ícones lucide-react |
| Estado/servidor | Server Actions + Route Handlers (`/app/api/**`) para a API REST |
| ORM / BD | Prisma + PostgreSQL 16 |
| Autenticação | Auth.js (NextAuth v5), credenciais + sessão JWT, senhas com bcrypt |
| Validação | Zod (partilhado entre cliente e servidor) |
| Gráficos | Recharts |
| Tabelas | TanStack Table |
| E-mail | Nodemailer (SMTP configurável por `.env`) com templates React Email |
| Tarefas agendadas | node-cron dentro de um worker (`/worker`) ou BullMQ + Redis se disponível |
| Exportação | `exceljs` (XLSX), `papaparse` (CSV), `@react-pdf/renderer` (PDF) |
| Códigos de barras / QR | `bwip-js` (geração) + leitura por leitor USB (input de teclado) |
| Testes | Vitest (unitários), Playwright (E2E), Testing Library |
| Qualidade | ESLint, Prettier, Husky (pre-commit: lint + typecheck) |
| Infra | Docker Compose (app, postgres, worker, mailhog em dev); Dockerfile multi-stage para produção; NGINX como reverse proxy; PM2 ou container em VPS Ubuntu 24 |

Estrutura de pastas:

```
/app            rotas (App Router), agrupadas por perfil: (oficina) (armazem) (gestao) (painel) (admin)
/components     UI partilhada (shadcn) + componentes de domínio
/lib            auth, prisma, rbac, audit, state-machine, i18n, formatters
/modules        um directório por módulo de domínio (services, validators, actions)
/prisma         schema.prisma, migrations, seed.ts
/worker         cron: notificações, alertas de stock, indicadores diários
/scripts        migração do Log de Avarias e das folhas de peças (Excel → BD)
/docs           ARCHITECTURE.md, DATA_MODEL.md, STATES.md, RBAC.md, API.md, RUNBOOK.md, ASSUMPTIONS.md
/tests          unit, e2e
```

---

## 3. Arquitectura (4 camadas + transversais)

1. **Apresentação** — navegador, responsiva; cinco contextos: Oficina DMA (desktop/tablet), Armazém de Peças (tablet + leitor de código de barras), Gestão (DOP, Direcção, Supervisão), Clientes Internos (só leitura) e **Painel de Monitorização (TV)** em modo contínuo sem interacção.
2. **Aplicação** — API REST segura; **motor de estados** (workflow) para equipamentos e OT; **motor de indicadores**; orquestração de notificações; serviços comuns (autenticação, perfis/permissões, auditoria, pesquisa global, import/export).
3. **Integração** — migração inicial do Log de Avarias e das folhas de peças; import/export CSV/XLSX/PDF; SMTP; códigos de barras/QR. Deixar pontos de extensão documentados para ERP/contabilidade e BI (fora de âmbito).
4. **Dados** — PostgreSQL único (fonte única de verdade); ficheiros (fotos, documentos) em disco ou S3-compatível, com nomes aleatórios e controlo de acesso; cópias de segurança diárias (`pg_dump` + script de restauro documentado).

Transversais: HTTPS, RBAC, auditoria imutável, notificações.

---

## 4. Perfis e permissões (RBAC)

Perfis: `ADMIN`, `OFICINA`, `ARMAZEM`, `GESTAO`, `CLIENTE_INTERNO`, `PAINEL` (utilizador técnico só para o ecrã de TV).

Permissões por módulo × operação: `view | create | edit | delete | approve | admin`. Implementa em `/lib/rbac.ts` uma matriz declarativa e um `guard()` usado em todas as Server Actions e Route Handlers. `CLIENTE_INTERNO` nunca vê custos, fornecedores ou dados de auditoria. Documenta a matriz em `docs/RBAC.md`.

---

## 5. Modelo de dados (mínimo obrigatório)

Entidades e campos essenciais — completa com o que for necessário, mantendo estes nomes:

- `User` (name, email, passwordHash, role, active, lastLoginAt)
- `Asset` — o equipamento. Campos herdados do Log de Avarias: `assetCode` (único), `description`, `brand`, `model`, `serialNumber`, `entryDate`, `diagnosis`; mais `location`, `responsibleId`, `status` (estado do equipamento), `family`, `photos[]`, `documents[]`, `scrappedAt`.
- `MaintenancePlan` (assetId ou family, type: PREVENTIVA|CORRECTIVA|INSPECCAO, periodicityDays, nextDueAt, active)
- `WorkOrder` (number sequencial `OT-AAAA-NNNN`, assetId, origin: AVARIA|PLANO|MANUAL, priority: CRITICA|ALTA|MEDIA|BAIXA, status, assignedToId, openedAt, dueAt, closedAt, summary)
- `Intervention` (workOrderId, technicianId, startedAt, endedAt, diagnosis, activities, result: CONCLUIDA|PENDENTE|REQUER_NOVA, laborMinutes)
- `StateTransition` (entityType, entityId, fromState, toState, reason, userId, at) — histórico de estados
- `Quarantine` (assetId, enteredAt, technicalOpinion, decision: REPARAR|REAPROVEITAR|TRANSFERIR|ABATER, decidedAt, decidedById)
- `Item` — artigo do armazém (`sku` único, description, brand, unit, minStock, maxStock, avgCost, barcode, active)
- `Location` (warehouse, aisle, shelf, position; código único ex. `A1-C02-P03-05`)
- `Supplier` (name, nif, contact, phone, email, leadTimeDays)
- `PurchaseOrder` + `PurchaseOrderLine` (supplierId, status: RASCUNHO|ENVIADA|PARCIAL|RECEBIDA|CANCELADA, itemId, qtyOrdered, qtyReceived, unitPrice)
- `Receipt` + `ReceiptLine` (recepção e conferência contra a encomenda)
- `Requisition` + `RequisitionLine` (workOrderId obrigatório, status: PENDENTE|RESERVADA|AGUARDA_MATERIAL|ENTREGUE|DEVOLVIDA|CANCELADA)
- `StockMovement` (itemId, locationId, type: ENTRADA|SAIDA|RESERVA|DEVOLUCAO|TRANSFERENCIA|AJUSTE|INVENTARIO, qty, unitCost, refType, refId, userId, at) — **imutável**
- `StockBalance` (itemId, locationId, qty) — mantido por trigger/serviço a partir dos movimentos
- `InventoryCount` + `InventoryCountLine`
- `Notification` (userId, channel: APP|EMAIL, event, payload, sentAt, readAt)
- `AuditLog` (userId, at, action, module, entityType, entityId, before JSON, after JSON, ip) — **append-only; sem UPDATE/DELETE** (protege com trigger PostgreSQL)

Regras: custo médio ponderado (CMP) recalculado a cada ENTRADA; saídas valorizadas ao CMP corrente; `StockBalance` nunca negativo; toda a escrita de negócio gera `AuditLog`.

---

## 6. Máquina de estados (obrigatória, em `/lib/state-machine.ts`)

**Equipamento (Asset):** `EM_OPERACAO → EM_MANUTENCAO → (INDISPONIVEL | FORA_DE_SERVICO) → EM_OPERACAO`; `FORA_DE_SERVICO → QUARENTENA → (EM_OPERACAO | ABATIDO)`.

**Ordem de Trabalho / Intervenção:**
`ABERTA → EM_CURSO → EM_DIAGNOSTICO → EM_REPARACAO → AGUARDA_MATERIAL ⇄ EM_REPARACAO → EM_INSPECCAO → RESOLVIDA`; `PENDENTE` e `CANCELADA` acessíveis a partir de qualquer estado não terminal. `RESOLVIDA` e `CANCELADA` são terminais.

- Cada transição tem: estados permitidos, perfis autorizados, motivo obrigatório (para CANCELADA, PENDENTE e AGUARDA_MATERIAL) e efeitos colaterais (ex.: `RESOLVIDA` fecha a OT, devolve o Asset a `EM_OPERACAO`, e liberta reservas de stock não consumidas).
- **Integração com o armazém:** uma `Requisition` sem stock suficiente coloca a OT em `AGUARDA_MATERIAL` automaticamente; a recepção do material (ou a entrega da requisição) reabre `EM_REPARACAO` e notifica o técnico.
- Testa exaustivamente a máquina de estados com Vitest (tabela de transições válidas/inválidas).

---

## 7. Módulos a construir (13) e critérios de aceitação

| # | Módulo | Critério de aceitação mínimo |
|---|---|---|
| 5.1 | Portal Web | Login, página inicial por perfil, pesquisa global (asset, marca, modelo, n.º série, OT, SKU), import/export CSV·XLSX·PDF |
| 5.2 | Gestão de Equipamentos | CRUD Asset, fotos/documentos, "dias em aberto", equipamento mais antigo na Oficina, histórico completo |
| 5.3 | Gestão de Manutenção | Planos por asset/família, geração automática de OT, lista de manutenções previstas/feitas/em atraso |
| 5.4 | Ordens de Trabalho | Criação manual/automática, prioridade, responsável, materiais, indicadores (abertas, concluídas, atrasadas, tempos médios) |
| 5.5 | Intervenções | Várias por OT; diagnóstico, actividades, materiais, tempos, resultado |
| 5.6 | Gestão de Estados | Máquina de estados da secção 6, com histórico e motivos |
| 5.7 | Quarentena e Sucata | Entrada, parecer, decisão, alerta para casos sem decisão > N dias (configurável) |
| 5.8 | Gestão de Peças | Sub-módulos: Gestão de Stocks · Compras e Fornecedores · Recepção e Conferência · Requisições e Picking · Inventário e Localizações; CMP em AOA; alertas de stock mínimo; etiquetas com código de barras; custo por Asset/OT |
| 5.9 | Painel de Monitorização (TV) | Rota `/painel` sem chrome, auto-refresh (SSE ou polling 15 s), só estados não resolvidos, cores por estado/prioridade, rotação de páginas, botão discreto "Ver disponíveis" |
| 5.10 | Dashboard Executivo | Equipamentos em intervenção, evolução do backlog, OT abertas/concluídas, manutenções em atraso, tempo médio de resolução, valor do stock, custo de peças por asset; filtros por período |
| 5.11 | Dashboard Operacional | Equipamentos por estado, OT em atraso, manutenções vencidas, artigos abaixo do mínimo, listas accionáveis |
| 5.12 | Controlo de Acesso | Gestão de utilizadores, perfis, permissões, sessões, activação/desactivação |
| 5.13 | Auditoria | Consulta filtrável do `AuditLog`; exportação; prova de imutabilidade |

Transversal: **Notificações por e-mail** configuráveis por evento e perfil — novo equipamento, mudança de estado, dias em aberto acima do limite, stock mínimo, OT em atraso, resumo diário/semanal para a Gestão.

---

## 8. Migração dos ficheiros Excel

Cria `scripts/migrate-log-avarias.ts` e `scripts/migrate-pecas.ts`:

- Lêem XLSX (colunas do Log de Avarias: Asset, Descrição, Marca, Modelo, N.º de Série, Data de Entrada, Diagnóstico, Estado); mapeiam estados antigos para a máquina de estados; criam Assets e uma OT histórica por linha.
- Modo `--dry-run` que produz `docs/migration-report.md` com: linhas lidas, criadas, rejeitadas e motivos (duplicados, datas inválidas, estados desconhecidos).
- Idempotentes (re-executar não duplica).
- Para peças: artigos, existências iniciais (como `StockMovement` tipo INVENTARIO) e localizações.

---

## 9. Requisitos não funcionais

- **Segurança:** HTTPS obrigatório em produção; cabeçalhos de segurança; rate limiting no login; senhas ≥ 10 caracteres; sessão expira por inactividade (configurável); segredos só em `.env`; campos sensíveis cifrados em repouso quando aplicável.
- **Desempenho:** consultas correntes < 2 s com 10 000 assets, 100 000 OT e 500 000 movimentos — cria índices e valida com dados de carga gerados pelo seed.
- **Fiabilidade:** `docker compose` com `postgres` + volume; script `scripts/backup.sh` (pg_dump diário, retenção 30 dias) e `scripts/restore.sh` testado; health check `/api/health`.
- **Usabilidade:** Chrome, Firefox, Edge, Safari; layout optimizado para 1920×1080 (TV) e 1366×768; mensagens de erro em Português claro.
- **Observabilidade:** logs estruturados (pino) com requestId; métricas básicas em `/api/metrics`.

---

## 10. Plano de execução (segue esta ordem)

**Fase 0 — Fundações (dia 1)**
Repositório, Docker Compose, Next.js + Tailwind + shadcn, Prisma com schema completo da secção 5, seed com utilizadores por perfil e dados de demonstração realistas (equipamentos industriais de Angola: empilhadores, geradores, compressores, viaturas), Auth.js, RBAC, `AuditLog` com trigger de imutabilidade, layout base por perfil, `docs/ARCHITECTURE.md` e `docs/DATA_MODEL.md`.

**MVP 1 — Substitui o Log de Avarias (semana 1–2)**
Portal Web, Gestão de Equipamentos, Gestão de Estados, Painel de Monitorização (TV), migração do Log de Avarias em dry-run. Entrega: o painel funciona na Oficina com os dados migrados.

**MVP 2 — Trabalho da Oficina (semana 3–4)**
Ordens de Trabalho, Intervenções, Notificações por e-mail (eventos de OT e estado), pesquisa global, exportações.

**MVP 3 — Manutenção e Armazém (semana 4–5)**
Gestão de Manutenção, Gestão de Peças (cinco sub-módulos), Quarentena e Sucata, integração OT ⇄ Requisição ⇄ AGUARDA_MATERIAL, migração das folhas de peças, etiquetas com código de barras.

**MVP 4 — Gestão e Controlo (semana 5–6)**
Dashboard Executivo, Dashboard Operacional, Controlo de Acesso completo, consulta de Auditoria, resumo diário/semanal por e-mail, testes E2E de ponta a ponta, `docs/RUNBOOK.md` (instalação, backup, restauro, actualização), Dockerfile de produção e configuração NGINX.

Em cada MVP: testes unitários dos serviços, pelo menos um teste E2E do fluxo principal, e um ficheiro `docs/MVP-N-DEMO.md` com o guião de demonstração ao cliente.

---

## 11. Definição de "pronto" (Definition of Done)

Uma tarefa só está pronta quando: (a) o código compila sem erros de tipo; (b) lint sem avisos; (c) testes passam; (d) a UI está em Português pré-AO90 sem termos em inglês visíveis; (e) toda a escrita gera auditoria; (f) as permissões foram verificadas para os seis perfis; (g) a documentação relevante em `/docs` foi actualizada; (h) fizeste commit com mensagem semântica.

---

## 12. Primeira acção

Começa pela **Fase 0**. Antes de escrever código, apresenta-me em menos de 40 linhas: a lista de ficheiros que vais criar, o `schema.prisma` resumido (entidades e relações) e as três decisões técnicas que consideras mais arriscadas. Espera a minha confirmação e só depois executa.