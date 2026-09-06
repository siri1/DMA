# Relatório de Migração — Log de Avarias

Data: 2026-09-06T20:45:55.992Z
Modo: Execução
Ficheiro de origem: Kwanda_Log de avarias na oficina.xlsx

## Resumo

- **Linhas lidas:** 174
- **Equipamentos criados:** 87
- **Equipamentos já existentes (ignorados):** 0
- **Ordens de trabalho criadas:** 174
- **Ordens de trabalho já existentes (ignoradas):** 0
- **Linhas rejeitadas:** 0

## Mapeamento de estados aplicado

| Estado no Excel | WorkOrderStatus |
|---|---|
| Resolvido | RESOLVIDA |
| Em curso | EM_CURSO |
| Cancelado | CANCELADA |
| Pendente | PENDENTE |

O estado do **Asset** (equipamento) é derivado do estado da entrada mais
recente desse equipamento no log: `EM_MANUTENCAO` se "Em curso"/"Pendente",
`EM_OPERACAO` caso contrário.

## Linhas Rejeitadas

Nenhuma linha rejeitada.

---

Idempotente: sim. Assets existentes (por `assetCode`) e ordens de trabalho
já migradas (mesmo equipamento + data de abertura + resumo) não são
duplicados numa nova execução.
