# API Reference — DMA Vision

## Dashboard Endpoints

### GET /api/dashboard/metrics
Retorna métricas consolidadas do painel.

**Query Parameters:**
- `type` (string): `executive` (default) ou `operational`
- `from` (ISO date): Data de início (padrão: -30 dias)
- `to` (ISO date): Data de fim (padrão: hoje)

**Response (Executive):**
```json
{
  "assetsInMaintenance": 3,
  "workOrdersOpened": 5,
  "workOrdersClosed": 12,
  "workOrdersOverdue": 2,
  "overdueMaintenancePlans": 1,
  "avgResolutionTime": 4.5,
  "totalStockValue": 150000,
  "assetCosts": {
    "asset_1": 5000,
    "asset_2": 8000
  },
  "period": { "from": "2026-08-04", "to": "2026-09-03" }
}
```

**Response (Operational):**
```json
{
  "assetsByState": {
    "EM_OPERACAO": 45,
    "EM_MANUTENCAO": 3,
    "INDISPONIVEL": 2
  },
  "overdueWorkOrders": [
    {
      "id": "wo_1",
      "number": "OT-2026-0001",
      "summary": "Reparação motor",
      "dueAt": "2026-09-01T10:00:00Z",
      "asset": { "assetCode": "EMPI-001" }
    }
  ],
  "overdueMaintenancePlans": [...],
  "lowStockItems": [...]
}
```

**RBAC:** `workorders:view` (ADMIN, OFICINA, ARMAZEM, GESTAO, PAINEL)

---

## User Management Endpoints

### GET /api/users
Lista todos os utilizadores (paginado, 100 por defeito).

**Response:**
```json
[
  {
    "id": "user_1",
    "name": "Admin",
    "email": "admin@kwanda.ao",
    "role": "ADMIN",
    "active": true,
    "lastLoginAt": "2026-09-03T07:30:00Z",
    "createdAt": "2026-09-02T00:00:00Z"
  }
]
```

**RBAC:** `users:view` (ADMIN)

### POST /api/users
Cria novo utilizador.

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@kwanda.ao",
  "role": "OFICINA",
  "password": "SecurePass@2026"
}
```

**RBAC:** `users:create` (ADMIN)

### GET /api/users/[id]
Retorna detalhe de um utilizador.

**RBAC:** `users:view` (ADMIN)

### PATCH /api/users/[id]
Actualiza utilizador ou reseta password.

**Request (Update):**
```json
{
  "name": "João Silva Updated",
  "role": "GESTAO"
}
```

**Request (Reset Password):**
```json
{
  "newPassword": "NewSecure@2026"
}
```

**Request (Deactivate):**
```json
{
  "deactivate": true
}
```

**RBAC:** `users:edit` (ADMIN)

---

## Audit Endpoints

### GET /api/audit
Retorna registos de auditoria com filtros opcionais.

**Query Parameters:**
- `module` (string): ex. `assets`, `workorders`, `users`
- `action` (string): `CREATE`, `UPDATE`, `DELETE`, `STATE_CHANGE`
- `from` (ISO date): Data de início
- `to` (ISO date): Data de fim
- `userId` (string): Filtrar por utilizador
- `limit` (int): Registos por página (max 1000, default 100)
- `offset` (int): Paginação
- `format` (string): `csv` para exportação

**Response (JSON):**
```json
{
  "logs": [
    {
      "id": "log_1",
      "createdAt": "2026-09-03T07:30:00Z",
      "user": { "name": "Admin", "email": "admin@kwanda.ao" },
      "action": "CREATE",
      "module": "users",
      "entityType": "user",
      "entityId": "user_123",
      "before": null,
      "after": { "name": "João", "email": "joao@kwanda.ao" }
    }
  ],
  "total": 1240,
  "limit": 100,
  "offset": 0
}
```

**Response (CSV):**
```
Timestamp,Utilizador,Acção,Módulo,Entidade,Detalhes
2026-09-03 07:30:00,Admin,CREATE,users,user:user_123,after={"name":"João"...}
```

**RBAC:** `audit:view` (ADMIN, GESTAO)

---

## Common Response Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validação falhou) |
| 401 | Unauthorized (sem sessão) |
| 403 | Forbidden (RBAC falhou) |
| 404 | Not Found |
| 409 | Conflict (ex: email já existe) |
| 500 | Server Error |

---

## Error Format

```json
{
  "error": "Descrição do erro em Português"
}
```

---

## Authentication

Todas as rotas requerem sessão JWT válida (NextAuth v5). Cookie de sessão enviado automaticamente pelo browser.

Para testes com curl:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kwanda.ao","password":"Admin@2026"}'

# Usar cookie na próxima request
curl -H "Cookie: next-auth.session-token=..." \
  http://localhost:3000/api/users
```

---

## Rate Limiting

Não implementado em MVP 4, mas recomenda-se adicionar:
- Login: 5 tentativas / 15 min
- API geral: 100 req / min por utilizador

Ver `docs/ASSUMPTIONS.md` seção 9.2.
