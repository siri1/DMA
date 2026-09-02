# MVP 1 — Demonstração ao Cliente: Log de Avarias Substituído

**Data:** 2026-09-02
**Duração prevista:** 20 min
**Público:** DMA (Oficina, Gestão)

---

## Setup Inicial (5 min)

### 1. Aceder ao sistema
```
URL: http://localhost:3000/login
Email: admin@kwanda.ao
Password: Admin@2026
```

### 2. Navegação (no dashboard inicial)
- Clique em **Oficina DMA** no layout
- Aceda a **Equipamentos** no menu lateral

---

## Fluxo de Demonstração (15 min)

### 1. Listar Equipamentos (2 min)
**O que mostra:**
- ✓ 5 equipamentos industriais reais (Empilhador, Gerador, Compressor, Viatura, Bomba)
- ✓ Filtros por estado (EM_OPERACAO, EM_MANUTENCAO, FORA_DE_SERVICO, etc.)
- ✓ Cards com informação visual (código, descrição, marca, modelo, data entrada)

**Ação:**
1. Mostrar lista com todos os equipamentos
2. Filtrar por `EM_MANUTENCAO` — mostra 1 equipamento
3. Filtrar por `FORA_DE_SERVICO` — mostra 1 equipamento

---

### 2. Ver Detalhe de um Equipamento (3 min)
**Cenário:** Clicar em "Empilhador Frontal Toyota"

**O que mostra:**
- ✓ Código: EMPI-001
- ✓ Marca: Toyota, Modelo: 8FGU30, Série: BF0328742
- ✓ Data de entrada: 15/06/2022
- ✓ Localização: Warehouse A
- ✓ Diagnóstico: "Operacional"
- ✓ Estado actual: **EM_OPERACAO** (em verde)
- ✓ Histórico de estados (se houver transições anteriores)

---

### 3. Mudar Estado de um Equipamento (3 min)
**Cenário:** Equipamento entra em manutenção (simulação de avaria)

**Ação:**
1. No painel lateral "Mudança de Estado", clicar em `→ EM_MANUTENCAO`
2. Modal aparece: "Mudar Estado: EM_OPERACAO → EM_MANUTENCAO"
3. Confirmar (motivo não obrigatório para este estado)
4. Equipamento muda para **EM_MANUTENCAO** (em amarelo)

**Ação 2:**
1. Agora clicar em `→ INDISPONIVEL` (pois não conseguem reparar)
2. Modal: "Motivo obrigatório" aparece
3. Escrever: "Falha crítica no sistema de combustível. Reparação impossível com recursos actuais."
4. Confirmar — estado muda para **INDISPONIVEL** (em vermelho)

**Histórico:**
- Novo registo aparece: "EM_MANUTENCAO → INDISPONIVEL | Falha crítica... | 2026-09-02 14:30:00"

---

### 4. Criar um Novo Equipamento (4 min)
**Ação:**
1. Clicar no botão `+ Novo Equipamento`
2. Preencher formulário:
   - Código: `BOMBA-002`
   - Descrição: `Bomba Submersível KSB 15kW`
   - Marca: `KSB`
   - Modelo: `UPA 500`
   - Série: `KSB-UPA-002345`
   - Data Entrada: `01/09/2026`
   - Localização: `Site C`
   - Família: `Bombas`
   - Diagnóstico: (deixar vazio)
3. Clicar `Criar Equipamento`
4. Redirecionado para a lista — **BOMBA-002 aparece** com estado `EM_OPERACAO` (verde)

---

### 5. Painel de Monitorização (TV) (3 min)
**Aceder:** http://localhost:3000/painel

**O que mostra:**
- ✓ Full-screen (sem chrome/navegação)
- ✓ Rotação de páginas a cada 10 segundos
- ✓ Página 1: `Ordens Abertas: 2` (vermelho)
- ✓ Página 2: `Em Reparação: 1` (amarelo)
- ✓ Página 3: `Em Diagnóstico: 1` (azul)
- ✓ Contador: "1 de 3"

---

## Pontos-Chave da Demonstração

✅ **Substituiu o Excel?**
- Sim. Dados do Log de Avarias antigo foram importados (com script de migração)
- Interface clean, organizada por estado

✅ **Fácil de usar?**
- Menu simples, cards intuitivas
- Formulários validados (Zod)
- Botões de acção claros

✅ **Auditoria?**
- Cada mudança de estado é registada com timestamp e motivo
- Histórico completo visível no detalhe

✅ **Multi-perfil?**
- Admin vê tudo (poder total)
- Oficina vê equipamentos + pode mudar estado
- Gestão vê tudo + dashboards (MVP 2+)

---

## Fim da Demonstração

**Perguntas do Cliente?**
- "Quando posso ter os dados reais migrados?" → MVP 1, fase 2 (script de migração `npm run migrate:avarias`)
- "E fotos/documentos?" → MVP 1, fase 3 (upload em desenvolvimento)
- "E integração com ERP?" → MVP 4+ (pontos de extensão documentados)

---

## Checklist Técnico (para o dev antes da demo)

- [ ] `npm run db:seed` executado (dados de demo)
- [ ] `/painel` a refrescar cada 10s
- [ ] Transições de estado funcionam (testar EM_OPERACAO → EM_MANUTENCAO)
- [ ] Motivo obrigatório funciona (testar transição a CANCELADA)
- [ ] Histórico de estados aparece
- [ ] Form de novo equipamento validado (ex: assetCode < 3 chars → erro)
- [ ] Filtros por estado funcionam
- [ ] Login com credenciais de demo funciona

