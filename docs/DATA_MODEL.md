# Modelo de Dados — DMA Vision

Todas as tabelas estão definidas em `/prisma/schema.prisma` (single source of truth). Migrações versionadas em `/prisma/migrations/`.

## Núcleo de Utilizadores

### User
Utilizador do sistema com autenticação e autorização.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| name | String | Nome completo |
| email | String (unique) | Email único, username para login |
| passwordHash | String | Bcryptjs hash |
| role | UserRole enum | ADMIN \| OFICINA \| ARMAZEM \| GESTAO \| CLIENTE_INTERNO \| PAINEL |
| active | Boolean | Ativo/Desactivo |
| lastLoginAt | DateTime? | Último acesso |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** email, role
**Relações:** WorkOrder.assignedTo, Intervention.technician, StateTransition.user, AuditLog.user, StockMovement.user

---

## Núcleo de Equipamentos

### Asset
Equipamento a ser mantido. Herda campos do Log de Avarias antigo.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| assetCode | String (unique) | Código único (ex: EMPI-001, GERA-001) |
| description | String | Descrição (ex: "Empilhador Frontal Toyota 3.0T") |
| brand | String? | Marca |
| model | String? | Modelo |
| serialNumber | String? | Número de série |
| entryDate | DateTime | Data de entrada no sistema |
| diagnosis | String? | Diagnóstico textual |
| location | String? | Localização física |
| responsibleId | String (FK)? | Responsável (User) |
| status | AssetStatus enum | EM_OPERACAO \| EM_MANUTENCAO \| INDISPONIVEL \| FORA_DE_SERVICO \| QUARENTENA \| ABATIDO |
| family | String? | Família (ex: Empilhadores, Geradores) |
| scrappedAt | DateTime? | Data de abate |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** status, family, assetCode
**Relações:** WorkOrder[], Intervention[], StateTransition[], MaintenancePlan[], Quarantine[]

### MaintenancePlan
Plano de manutenção (preventiva/correctiva/inspecção).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| assetId | String (FK)? | Asset (se específico) |
| family | String? | Família de assets (se genérico) |
| type | MaintenanceType | PREVENTIVA \| CORRECTIVA \| INSPECCAO |
| periodicityDays | Int | Periodicidade em dias |
| nextDueAt | DateTime | Próxima data de execução |
| active | Boolean | Plano activo? |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** assetId, nextDueAt

---

## Ordens de Trabalho e Intervenções

### WorkOrder
Ordem de trabalho / Ticket de manutenção.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| number | String (unique) | Número sequencial (OT-AAAA-NNNN) |
| assetId | String (FK) | Asset a manter |
| origin | WorkOrderOrigin | AVARIA \| PLANO \| MANUAL |
| priority | WorkOrderPriority | CRITICA \| ALTA \| MEDIA \| BAIXA |
| status | WorkOrderStatus | Máquina de estados (ver secção 6) |
| assignedToId | String (FK)? | Técnico responsável |
| openedAt | DateTime | Data de abertura |
| dueAt | DateTime? | Data de conclusão esperada |
| closedAt | DateTime? | Data de conclusão real |
| summary | String | Descrição breve do problema |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** assetId, status, priority, assignedToId
**Relações:** Asset, User (assignedTo), Intervention[], StateTransition[], Requisition[]

### Intervention
Intervenção técnica associada a uma WorkOrder.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| workOrderId | String (FK) | WorkOrder |
| technicianId | String (FK) | Técnico executor (User) |
| startedAt | DateTime? | Hora de início |
| endedAt | DateTime? | Hora de fim |
| diagnosis | String? | Diagnóstico (causa raiz) |
| activities | String? | Atividades realizadas |
| result | InterventionResult? | CONCLUIDA \| PENDENTE \| REQUER_NOVA |
| laborMinutes | Int? | Minutos de trabalho |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** workOrderId, technicianId
**Relações:** WorkOrder, User (technician)

---

## Estado e Transições

### StateTransition
Histórico imutável de transições de estado.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| entityType | String | "asset" ou "workorder" |
| entityId | String | ID do asset ou workorder |
| fromState | String | Estado anterior |
| toState | String | Estado novo |
| reason | String? | Motivo (obrigatório para alguns) |
| userId | String (FK) | User que fez a transição |
| createdAt | DateTime | Timestamp (imutável) |

**Índices:** (entityType, entityId), userId, createdAt
**Relações:** User

### Quarantine
Equipamento em quarentena (fora de operação, aguardando decisão).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| assetId | String (FK) | Asset em quarentena |
| enteredAt | DateTime | Data de entrada |
| technicalOpinion | String? | Parecer técnico |
| decision | QuarantineDecision? | REPARAR \| REAPROVEITAR \| TRANSFERIR \| ABATER |
| decidedAt | DateTime? | Data da decisão |
| decidedById | String (FK)? | Utilizador que decidiu |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** assetId, decision
**Relações:** Asset

---

## Gestão de Peças

### Item
Artigo/SKU do armazém de peças.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| sku | String (unique) | Código único (ex: CORRENTE-001) |
| description | String | Descrição |
| brand | String? | Marca do fornecedor |
| unit | String | Unidade (UN, L, KG, ...) |
| minStock | Int | Quantidade mínima |
| maxStock | Int | Quantidade máxima |
| avgCost | Decimal (14,2) | Custo médio ponderado (CMP) em AOA |
| barcode | String? | Código de barras |
| active | Boolean | Artigo activo? |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** sku, barcode
**Relações:** StockBalance[], StockMovement[], PurchaseOrderLine[], RequisitionLine[]

### Location
Localização no armazém (estrutura de endereçamento).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| code | String (unique) | Código único (ex: A1-C02-P03-05) |
| warehouse | String | Armazém (ex: "Armazém A") |
| aisle | String? | Corredor (ex: "C02") |
| shelf | String? | Prateleira (ex: "P03") |
| position | String? | Posição (ex: "05") |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** code, warehouse
**Relações:** StockBalance[], StockMovement[]

### StockMovement
Movimento de stock (entrada, saída, reserva, etc.) — **IMUTÁVEL**.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| itemId | String (FK) | Item |
| locationId | String (FK) | Location |
| type | StockMovementType | ENTRADA \| SAIDA \| RESERVA \| DEVOLUCAO \| TRANSFERENCIA \| AJUSTE \| INVENTARIO |
| qty | Int | Quantidade (+ entrada, - saída) |
| unitCost | Decimal (14,2) | Custo unitário em AOA |
| refType | String? | Tipo de referência (ex: "requisition", "purchase") |
| refId | String? | ID da referência |
| userId | String (FK) | Utilizador que registou |
| createdAt | DateTime | Timestamp (imutável) |

**Índices:** itemId, locationId, type, createdAt
**Relações:** Item, Location, User

**Regra de Negócio:** Cada movimento ENTRADA recalcula avgCost (CMP) do Item. StockBalance é mantido por trigger ou serviço.

### StockBalance
Saldo de stock por item e localização — **DERIVADO de StockMovement**.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| itemId | String (FK) | Item |
| locationId | String (FK) | Location |
| qty | Int | Quantidade actual (≥ 0) |
| updatedAt | DateTime | Timestamp última atualização |

**Índice único:** (itemId, locationId)
**Relações:** Item, Location

**Regra de Negócio:** Nunca negativo. Atualizado por trigger PostgreSQL ou serviço.

### InventoryCount
Contagem física de stock.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| status | String | DRAFT \| COMPLETED |
| countedAt | DateTime? | Data da contagem |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Relações:** InventoryCountLine[]

### InventoryCountLine
Linha de contagem por item.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| inventoryCountId | String (FK) | InventoryCount |
| itemId | String | Item a contar |
| expectedQty | Int | Quantidade esperada (StockBalance) |
| countedQty | Int | Quantidade contada |
| createdAt | DateTime | Timestamp criação |

**Índices:** inventoryCountId, itemId

---

## Compras

### Supplier
Fornecedor de artigos.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| name | String | Nome do fornecedor |
| nif | String? | NIF |
| contact | String? | Nome de contacto |
| phone | String? | Telefone |
| email | String? | Email |
| leadTimeDays | Int | Dias de entrega (padrão: 7) |
| active | Boolean | Fornecedor activo? |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** nif
**Relações:** PurchaseOrder[]

### PurchaseOrder
Encomenda de compra.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| supplierId | String (FK) | Supplier |
| status | PurchaseOrderStatus | RASCUNHO \| ENVIADA \| PARCIAL \| RECEBIDA \| CANCELADA |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** supplierId, status
**Relações:** Supplier, PurchaseOrderLine[]

### PurchaseOrderLine
Linha de encomenda (artigo + quantidade + preço).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| purchaseOrderId | String (FK) | PurchaseOrder |
| itemId | String (FK) | Item |
| qtyOrdered | Int | Quantidade encomendada |
| qtyReceived | Int | Quantidade recebida |
| unitPrice | Decimal (14,2) | Preço unitário em AOA |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** purchaseOrderId, itemId

### Receipt
Recepção de encomenda (conferência).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| purchaseOrderId | String? | PurchaseOrder (se aplicável) |
| status | ReceiptStatus | PARCIAL \| RECEBIDA |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** purchaseOrderId
**Relações:** ReceiptLine[]

### ReceiptLine
Linha de recepção (item + quantidade recebida).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| receiptId | String (FK) | Receipt |
| itemId | String | Item |
| qtyReceived | Int | Quantidade recebida |
| createdAt | DateTime | Timestamp criação |

**Índices:** receiptId, itemId

---

## Requisições

### Requisition
Requisição de peças para uma WorkOrder.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| workOrderId | String (FK) | WorkOrder (obrigatório) |
| status | RequisitionStatus | PENDENTE \| RESERVADA \| AGUARDA_MATERIAL \| ENTREGUE \| DEVOLVIDA \| CANCELADA |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** workOrderId, status
**Relações:** WorkOrder, RequisitionLine[]

### RequisitionLine
Linha de requisição (item + quantidade).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| requisitionId | String (FK) | Requisition |
| itemId | String (FK) | Item |
| qtyRequested | Int | Quantidade solicitada |
| qtyReserved | Int | Quantidade reservada |
| qtyDelivered | Int | Quantidade entregue |
| createdAt | DateTime | Timestamp criação |
| updatedAt | DateTime | Timestamp atualização |

**Índices:** requisitionId, itemId
**Relações:** Requisition, Item

**Regra de Negócio:** Se qtyRequested > stock disponível, Requisition.status = AGUARDA_MATERIAL e WorkOrder.status = AGUARDA_MATERIAL.

---

## Notificações e Auditoria

### Notification
Notificação enviada a um utilizador.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| userId | String (FK) | Utilizador destinatário |
| channel | NotificationChannel | APP \| EMAIL |
| event | String | Tipo de evento (ex: "work_order_created") |
| payload | JSON | Dados do evento |
| sentAt | DateTime? | Data de envio |
| readAt | DateTime? | Data de leitura (APP only) |
| createdAt | DateTime | Timestamp criação |

**Índices:** userId, sentAt, readAt
**Relações:** User

### AuditLog
Log de auditoria imutável (append-only).

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (CUID) | PK |
| userId | String (FK) | Utilizador que fez a acção |
| action | String | CREATE \| UPDATE \| DELETE \| STATE_CHANGE |
| module | String | Módulo afectado (ex: "workorders", "items") |
| entityType | String | Tipo de entidade (ex: "workorder", "item") |
| entityId | String | ID da entidade |
| before | JSON? | Estado anterior |
| after | JSON? | Estado novo |
| ip | String? | Endereço IP |
| createdAt | DateTime | Timestamp (imutável) |

**Índices:** userId, entityType, createdAt
**Relações:** User

**Protecção:** Trigger PostgreSQL impede UPDATE/DELETE.

---

## Enumerações

```typescript
enum UserRole {
  ADMIN              // Administrador
  OFICINA            // Técnico de Oficina
  ARMAZEM            // Gestor de Armazém
  GESTAO             // Gestor DMA
  CLIENTE_INTERNO    // Cliente interno (read-only)
  PAINEL             // Painel TV
}

enum AssetStatus {
  EM_OPERACAO        // A funcionar normalmente
  EM_MANUTENCAO      // Em intervenção
  INDISPONIVEL       // Avariado, sem reparação imediata
  FORA_DE_SERVICO    // Retirado de operação
  QUARENTENA         // Aguardando decisão
  ABATIDO            // Descartado
}

enum WorkOrderStatus {
  ABERTA             // Criada, não iniciada
  EM_CURSO           // Técnico começou
  EM_DIAGNOSTICO     // Em diagnóstico
  EM_REPARACAO       // Em reparação
  AGUARDA_MATERIAL   // Aguardando stock
  EM_INSPECCAO       // Em inspeccção final
  RESOLVIDA          // Concluída com sucesso
  PENDENTE           // Suspensa
  CANCELADA          // Anulada
}

enum RequisitionStatus {
  PENDENTE           // Criada, não processada
  RESERVADA          // Stock reservado
  AGUARDA_MATERIAL   // Aguardando recepção
  ENTREGUE           // Artigos entregues ao técnico
  DEVOLVIDA          // Artigos devolvidos
  CANCELADA          // Anulada
}
```

---

## Triggers PostgreSQL (Segurança & Performance)

### AuditLog (Imutabilidade)
```sql
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION reject_update();
```

### StockBalance (Mantido por Trigger)
```sql
CREATE TRIGGER stock_balance_from_movement
AFTER INSERT ON "StockMovement"
FOR EACH ROW
EXECUTE FUNCTION update_stock_balance();
```

---

## Índices Críticos

| Tabela | Índices | Razão |
|---|---|---|
| Asset | status, family, assetCode | Filtros comuns, pesquisa |
| WorkOrder | assetId, status, priority, assignedToId | Estados, filtros |
| Item | sku, barcode | Pesquisa, leitura de código |
| StockMovement | itemId, locationId, type, createdAt | Histórico, analytics |
| StateTransition | (entityType, entityId), userId, createdAt | Auditoria |
| AuditLog | userId, entityType, createdAt | Consultas de auditoria |

---

## Relacionamentos Principais

```
User
  ├─ WorkOrder (assignedTo) [1:N]
  ├─ Intervention (technician) [1:N]
  ├─ StateTransition (user) [1:N]
  ├─ AuditLog (user) [1:N]
  ├─ StockMovement (user) [1:N]
  └─ Notification (user) [1:N]

Asset
  ├─ WorkOrder [1:N]
  ├─ Intervention (via WorkOrder) [1:N]
  ├─ MaintenancePlan [1:N]
  ├─ StateTransition [1:N]
  └─ Quarantine [1:N]

WorkOrder
  ├─ Intervention [1:N]
  ├─ Requisition [1:N]
  └─ StateTransition [1:N]

Item
  ├─ StockBalance [1:N]
  ├─ StockMovement [1:N]
  ├─ PurchaseOrderLine [1:N]
  └─ RequisitionLine [1:N]

Requisition
  ├─ RequisitionLine [1:N]
  └─ WorkOrder (FK)

PurchaseOrder
  ├─ PurchaseOrderLine [1:N]
  └─ Supplier (FK)
```

---

## Regras de Negócio (Integridade)

1. **Custo Médio Ponderado (CMP):** Recalculado a cada StockMovement tipo ENTRADA.
2. **StockBalance nunca negativo:** Validado em aplicação + BD.
3. **AuditLog append-only:** Trigger PostgreSQL bloqueia UPDATE/DELETE.
4. **WorkOrder → Requisition:** WorkOrderId obrigatório; falta de stock → AGUARDA_MATERIAL automático.
5. **Asset.status:** Mudanças apenas via StateTransition (máquina de estados).
6. **Quarantine decisão:** Obrigatória em 30 dias configuráveis (alerta diário).
7. **User.active:** Bloqueia login se false.
