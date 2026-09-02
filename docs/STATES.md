# Máquina de Estados — DMA Vision

Implementada em `/lib/state-machine.ts`. Testada em `/tests/state-machine.test.ts`.

## Estados de Equipamento (Asset)

```
                    ┌─────────────────┐
                    │   EM_OPERACAO   │
                    └────────┬────────┘
                             │
                             │ avaria detectada
                             ▼
                    ┌─────────────────┐
                    │  EM_MANUTENCAO  │
                    └────────┬────────┘
                    ┌────────┴────────┐
                    │                 │
           reparado │                 │ não reparável
                    ▼                 ▼
         ┌──────────────────┐  ┌──────────────┐
         │   EM_OPERACAO    │  │ INDISPONIVEL │
         └──────────────────┘  └──────┬───────┘
                                      │
                           transferência ou abate
                                      ▼
                    ┌─────────────────────────┐
                    │   FORA_DE_SERVICO       │
                    └────────────┬────────────┘
                                 │
                        decision point
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
       análise/reparação                    scrap/transfer
                │                                 │
                ▼                                 ▼
         ┌────────────┐                    ┌──────────┐
         │ QUARENTENA │                    │  ABATIDO │
         └──┬─────┬──┘                    └──────────┘
            │     │
    repar   │     │ reaproveitar/
            │     │ transferir/abater
            ▼     ▼
      ┌───────────────┐
      │  EM_OPERACAO  │  ou  ABATIDO
      └───────────────┘
```

### Estados

| Estado | Descrição | Próximos Válidos |
|---|---|---|
| EM_OPERACAO | A funcionar normalmente | EM_MANUTENCAO, FORA_DE_SERVICO |
| EM_MANUTENCAO | Em intervenção técnica | EM_OPERACAO, INDISPONIVEL |
| INDISPONIVEL | Avariado, sem reparação imediata | EM_OPERACAO, FORA_DE_SERVICO |
| FORA_DE_SERVICO | Retirado de operação | QUARENTENA, EM_OPERACAO |
| QUARENTENA | Aguardando parecer técnico e decisão | EM_OPERACAO, ABATIDO |
| ABATIDO | Descartado/transferido (terminal) | — |

### Transições Permitidas

```typescript
ASSET_TRANSITIONS = {
  EM_OPERACAO: [
    {fromState: 'EM_OPERACAO', toState: 'EM_MANUTENCAO', allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'], reasonRequired: false},
    {fromState: 'EM_OPERACAO', toState: 'FORA_DE_SERVICO', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  EM_MANUTENCAO: [
    {fromState: 'EM_MANUTENCAO', toState: 'EM_OPERACAO', allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'], reasonRequired: false},
    {fromState: 'EM_MANUTENCAO', toState: 'INDISPONIVEL', allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'], reasonRequired: true},
  ],
  INDISPONIVEL: [
    {fromState: 'INDISPONIVEL', toState: 'EM_OPERACAO', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
    {fromState: 'INDISPONIVEL', toState: 'FORA_DE_SERVICO', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  FORA_DE_SERVICO: [
    {fromState: 'FORA_DE_SERVICO', toState: 'QUARENTENA', allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'], reasonRequired: false},
    {fromState: 'FORA_DE_SERVICO', toState: 'EM_OPERACAO', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  QUARENTENA: [
    {fromState: 'QUARENTENA', toState: 'EM_OPERACAO', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
    {fromState: 'QUARENTENA', toState: 'ABATIDO', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  ABATIDO: [], // Terminal, sem transições
}
```

---

## Estados de Ordem de Trabalho (WorkOrder)

```
        ┌────────────┐
        │   ABERTA   │
        └──┬─────┬───┘
           │     │
        start   cancel
           │     │
           ▼     ▼
    ┌────────┐ ┌─────────┐
    │EM_CURSO│ │CANCELADA│ (terminal)
    └────┬───┘ └─────────┘
         │
    diagnose
         │
         ▼
    ┌────────────┐
    │EM_DIAGNOS  │
    └──┬─────┬───┘
       │     │
    repair   pending
       │     │
       ▼     ▼
    ┌────────────┐  ┌─────────┐
    │EM_REPARACAO│  │PENDENTE │
    └─┬──┬───┬──┘  └─────────┘
      │  │   │
      │  │   └─→ (volta a EM_REPARACAO após decisão)
      │  │
   wait│ inspect
      │  │
      ▼  ▼
    ┌────────────┐
    │AGUARDA_MAT │ ◄──┐ (sem stock suficiente)
    └────┬───────┘    │
         │            │
      material    requisição
      recebido    confirmada
         │            │
         └────┬───────┘
              │
              ▼
         ┌────────────┐
         │EM_INSPECCAO│
         └──┬────┬────┘
            │    │
         ok │    │ requer nova
            │    │ reparação
            ▼    ▼
        ┌────────────────┐
        │  RESOLVIDA     │ (terminal)
        └────────────────┘
```

### Estados

| Estado | Descrição | Próximos Válidos |
|---|---|---|
| ABERTA | Criada, não iniciada | EM_CURSO, CANCELADA, PENDENTE |
| EM_CURSO | Técnico começou | EM_DIAGNOSTICO, CANCELADA |
| EM_DIAGNOSTICO | Diagnosticando avaria | EM_REPARACAO, CANCELADA |
| EM_REPARACAO | Reparação em curso | AGUARDA_MATERIAL, EM_INSPECCAO, CANCELADA |
| AGUARDA_MATERIAL | Falta stock ou material não recebido | EM_REPARACAO, CANCELADA |
| EM_INSPECCAO | Inspecção final / QA | RESOLVIDA, EM_REPARACAO |
| RESOLVIDA | Concluída com sucesso (terminal) | — |
| PENDENTE | Suspensa (não terminal) | ABERTA |
| CANCELADA | Anulada (terminal) | — |

### Transições Permitidas

```typescript
WORKORDER_TRANSITIONS = {
  ABERTA: [
    {fromState: 'ABERTA', toState: 'EM_CURSO', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: false},
    {fromState: 'ABERTA', toState: 'CANCELADA', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
    {fromState: 'ABERTA', toState: 'PENDENTE', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  EM_CURSO: [
    {fromState: 'EM_CURSO', toState: 'EM_DIAGNOSTICO', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: false},
    {fromState: 'EM_CURSO', toState: 'CANCELADA', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  EM_DIAGNOSTICO: [
    {fromState: 'EM_DIAGNOSTICO', toState: 'EM_REPARACAO', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: false},
    {fromState: 'EM_DIAGNOSTICO', toState: 'CANCELADA', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  EM_REPARACAO: [
    {fromState: 'EM_REPARACAO', toState: 'AGUARDA_MATERIAL', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: true},
    {fromState: 'EM_REPARACAO', toState: 'EM_INSPECCAO', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: false},
    {fromState: 'EM_REPARACAO', toState: 'CANCELADA', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  AGUARDA_MATERIAL: [
    {fromState: 'AGUARDA_MATERIAL', toState: 'EM_REPARACAO', allowedRoles: ['ADMIN', 'OFICINA', 'ARMAZEM'], reasonRequired: false},
    {fromState: 'AGUARDA_MATERIAL', toState: 'CANCELADA', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: true},
  ],
  EM_INSPECCAO: [
    {fromState: 'EM_INSPECCAO', toState: 'RESOLVIDA', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: false},
    {fromState: 'EM_INSPECCAO', toState: 'EM_REPARACAO', allowedRoles: ['ADMIN', 'OFICINA'], reasonRequired: true},
  ],
  RESOLVIDA: [], // Terminal
  PENDENTE: [
    {fromState: 'PENDENTE', toState: 'ABERTA', allowedRoles: ['ADMIN', 'GESTAO'], reasonRequired: false},
  ],
  CANCELADA: [], // Terminal
}
```

---

## Efeitos Colaterais (Side Effects)

### Asset → EM_OPERACAO
Quando um Asset transita para `EM_OPERACAO`:
- Notificação ao gestor DMA: "Equipamento [código] voltou a operação"

### WorkOrder → RESOLVIDA
Quando uma WorkOrder transita para `RESOLVIDA`:
1. Asset associado volta a `EM_OPERACAO`
2. Libertar todas as Requisitions não consumidas (DEVOLVIDA)
3. Registar tempo total de resolução
4. Notificar Técnico e Gestor

### WorkOrder → AGUARDA_MATERIAL
Quando uma WorkOrder transita para `AGUARDA_MATERIAL`:
1. Requisition.status = AGUARDA_MATERIAL
2. Notificar Armazém: "Material solicitado para OT [número]"
3. Alertar Gestor se lead time excedido

### Requisition → ENTREGUE
Quando uma Requisição é entregue:
1. Gerar StockMovement tipo SAIDA
2. Recalcular CMP do Item
3. Se WorkOrder está em AGUARDA_MATERIAL, mudar para EM_REPARACAO

---

## Regras de Transição

### 1. Validação de Permissões
```typescript
if (!canTransition(entityType, currentState, targetState, userRole)) {
  throw new Error('Unauthorized state transition')
}
```

### 2. Motivo Obrigatório
Estados que exigem motivo:
- CANCELADA (sempre)
- PENDENTE (sempre)
- AGUARDA_MATERIAL (sempre)
- Qualquer transição com flag `reasonRequired: true`

### 3. Estados Terminais (sem transições):
- Asset: ABATIDO
- WorkOrder: RESOLVIDA, CANCELADA

### 4. Efeitos Colaterais
Executados após gravação da transição:
```typescript
if (transition.sideEffects) {
  await transition.sideEffects(entityId, userId)
}
```

---

## Exemplo: Fluxo Completo

```
Sequência temporal:
┌──────────────────────────────────────────────────────────────────────┐
│ 1. Asset criado: status = EM_OPERACAO                                │
│    StateTransition logged                                            │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. Avaria detectada → Asset.status = EM_MANUTENCAO                  │
│    Trigga: WorkOrder auto-created (origin=AVARIA)                    │
│    WorkOrder.status = ABERTA                                         │
│    Notificação: "Novo equipamento em manutenção"                    │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. Técnico inicia: WorkOrder.status = EM_CURSO                       │
│    Intervention created: startedAt = now()                           │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. Diagnóstico feito: WorkOrder.status = EM_DIAGNOSTICO              │
│    Intervention.diagnosis = "Corrente desgastada"                    │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. Reparação iniciada: WorkOrder.status = EM_REPARACAO               │
│    Requisition created (peça necessária)                             │
│    Requisition.status = PENDENTE                                     │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 6. Stock insuficiente                                                │
│    → Requisition.status = AGUARDA_MATERIAL                           │
│    → WorkOrder.status = AGUARDA_MATERIAL                             │
│    → Notificação Armazém: "Material falta para OT-2026-0001"         │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 7. Material recebido                                                 │
│    → StockMovement (ENTRADA)                                         │
│    → Requisition.status = ENTREGUE                                   │
│    → Notificação Técnico: "Material disponível para OT-2026-0001"    │
│    → WorkOrder.status = EM_REPARACAO (automático)                    │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 8. Reparação concluída: WorkOrder.status = EM_INSPECCAO              │
│    Intervention.result = CONCLUIDA                                   │
│    Intervention.endedAt = now()                                      │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 9. Inspecção OK: WorkOrder.status = RESOLVIDA                        │
│    Side effects:                                                     │
│    - Asset.status = EM_OPERACAO                                      │
│    - WorkOrder.closedAt = now()                                      │
│    - Notificações enviadas                                           │
│    - Tempo total calculado                                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Testes da Máquina de Estados

Ver `/tests/state-machine.test.ts` para casos de teste abrangentes:
- ✓ Transições válidas
- ✓ Transições inválidas (must fail)
- ✓ Verificação de roles
- ✓ Motivos obrigatórios
- ✓ Efeitos colaterais
