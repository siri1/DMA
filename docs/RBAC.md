# Matriz de Permissões (RBAC) — DMA Vision

## 6 Perfis de Utilizador

| Perfil | Descrição | Tipo de Utilizador |
|---|---|---|
| ADMIN | Administrador total do sistema | Técnico/Gestor |
| OFICINA | Técnico de manutenção da Oficina DMA | Técnico |
| ARMAZEM | Gestor do Armazém de Peças | Técnico/Gestor |
| GESTAO | Gestor do DMA (DOP, Direcção) | Gestor |
| CLIENTE_INTERNO | Cliente interno (leitor de equipamentos) | Utilizador |
| PAINEL | Utilizador técnico para ecrã TV | Técnico |

---

## Matriz de Permissões por Módulo

### Legenda
- ✓ = Permissão concedida
- ✗ = Sem permissão
- R = Requer aprovação/validação

### Módulo: Assets (Equipamentos)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| create | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| edit | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Acesso ao CRUD e pesquisa global
- create: Registar novo equipamento
- edit: Alterar descrição, localização, responsável, etc.
- delete: Remover equipamento (raro, apenas ADMIN)
- approve: Autorizar mudanças de estado para ABATIDO

---

### Módulo: WorkOrders (Ordens de Trabalho)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| create | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| edit | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Lista de OT (sem custos para CLIENTE)
- create: Criar OT manual
- edit: Alterar prioridade, atribuição, estado
- delete: Anular OT (apenas ADMIN)
- approve: Validar transições críticas (CANCELADA, PENDENTE)

---

### Módulo: Interventions (Intervenções)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| create | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| edit | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Histórico de intervenções
- create: Registar nova intervenção
- edit: Actualizar diagnóstico, actividades, resultado
- approve: Validar resultado CONCLUIDA → RESOLVIDA

---

### Módulo: Maintenance (Planos de Manutenção)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| create | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| edit | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Planos previstos, vencidos e próximos (CLIENTE vê datas, sem custos)
- create/edit: Definir tipo, periodicidade e próxima data por equipamento ou família
- approve: Validar a geração automática de OT a partir de planos

---

### Módulo: Items (Artigos do Armazém)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| create | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| edit | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Catálogo de artigos, stock
- create: Registar novo SKU
- edit: Alterar descrição, minStock, maxStock, barcode
- CLIENTE vê artigos mas não custos (CMP, unit price)

---

### Módulo: Stocks (Movimentos de Stock)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| create | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| edit | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Histórico de movimentos
- create: Registar entrada, saída, ajuste
- edit/delete: Apenas ADMIN (raro, correcções)
- Recepção e conferência (`/api/receipts`) e alertas de stock mínimo usam este módulo

---

### Módulo: Requisitions (Requisições de Peças)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| create | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| edit | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Requisições e picking list
- create: Criar requisição a partir de WorkOrder (OFICINA)
- edit: Atualizar quantidades, estado (ARMAZEM)
- approve: Validar ENTREGUE, DEVOLVIDA (ARMAZEM, GESTAO)

---

### Módulo: Users (Utilizadores)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| create | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| edit | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- Gestão completa: criar, alterar, desactivar utilizadores, resetar passwords

---

### Módulo: Audit (Auditoria)

| Operação | ADMIN | OFICINA | ARMAZEM | GESTAO | CLIENTE | PAINEL |
|---|---|---|---|---|---|---|
| view | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| create | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| edit | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| delete | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| approve | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| admin | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Contexto:**
- view: Apenas ADMIN e GESTAO podem consultar AuditLog
- CLIENTE_INTERNO **nunca** vê auditoria
- Logs append-only, não editáveis

---

## Restrições Especiais por Perfil

### ADMIN
- Acesso total (god mode)
- Pode criar, editar, deletar qualquer entidade
- Acesso a todas as configurações do sistema

### OFICINA
- Cria/edita/vê Assets e WorkOrders atribuídos
- Cria Intervenções para as suas OT
- Cria Requisições de peças
- **Não acessa:** Stocks, Compras, Auditoria, Utilizadores

### ARMAZEM
- Gestão completa de Items e Stocks
- Processa Requisições, Compras, Recepção
- Vê lista de artigos mas **não editável por CLIENTE**
- **Não acessa:** Assets (apenas view), WorkOrders, Intervenções, Auditoria

### GESTAO
- View de tudo (Assets, WorkOrders, Interventions, Items, Stocks, Requisições, Auditoria)
- Cria Assets e WorkOrders
- Aprova transições críticas (CANCELADA, Quarantine decisão)
- Acesso a Dashboards Executivo e Operacional
- Acesso a Auditoria (consulta)

### CLIENTE_INTERNO
- **View-only** de Assets, Items, Requisições
- **Nunca vê:** Custos (CMP, preços), Fornecedores, Auditoria
- Útil para pesquisa global de equipamentos disponíveis

### PAINEL
- **View-only** de WorkOrders (sem edit)
- Ecrã TV de monitorização
- Acesso a `/painel` route (sem chrome)
- **Não acessa:** nada além do painel

---

## Implementação (lib/rbac.ts)

Matriz declarativa em TypeScript:

```typescript
export const PERMISSIONS: PermissionMatrix = {
  assets: {
    view: ['ADMIN', 'OFICINA', 'ARMAZEM', 'GESTAO', 'CLIENTE_INTERNO', 'PAINEL'],
    create: ['ADMIN', 'OFICINA', 'GESTAO'],
    edit: ['ADMIN', 'OFICINA', 'GESTAO'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
  // ... outros módulos
}

export function hasPermission(
  role: UserRole,
  module: string,
  permission: Permission
): boolean {
  const modulePerms = PERMISSIONS[module]
  if (!modulePerms) return false
  return modulePerms[permission]?.includes(role) ?? false
}
```

## Guard em Server Actions

Exemplo:

```typescript
'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'

export async function createAsset(data: AssetInput) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  if (!hasPermission(session.user.role, 'assets', 'create')) {
    throw new Error('Forbidden')
  }
  
  // Lógica de criação
}
```

---

## Notas de Segurança

1. **Verificação sempre no servidor:** Nunca confie em verificações de cliente (UI desabilita botões, mas servidor valida)
2. **CLIENTE_INTERNO:** Filter explícito de campos sensíveis (sempre usar `select` ou `omit` no Prisma)
3. **PAINEL:** Sem autenticação tradicional, usar token estático ou IP allowlist em produção
4. **Auditoria:** Cada acesso privilegiado é logged
5. **Rate limiting:** Aplicado no login e APIs críticas
