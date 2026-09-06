# Pressupostos do Projecto — DMA Vision

Documento vivo. Adiciona-se um presuposto cada vez que há ambiguidade ou quando uma decisão arquitetural não está coberida pelos requisitos.

---

## 1. Utilizadores e Autenticação

### 1.1 — Sem autenticação multi-factor (MFA)
**Presuposto:** A primeira versão não implementa autenticação multi-factor.

**Razão:** Requisitos não mencionam MFA. Pode adicionar-se em fase posterior se cliente pedir.

**Impacto:** Segurança reduzida para contas sensíveis (ADMIN, GESTAO). Compensado por rate limiting no login e cabeçalhos de segurança.

**Decisão:** Documentar em RUNBOOK como adicionar MFA com Auth.js later.

---

### 1.2 — Sessão JWT sem servidor (stateless)
**Presuposto:** Sessões são JWT puras, não guardadas no servidor.

**Razão:** Escalabilidade. Não precisa de Redis ou session store.

**Risco:** Impossível revogar token instantaneamente antes de expiração (default 24h).

**Mitigação:** Expiração curta (24h) + updateAge de 1h força refresh regular.

**Alternativa futura:** Se precisar revogação instantânea, migrar para session store (Redis).

---

### 1.3 — Passwords ≥ 10 caracteres
**Presuposto:** Comprimento mínimo de palavra-passe é 10.

**Razão:** Acima do OWASP common 8-char, adequado para sistemas críticos.

**Validação:** Implementada em seed (Admin@2026 tem 10).

---

## 2. Base de Dados

### 2.1 — PostgreSQL único (sem replicação fase 0)
**Presuposto:** Uma única instância PostgreSQL 16 (dev/prod).

**Razão:** Requisitos não mencionam HA. Replicação/failover pode adicionar-se na fase 4.

**Risco:** Single point of failure.

**Mitigação:** Backups diários (pg_dump), testados mensalmente.

---

### 2.2 — Auditoria via Trigger (append-only)
**Presuposto:** AuditLog é protegido por trigger PostgreSQL (sem UPDATE/DELETE).

**Razão:** Integridade imutável da auditoria.

**Implementação:** Trigger rejeita qualquer UPDATE/DELETE na tabela AuditLog.

**Risco:** Se trigger tiver bug, não é fácil corrigi-lo sem downtime.

**Mitigação:** Extenso teste unitário do trigger antes de deploy.

---

### 2.3 — CMP (Custo Médio Ponderado) recalculado a cada ENTRADA
**Presuposto:** StockMovement tipo ENTRADA recalcula Item.avgCost imediatamente.

**Razão:** Método contábil standard, requisitado em CLAUDE.md.

**Fórmula:**
```
novo_CMP = (stock_atual * CMP_atual + qtd_entrada * preco_entrada) / (stock_atual + qtd_entrada)
```

**Implementação:** Serviço ou trigger PostgreSQL.

---

### 2.4 — StockBalance nunca negativo
**Presuposto:** Requisição de peças sem stock suficiente **não** cria StockMovement negativo.

**Razão:** Integridade física (não se pode tirar mais do que existe).

**Implementação:** Validação em aplicação (Zod) + constraint BD.

---

### 2.5 — Sem migrações versionadas até à data; relações em falta resolvidas em serviço
**Pressuposto:** A BD de desenvolvimento foi criada com `prisma db push`; não existe a pasta `prisma/migrations`. `ReceiptLine` e `Receipt` não têm relações Prisma para `Item`/`PurchaseOrder` (apenas as colunas `itemId`/`purchaseOrderId`).

**Razão:** Adicionar as relações exige alterar o schema e, pela regra "uma fonte de verdade", uma migração versionada — o que implica primeiro criar a baseline de migrações.

**Decisão provisória:** `modules/receipts/services.ts` resolve os artigos das linhas por `itemId` numa única consulta (`attachItems`). Sem alteração ao schema.

**Acção pendente (arquitecto/cliente):** inicializar migrações (`prisma migrate dev --name baseline`) e adicionar as relações `ReceiptLine.item` e `Receipt.purchaseOrder`.

---

## 3. Equipamentos e Manutenção

### 3.1 — Asset.assetCode é obrigatório e único
**Presuposto:** Cada equipamento tem código único (ex: EMPI-001, GERA-001).

**Razão:** Requisito de negócio (identificação física).

**Formato:** Livre, mas recomenda-se prefixo por família + número (ex: EMPI, GERA, COMP, VIAT, BOMB).

---

### 3.2 — WorkOrder.number sequencial (OT-AAAA-NNNN)
**Presuposto:** Número é gerado automático: OT-[ano]-[contador 4 dígitos].

**Razão:** Rastreabilidade e clareza para o cliente.

**Implementação:** Serviço em `modules/workorders/services.ts` com lock/transaction.

---

### 3.3 — Múltiplas intervenções por WorkOrder
**Presuposto:** Uma OT pode ter 1 ou mais Interventions (ex: reparação parcial → inspeccão → reparação completa).

**Razão:** Realismo operacional.

**Regra:** Última Intervention com status CONCLUIDA fecha a OT.

---

### 3.4 — MaintenancePlan pode ser por Asset ou Família
**Presuposto:** Um plano pode visar um Asset específico (assetId) ou uma Família (ex: "Geradores").

**Razão:** Flexibilidade. Permite planos genéricos aplicáveis a categorias.

**Implementação:** (assetId XOR family) — um dos dois obrigatório, não ambos.

---

### 3.5 — Decisão de quarentena mapeia para os estados permitidos pela máquina
**Pressuposto:** A máquina de estados só permite `QUARENTENA → EM_OPERACAO | ABATIDO`. Assim: `ABATER → ABATIDO` (regista `scrappedAt`); `REPARAR`, `REAPROVEITAR` e `TRANSFERIR → EM_OPERACAO`.

**Razão:** Respeitar a secção 6 do CLAUDE.md sem inventar transições novas. Para `REPARAR`, a OT subsequente leva o equipamento a `EM_MANUTENCAO`.

**Implementação:** `decideQuarantine` passa por `transitionAssetState` (valida perfil, regista `StateTransition` com motivo "Decisão de quarentena: X"). A entrada em quarentena exige o equipamento em `FORA_DE_SERVICO`.

---

## 4. Ordens de Trabalho e Requisições

### 4.1 — WorkOrder obrigatória para cada Requisition
**Presuposto:** Uma Requisition **sempre** referencia uma WorkOrder.

**Razão:** Rastreabilidade: peça-para-quê / equipamento-qual.

**Validação:** Foreign key NOT NULL em Prisma.

---

### 4.2 — Falta de stock coloca WorkOrder em AGUARDA_MATERIAL automaticamente
**Presuposto:** Se requisição tem qtd_requested > qtd_available, transição automática.

**Razão:** Fluxo realista: técnico pede peça, se não há, OT fica suspensa.

**Implementação:** Serviço no momento de criar/processar Requisition.

---

### 4.3 — Recepção de material re-abre EM_REPARACAO
**Presuposto:** Quando Requisition.status → ENTREGUE, WorkOrder.status automaticamente muda de AGUARDA_MATERIAL → EM_REPARACAO.

**Razão:** Workflow fluido.

**Notificação:** Email/APP ao técnico: "Material disponível para OT-2026-0001".

---

### 4.4 — Transições automáticas por requisição respeitam a máquina de estados
**Pressuposto:** `AGUARDA_MATERIAL` só é alcançável a partir de `EM_REPARACAO`, e o regresso a `EM_REPARACAO` só a partir de `AGUARDA_MATERIAL`. Se a OT estiver noutro estado quando a requisição é criada ou entregue, a requisição muda de estado mas a OT mantém-se.

**Razão:** Não contornar `transitionWorkOrderState` (perfis, motivo obrigatório, histórico). O CLAUDE.md não define o comportamento para requisições em OT fora de `EM_REPARACAO`.

**Acção pendente (cliente):** confirmar se se deve impedir requisições quando a OT não está `EM_REPARACAO`.

---

### 4.5 — Qualificações de técnico são etiquetas livres, sem certificação/validade
**Presuposto:** `User.qualifications` e `WorkOrder.requiredQualifications` são listas de texto livre (ex.: "Hidráulica", "Electricidade"), comparadas de forma insensível a maiúsculas. Não há modelo de certificação com data de validade — isso é uma funcionalidade maior (skills matrix / certificações), fora deste âmbito.

**Razão:** Cobre o essencial pedido (bloquear atribuição a um técnico sem a qualificação necessária) sem introduzir um módulo novo de certificações não solicitado.

**Implementação:** `getQualificationGap()` em `modules/scheduling/services.ts`. Atribuir um técnico sem a qualificação exige confirmação explícita (`force: true`) — nunca é bloqueado de forma definitiva, porque uma emergência pode justificar a excepção.

---

### 4.6 — Semana-padrão de 40h para cálculo de utilização
**Presuposto:** Sem indicação do cliente sobre o horário de trabalho real, `modules/technicians/workload.ts` assume uma semana-padrão de 5 dias × 8h (40h) apenas para comparação de utilização (não para folha de pagamento). Horas trabalhadas vêm de `Intervention.laborMinutes` já registado no relógio de ponto por intervenção — não existe um relógio de turno separado.

**Razão:** Não há campo de horário/turno no schema nem foi fornecido pelo cliente. 40h/semana é o padrão mais comum e serve de referência até se confirmar o horário real da Kwanda.

**Decisão:** Provisório — ajustar `STANDARD_SHIFT_HOURS`/`WEEKLY_TARGET_HOURS` se o cliente indicar um horário diferente.

---

## 5. Peças e Stock

### 5.1 — StockMovement é imutável (append-only)
**Presuposto:** Uma vez criado, StockMovement não pode ser editado/deletado (apenas ADMIN em casos raros).

**Razão:** Auditoria do histórico de stock.

**Implementação:** Sem campos UPDATE em aplicação. Apenas INSERT/SELECT.

---

### 5.2 — Location.code é estruturado mas flexível
**Presuposto:** Código de localização é livre (ex: A1-C02-P03-05) mas indexado para pesquisa rápida.

**Razão:** Suporte a sistemas de endereçamento variados (cliente pode usar outra estrutura).

**Validação:** Única ao nível do BD.

---

### 5.3 — Item.barcode é opcional
**Presuposto:** Nem todos os artigos têm código de barras gerado (alguns podem ser manuais).

**Razão:** Flexibilidade. Código gerado by `bwip-js` se fornecido.

---

### 5.4 — CMP calculado per-Item globalmente, não per-Location
**Presuposto:** Item.avgCost é global (todas as localizações). StockBalance.qty + StockBalance.qty (outras locs) = total global.

**Razão:** Simplificação. Custo médio é atributo do Item, não da localização.

---

### 5.5 — Optimização de stock: limiares e fórmula de reposição
**Presuposto:** Sem indicação do cliente sobre nível de serviço desejado ou custo de posse (%), a optimização de stock (`modules/inventory/optimization.ts`) usa:
- Rotação lenta: sem saída (SAIDA) há mais de 90 dias.
- Stock morto: sem saída há mais de 180 dias.
- Consumo médio diário: soma das saídas dos últimos 90 dias ÷ 90.
- Prazo de entrega: `Supplier.leadTimeDays` da encomenda mais recente do artigo (mesma heurística do rascunho automático de PO em `draftPurchaseOrdersForShortfall`); sem histórico de compra, não há recomendação.
- Ponto de encomenda recomendado = consumo médio diário × (prazo de entrega + 7 dias de segurança).
- Stock máximo recomendado = ponto de encomenda + consumo médio diário × prazo de entrega.

**Razão:** Não foi fornecida taxa de custo de posse nem custo por encomenda, pelo que não se implementa EOQ clássico (evita inventar percentagens financeiras não confirmadas pelo cliente). A fórmula usada é transparente e auditável a partir de dados reais (StockMovement).

**Decisão:** Provisório — ajustar os 7 dias de segurança e os limiares de 90/180 dias se o cliente indicar valores próprios.

---

## 6. Estados e Transições

### 6.1 — StateTransition.reason obrigatória para certos estados
**Presuposto:** Transições para CANCELADA, PENDENTE, AGUARDA_MATERIAL requerem motivo textual.

**Razão:** Auditoria/rastreabilidade.

**Implementação:** Validação em `canTransition()`.

---

### 6.2 — Estados terminais são irreversíveis
**Presuposto:** Asset.ABATIDO e WorkOrder.RESOLVIDA/CANCELADA não podem transitar para outro estado.

**Razão:** Integridade de dados.

**Implementação:** Array vazio em ASSET_TRANSITIONS[ABATIDO].

---

### 6.3 — Asset volta a EM_OPERACAO quando WorkOrder.RESOLVIDA
**Presuposto:** Side effect: WorkOrder.status → RESOLVIDA dispara Asset.status → EM_OPERACAO.

**Razão:** Fluxo natural: reparação concluída = equipamento pronto.

**Risco:** Se two WorkOrders estão abertas no mesmo Asset, segunda também reativa. **Pressuposição:** Apenas uma OT aberta por Asset por vez (validar em criação).

---

## 7. Notificações

### 7.1 — Notificações Email via Nodemailer, APP via Notification model
**Presuposto:** Dois canais: EMAIL (Nodemailer SMTP) e APP (registro na tabela Notification).

**Razão:** Flexibilidade. Cliente escolhe canal por evento.

**Implementação:** Worker cron dispara notificações agendadas.

---

### 7.2 — Templates Email com React Email
**Presuposto:** Emails são renderizados com React Email (componentes React → HTML).

**Razão:** Maintainability. Componentes reutilizáveis.

**Setup:** Pasta `/components/email/` para templates.

---

## 8. Importação/Exportação (Excel)

### 8.1 — Scripts de migração são idempotentes
**Presuposto:** `npm run migrate:avarias --dry-run` pode executar múltiplas vezes sem duplicar.

**Razão:** Segurança. Cliente pode treinar com arquivo velho.

**Implementação:** Verificar assetCode antes de INSERT.

---

### 8.2 — Mapeamento de estados antigos → novos
**Presuposto:** Log de Avarias antigo tem estados textuais (ex: "Em reparação", "Fora de serviço") que mapeiam para enumeração nova.

**Razão:** Migração.

**Tabela de mapeamento:** Em `scripts/migrate-log-avarias.ts`.

**Fallback:** Estados desconhecidos geram erro em modo normal, pulam em --dry-run.

---

### 8.3 — Migração real "Kwanda_Log de avarias na oficina.xlsx" (04/09/2026)
**Pressuposto:** A coluna "Status" do Excel (Resolvido/Em curso/Cancelado/Pendente) regista o estado da **reparação** (WorkOrder), não o estado operacional do **equipamento** (Asset) — o ficheiro não tem coluna própria para este último.

**Decisões tomadas:**
- **`WorkOrder.status`** — mapeado 1:1 da coluna Status: Resolvido→RESOLVIDA, Em curso→EM_CURSO, Cancelado→CANCELADA, Pendente→PENDENTE.
- **`WorkOrder.priority`** — sem dados de origem; todas as OT históricas migradas recebem `MEDIA` por defeito.
- **`Asset.status`** — derivado da entrada **mais recente** desse equipamento no log: `EM_MANUTENCAO` se a última reparação está "Em curso" ou "Pendente"; `EM_OPERACAO` nos restantes casos (incluindo "Cancelado" — assume-se que a reparação cancelada não impede o equipamento de voltar ao serviço).
- **`Asset.entryDate` / `Asset.diagnosis`** — `entryDate` usa a primeira ocorrência do equipamento (mais antiga); `diagnosis` usa o texto da ocorrência mais recente.
- **Numeração de OT histórica** — sequencial `OT-<ano>-NNNN` por ano de `openedAt` (não pelo ano corrente), para preservar ordem cronológica das 174 ordens migradas.

**Resultado (execução real):** 174 linhas lidas → 87 equipamentos criados, 174 ordens de trabalho criadas, 0 rejeitadas. Reexecução confirmada idempotente (0 duplicados).

**Acção pendente (cliente):** confirmar se a assunção "Cancelado → equipamento continua EM_OPERACAO" está correcta, ou se deve haver uma revisão manual desses casos específicos.

---

## 9. Segurança

### 9.1 — HTTPS obrigatório em produção
**Presuposto:** Variável de ambiente força HTTPS em prod. Dev permite HTTP.

**Razão:** Segurança em transit.

**Implementação:** Next.js headers + NGINX reverse proxy.

---

### 9.2 — Rate limiting no login (5 tentativas / 15 min)
**Presuposto:** Limite configurable no NextAuth (env var).

**Razão:** Prevenção de brute force.

---

### 9.3 — Campos sensíveis **nunca** são expostos a CLIENTE_INTERNO
**Presuposto:** Qualquer query que inclua custos, fornecedores, preços é filtrada.

**Razão:** Requisito de negócio.

**Implementação:** Prisma `select` ou `omit` explícito. Nunca confiar em middleware apenas.

---

## 10. Infra e Deploy

### 10.1 — Docker Compose para dev, Dockerfile multi-stage para prod
**Presuposto:** Dev usa docker-compose.yml (app, postgres, mailhog, worker). Prod usa Dockerfile single + environment.

**Razão:** Velocidade dev. Simplificar prod.

---

### 10.2 — PM2 ou container em VPS Ubuntu 24
**Presuposto:** Production roda em VPS Ubuntu 24 com Node 20, PostgreSQL 16 externo ou interno.

**Razão:** Flexibilidade. Cliente escolhe PM2 (simples) ou Kubernetes (complexo, fora de âmbito).

---

### 10.3 — Backups diários com retenção 30 dias
**Presuposto:** Script `scripts/backup.sh` executa `pg_dump` diário, guarda em `/backups` com nome `dump-$(date +%Y%m%d).sql`.

**Razão:** Disaster recovery.

**Automação:** Cron job em Ubuntu: `0 2 * * * /home/dma/backup.sh`.

---

## 11. Funcionalidades Futuras (Out of Scope — Fase 5+)

### 11.1 — Integração com ERP
**Presuposto:** Pontos de extensão documentados em `docs/INTEGRATION.md`. Implementação deixa-se para fase 5.

**Razão:** Fora de âmbito MVP 1-4.

### 11.2 — BI / Relatórios Avançados
**Presuposto:** Dashboards MVP 4 são básicos. BI avançada deixa-se para fase 5.

### 11.3 — Mobile app nativa (iOS/Android)
**Presuposto:** Apenas web (responsive). App nativa fora de âmbito.

---

## Changelog de Pressupostos

| Data | Presuposto | Decisão |
|---|---|---|
| 2026-09-02 | Autenticação stateless JWT | Aprovado |
| 2026-09-02 | AuditLog via Trigger PostgreSQL | Aprovado |
| 2026-09-02 | CMP global por Item | Aprovado |
| 2026-09-03 | Relações ReceiptLine/Receipt resolvidas em serviço (sem migração) | Provisório |
| 2026-09-03 | Quarentena: REPARAR/REAPROVEITAR/TRANSFERIR → EM_OPERACAO; ABATER → ABATIDO | Assumido |
| 2026-09-03 | Requisições só alteram a OT quando a transição é válida | Assumido — a confirmar |
| 2026-09-04 | Migração real do log de avarias: Status Excel → WorkOrder.status; Asset.status derivado da entrada mais recente; prioridade MEDIA por defeito | Executado — 87 equipamentos, 174 OT |
| 2026-09-06 | Optimização de stock: 90/180 dias para rotação lenta/morta, 7 dias de buffer de segurança, sem EOQ clássico (falta taxa de custo de posse) | Provisório — a confirmar |
