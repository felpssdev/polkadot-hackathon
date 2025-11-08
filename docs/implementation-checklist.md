# Implementation Checklist

Checklist completo para acompanhar o progresso da integração MVP do PolkaPay para o Sub0 Devconnect.

## Status Geral

- ✅ **Smart Contract**: 100% completo (34 testes passando)
- ⚠️ **Backend**: 40% completo (estrutura pronta, métodos com TODOs)
- ✅ **Frontend UI**: 95% completo (Polkadot.js integrado, usando mock data)
- 🔴 **Integração End-to-End**: 0% completo

---

## FASE 0: Documentação ✅

### Revisão de Documentação Existente
- [x] `docs/overview.md` - Atualizado com fluxos de integração
- [x] `docs/smart-contracts.md` - Adicionada seção de Backend Integration
- [x] `docs/api-reference.md` - Adicionados novos endpoints (cancel, dispute, blockchain)
- [x] `docs/tech-stack.md` - Validado
- [x] `docs/use-cases.md` - Validado
- [x] `docs/testing.md` - Validado
- [x] `docs/quick-start.md` - Validado

### Criação de Nova Documentação
- [x] `docs/deployment.md` - Guia completo de deploy no Rococo
- [x] `docs/integration.md` - Guia de integração Backend ↔ Contract ↔ Frontend
- [x] `docs/wallet-integration.md` - Guia de integração com Polkadot.js
- [x] `docs/implementation-checklist.md` - Este arquivo

### Atualização do README
- [ ] Adicionar badge de status do projeto
- [ ] Adicionar seção "Current Status" com progresso
- [ ] Adicionar roadmap para Sub0
- [ ] Atualizar quick start

---

## FASE 1: Backend Integration (PRIORIDADE MÁXIMA) 🔴

### 1.1 PolkadotService - Métodos Reais

**Arquivo**: `backend/app/services/polkadot_service.py`

- [ ] `create_order(order_type: str, dot_amount: float)`
  - [ ] Converter order_type para enum (0=Sell, 1=Buy)
  - [ ] Converter DOT para Planck (10^10)
  - [ ] Para Sell: enviar DOT como value
  - [ ] Para Buy: value=0
  - [ ] Chamar `self.contract.exec()` com gas_limit
  - [ ] Retornar `order_id`, `tx_hash`, `block_number`

- [ ] `accept_order(order_id: int)` - Para Sell orders
  - [ ] Chamar contrato sem value
  - [ ] Retornar tx_hash

- [ ] `accept_buy_order(order_id: int, dot_amount: float)` - Para Buy orders
  - [ ] Converter DOT para Planck
  - [ ] Enviar DOT como value
  - [ ] Retornar tx_hash

- [ ] `confirm_payment_sent(order_id: int)`
  - [ ] Chamar contrato sem value
  - [ ] Retornar tx_hash

- [ ] `complete_order(order_id: int)`
  - [ ] Chamar contrato sem value
  - [ ] Retornar tx_hash

- [ ] `cancel_order(order_id: int)`
  - [ ] Chamar contrato sem value
  - [ ] Retornar tx_hash

- [ ] `create_dispute(order_id: int)`
  - [ ] Chamar contrato sem value
  - [ ] Retornar tx_hash

- [ ] `get_order(order_id: int)` - Read-only
  - [ ] Usar `self.contract.read()`
  - [ ] Converter Planck para DOT
  - [ ] Mapear status enum para string
  - [ ] Retornar objeto Order formatado

- [ ] Tratamento de erros
  - [ ] Try/catch em todos os métodos
  - [ ] Log detalhado de erros
  - [ ] Retornar None em caso de falha
  - [ ] Mapear erros do contrato para mensagens amigáveis

### 1.2 OrderService - Integração com Blockchain

**Arquivo**: `backend/app/services/order_service.py`

- [ ] Modificar `create_order()`
  - [ ] Após cálculos, chamar `polkadot_service.create_order()`
  - [ ] Se falhar, retornar None e logar erro
  - [ ] Salvar `blockchain_order_id` e `blockchain_tx_hash` no DB
  - [ ] Commit e retornar Order

- [ ] Criar `accept_order(db, order_id, lp)`
  - [ ] Validar order existe e status é PENDING
  - [ ] Verificar order_type e chamar método apropriado
  - [ ] Atualizar status para ACCEPTED
  - [ ] Salvar LP e tx_hash
  - [ ] Commit e retornar True/False

- [ ] Criar `confirm_payment(db, order_id)`
  - [ ] Validar order existe e status é ACCEPTED
  - [ ] Chamar `polkadot_service.confirm_payment_sent()`
  - [ ] Atualizar status para PAYMENT_SENT
  - [ ] Commit e retornar True/False

- [ ] Criar `complete_order(db, order_id)`
  - [ ] Validar order existe e status é PAYMENT_SENT
  - [ ] Chamar `polkadot_service.complete_order()`
  - [ ] Atualizar status para COMPLETED
  - [ ] Salvar completed_at timestamp
  - [ ] Commit e retornar True/False

- [ ] Criar `cancel_order(db, order_id)`
  - [ ] Validar order existe e status permite cancelamento
  - [ ] Chamar `polkadot_service.cancel_order()`
  - [ ] Atualizar status para CANCELLED
  - [ ] Commit e retornar True/False

### 1.3 API Endpoints

**Arquivo**: `backend/app/routers/orders.py`

- [ ] POST `/orders/{order_id}/accept`
  - [ ] Dependency: `get_current_lp`
  - [ ] Chamar `order_service.accept_order()`
  - [ ] Retornar 200 ou 400

- [ ] POST `/orders/{order_id}/confirm-payment`
  - [ ] Dependency: `get_current_user`
  - [ ] Validar user é dono da order
  - [ ] Chamar `order_service.confirm_payment()`
  - [ ] Retornar 200 ou 400/403

- [ ] POST `/orders/{order_id}/complete`
  - [ ] Dependency: `get_current_lp`
  - [ ] Chamar `order_service.complete_order()`
  - [ ] Retornar 200 ou 400

- [ ] POST `/orders/{order_id}/cancel`
  - [ ] Dependency: `get_current_user`
  - [ ] Validar user é dono da order
  - [ ] Chamar `order_service.cancel_order()`
  - [ ] Retornar 200 ou 400/403

- [ ] POST `/orders/{order_id}/dispute`
  - [ ] Dependency: `get_current_user`
  - [ ] Validar order existe
  - [ ] Chamar `polkadot_service.create_dispute()`
  - [ ] Atualizar status para DISPUTED
  - [ ] Retornar 200 ou 400

- [ ] GET `/orders/{order_id}/blockchain`
  - [ ] Chamar `polkadot_service.get_order()`
  - [ ] Retornar dados do blockchain
  - [ ] Útil para debug e validação

### 1.4 Database Models

**Arquivo**: `backend/app/models.py`

- [ ] Adicionar campos à classe `Order`:
  - [ ] `blockchain_order_id = Column(BigInteger, nullable=True, index=True)`
  - [ ] `blockchain_tx_hash = Column(String(255), nullable=True)`
  - [ ] `blockchain_status = Column(String(50), nullable=True)`

- [ ] Criar migration Alembic
  - [ ] `alembic revision --autogenerate -m "add blockchain fields"`
  - [ ] Revisar migration gerada
  - [ ] `alembic upgrade head`

### 1.5 Configuração de Ambiente

**Arquivos**: `backend/.env`, `backend/env.example`

- [ ] Adicionar variáveis em `.env`:
  - [ ] `POLKADOT_NODE_URL=wss://rococo-contracts-rpc.polkadot.io`
  - [ ] `CONTRACT_ADDRESS=<preencher após deploy>`
  - [ ] `CONTRACT_METADATA_PATH=./contracts/target/ink/polkapay_escrow.json`
  - [ ] `SIGNER_SEED=<seed phrase>`
  - [ ] `DEFAULT_LP_FEE=300`

- [ ] Atualizar `backend/app/config.py`
  - [ ] Adicionar leitura das novas variáveis
  - [ ] Validar valores obrigatórios

- [ ] Atualizar `backend/env.example`
  - [ ] Adicionar exemplos (sem valores reais)

---

## FASE 2: Frontend Integration (CRÍTICO) 🔴

### 2.1 API Client para Orders

**Arquivo**: `frontend/src/lib/api/orders.ts`

- [ ] Criar interfaces TypeScript
  - [ ] `CreateOrderRequest`
  - [ ] `Order`

- [ ] Criar `ordersApi` object
  - [ ] `createOrder(data)` → POST /orders
  - [ ] `getOrder(orderId)` → GET /orders/{id}
  - [ ] `listOrders()` → GET /orders
  - [ ] `acceptOrder(orderId)` → POST /orders/{id}/accept
  - [ ] `confirmPayment(orderId)` → POST /orders/{id}/confirm-payment
  - [ ] `completeOrder(orderId)` → POST /orders/{id}/complete
  - [ ] `cancelOrder(orderId)` → POST /orders/{id}/cancel

### 2.2 Hook useOrder

**Arquivo**: `frontend/src/hooks/useOrder.ts`

- [ ] Criar estado gerenciado
  - [ ] `loading: boolean`
  - [ ] `error: string | null`
  - [ ] `currentOrder: Order | null`

- [ ] Criar funções expostas
  - [ ] `createOrder(data)`
  - [ ] `acceptOrder(orderId)`
  - [ ] `confirmPayment(orderId)`
  - [ ] `completeOrder(orderId)`
  - [ ] `cancelOrder(orderId)`
  - [ ] `refreshOrder(orderId)`

- [ ] Integração com useWallet
  - [ ] Verificar `selectedAccount` antes de criar ordem
  - [ ] Passar wallet address para backend

- [ ] Error handling
  - [ ] Capturar erros HTTP
  - [ ] Mapear para mensagens amigáveis
  - [ ] Expor via estado `error`

### 2.3 Atualizar Modais Buy e Sell

**Arquivo**: `frontend/src/components/features/sell-modal.tsx`

- [ ] Importar `useOrder` hook
- [ ] Substituir mock por `createOrder()` real
- [ ] Adicionar loading state durante criação
- [ ] Mostrar tx_hash após sucesso
- [ ] Adicionar link para Polkadot.js Apps
- [ ] Error handling com mensagens claras
- [ ] Redirecionar para página de detalhes da ordem

**Arquivo**: `frontend/src/components/features/buy-modal.tsx`

- [ ] Mesma lógica do sell-modal
- [ ] `order_type: 'Buy'`

### 2.4 Criar Página de Detalhes da Ordem

**Arquivo**: `frontend/src/app/orders/[id]/page.tsx`

- [ ] Header com status da ordem (badge colorido)
- [ ] Timeline visual do progresso
- [ ] Informações da ordem (DOT, BRL, fee, PIX key)
- [ ] Blockchain info (order_id, tx_hash, block number)
- [ ] Botões de ação baseados no status
  - [ ] PENDING → "Cancel Order" (user), "Accept Order" (LP)
  - [ ] ACCEPTED → "Confirm Payment Sent" (user)
  - [ ] PAYMENT_SENT → "Complete Order" (LP), "Create Dispute"
  - [ ] COMPLETED → "View on Explorer"
- [ ] Auto-refresh (polling a cada 5 segundos)
- [ ] Parar polling quando status for final

### 2.5 Criar Lista de Ordens

**Arquivo**: `frontend/src/app/orders/page.tsx`

- [ ] Tabs
  - [ ] "My Orders" - Ordens do user logado
  - [ ] "Available Orders" - Ordens PENDING (para LPs)
  - [ ] "History" - Ordens completadas/canceladas

- [ ] Card de ordem
  - [ ] Order ID
  - [ ] Type (Buy/Sell) com badge
  - [ ] Amount (DOT e BRL)
  - [ ] Status com cor
  - [ ] Created at
  - [ ] Botão "View Details"

- [ ] Filtros
  - [ ] Por status
  - [ ] Por tipo (Buy/Sell)
  - [ ] Por data

### 2.6 Atualizar Balance Card

**Arquivo**: `frontend/src/components/features/balance-card.tsx`

- [ ] Criar hook `useBalance()`
- [ ] Endpoint GET `/users/me/balance`
- [ ] Atualizar balance após cada transação
- [ ] Mostrar loading skeleton enquanto carrega
- [ ] Substituir mock data por dados reais

---

## FASE 3: Deploy e Configuração (BLOQUEADOR) 🔴

### 3.1 Preparar Conta no Rococo (MANUAL)

- [ ] Abrir SubWallet (já instalado)
- [ ] Criar nova conta ou usar existente
- [ ] Exportar seed phrase (guardar com segurança)
- [ ] Copiar endereço Substrate
- [ ] Acessar https://faucet.polkadot.io/rococo
- [ ] Colar endereço e solicitar ROC tokens
- [ ] Aguardar confirmação (1-2 minutos)
- [ ] Verificar saldo no SubWallet (mínimo 100 ROC)

### 3.2 Deploy do Smart Contract

- [ ] Navegar para `backend/contracts`
- [ ] Limpar builds anteriores: `cargo clean`
- [ ] Build contract: `cargo contract build --release`
- [ ] Verificar artefatos gerados em `target/ink/`
- [ ] Executar testes: `cargo test` (34 testes devem passar)
- [ ] Configurar `SIGNER_SEED` environment variable
- [ ] Upload code: `cargo contract upload --suri "$SIGNER_SEED" --url wss://rococo-contracts-rpc.polkadot.io --execute`
- [ ] Salvar Code Hash
- [ ] Instantiate: `cargo contract instantiate --suri "$SIGNER_SEED" --url wss://rococo-contracts-rpc.polkadot.io --constructor new --args 300 --execute`
- [ ] **Salvar Contract Address** (CRÍTICO!)

### 3.3 Validar Deploy

- [ ] Abrir https://polkadot.js.org/apps/?rpc=wss://rococo-contracts-rpc.polkadot.io
- [ ] Ir em Developer → Contracts
- [ ] Adicionar contrato existente com address
- [ ] Carregar metadata (`polkapay_escrow.json`)
- [ ] Testar chamada read-only: `is_paused()` (deve retornar `false`)
- [ ] Testar chamada read-only: `get_lp_fee()` (deve retornar `300`)
- [ ] Verificar owner está correto

### 3.4 Configurar Backend

- [ ] Atualizar `backend/.env` com:
  - [ ] `CONTRACT_ADDRESS=5Gxx...` (do deploy)
  - [ ] `SIGNER_SEED=palavra1 palavra2 ...`
  - [ ] `POLKADOT_NODE_URL=wss://rococo-contracts-rpc.polkadot.io`

- [ ] Testar conexão:
  ```bash
  cd backend
  source venv/bin/activate
  python -c "from app.services.polkadot_service import polkadot_service; polkadot_service.connect(); print('✅ Connected!')"
  ```

---

## FASE 4: Testes End-to-End (VALIDAÇÃO) ⚠️

### 4.1 Teste Manual: Fluxo Sell Completo

**Setup**:
- [ ] Backend rodando: `make run-backend`
- [ ] Frontend rodando: `make run-frontend`
- [ ] 2 contas Substrate: User e LP

**Passos**:
1. [ ] User: Conectar wallet no frontend
2. [ ] User: Clicar "Sell" → Preencher 1 DOT + PIX key
3. [ ] User: Confirmar transação no SubWallet
4. [ ] Validar: Order criada no DB com blockchain_order_id
5. [ ] Validar: DOT travado no contrato (verificar no Apps)
6. [ ] LP: Conectar wallet (outra conta)
7. [ ] LP: Ver ordem disponível na lista
8. [ ] LP: Clicar "Accept Order"
9. [ ] LP: Confirmar transação
10. [ ] Validar: Status mudou para ACCEPTED
11. [ ] User: Clicar "Confirm Payment Sent"
12. [ ] Validar: Status mudou para PAYMENT_SENT
13. [ ] LP: Clicar "Complete Order"
14. [ ] LP: Confirmar transação
15. [ ] Validar: Status mudou para COMPLETED
16. [ ] Validar: DOT transferido para LP (verificar saldo)
17. [ ] Validar: Fee transferida para owner

**Checklist de Validação**:
- [ ] Order criada no DB
- [ ] blockchain_order_id preenchido
- [ ] tx_hash salvo
- [ ] DOT travado no contrato
- [ ] Status sincronizado (DB ↔ blockchain)
- [ ] Transições de status corretas
- [ ] Transferências executadas
- [ ] Fees calculadas corretamente
- [ ] UI atualizada em tempo real

### 4.2 Teste Manual: Fluxo Buy Completo

1. [ ] User: Criar Buy order (1 DOT)
2. [ ] Validar: Order criada sem travar DOT
3. [ ] LP: Aceitar ordem
4. [ ] Validar: LP deposita DOT ao aceitar
5. [ ] LP: Confirmar PIX recebido
6. [ ] User: Confirmar PIX enviado
7. [ ] User: Completar ordem
8. [ ] Validar: DOT transferido para user
9. [ ] Validar: Fee transferida para owner

### 4.3 Teste Manual: Cancelamento

1. [ ] User: Criar Sell order
2. [ ] User: Cancelar antes de LP aceitar
3. [ ] Validar: DOT devolvido ao User
4. [ ] Validar: Status CANCELLED no DB

### 4.4 Teste de Erros

- [ ] User sem saldo suficiente → Erro claro no frontend
- [ ] Transação rejeitada no wallet → Rollback no DB
- [ ] Network timeout → Retry automático
- [ ] Contrato pausado → Mensagem "System under maintenance"

---

## FASE 5: Melhorias de UX (IMPORTANTE) ⚠️

### 5.1 Loading States

- [ ] Modais Buy/Sell
  - [ ] Spinner durante transações blockchain
  - [ ] Mensagens de progresso
  - [ ] Desabilitar botões durante loading

- [ ] Botões de ação
  - [ ] Loading state
  - [ ] Disabled state

- [ ] Lista de ordens
  - [ ] Skeleton loaders

### 5.2 Error Handling

**Arquivo**: `frontend/src/lib/api/errorHandler.ts`

- [ ] Mapear erros do contrato
  - [ ] `InsufficientBalance` → "Saldo insuficiente"
  - [ ] `OrderNotFound` → "Ordem não encontrada"
  - [ ] `Unauthorized` → "Sem permissão"
  - [ ] `ContractPaused` → "Sistema em manutenção"

- [ ] Retry automático
  - [ ] 3 tentativas para erros de rede
  - [ ] Exponential backoff (1s, 2s, 4s)
  - [ ] Mostrar tentativa atual

### 5.3 Transaction Links

- [ ] Adicionar em todos os lugares que mostram tx_hash
- [ ] Link para Polkadot.js Apps
- [ ] Ícone de link externo
- [ ] Tooltip: "View on Polkadot.js Apps"

### 5.4 Notificações (Opcional)

- [ ] Instalar `react-hot-toast`
- [ ] Notificar: Order criada com sucesso
- [ ] Notificar: Order aceita
- [ ] Notificar: Payment confirmado
- [ ] Notificar: Order completada
- [ ] Notificar: Erros importantes

---

## FASE 6: Documentação e Deploy (FINAL) ⚠️

### 6.1 Atualizar README

- [ ] Como obter ROC tokens
- [ ] Como fazer deploy do contrato
- [ ] Como configurar .env
- [ ] Como rodar localmente
- [ ] Troubleshooting comum

### 6.2 Preparar Demo

- [ ] Criar contas de teste
  - [ ] User: danielgorgonha (já existe)
  - [ ] LP: conta secundária
  - [ ] Admin: conta do owner do contrato

- [ ] Popular dados
  - [ ] 2-3 ordens de exemplo em diferentes status
  - [ ] Histórico de transações
  - [ ] Saldos realistas

- [ ] Script de demo
  1. Mostrar dashboard com saldo
  2. Criar Sell order
  3. Aceitar como LP
  4. Completar fluxo
  5. Mostrar ordem completada
  6. Mostrar histórico

---

## Resumo de Prioridades

### 🔴 CRÍTICO (Deve funcionar)
1. Backend: Implementar métodos em polkadot_service.py
2. Backend: Atualizar order_service.py e endpoints
3. Frontend: Criar API client e hook useOrder
4. Frontend: Conectar modais Buy/Sell ao backend
5. Deploy: Fazer deploy no Rococo
6. Teste: Fluxo Sell completo funcionando

### 🟡 IMPORTANTE (Desejável)
7. Frontend: Página de detalhes da ordem
8. Frontend: Lista de ordens
9. UX: Loading states e error handling
10. Teste: Fluxo Buy e cancelamento

### 🟢 NICE-TO-HAVE (Se sobrar tempo)
11. Notificações toast
12. Transaction links
13. Testes automatizados
14. Documentação completa

---

## Estimativa de Tempo

**Fase 1 (Backend):** 4-5 horas  
**Fase 2 (Frontend):** 3-4 horas  
**Fase 3 (Deploy):** 1-2 horas  
**Fase 4 (Testes):** 2-3 horas  
**Fase 5 (UX):** 2-3 horas  
**Fase 6 (Docs):** 1 hora  

**Total:** 13-18 horas de trabalho focado

---

## Notas Importantes

1. **Priorize funcionalidade sobre perfeição** - Um fluxo funcionando é melhor que vários pela metade
2. **Teste continuamente** - Não deixe para testar tudo no final
3. **Commit frequente** - Pequenos commits facilitam rollback
4. **Mock fallback** - Se blockchain falhar, frontend deve degradar graciosamente
5. **Logs detalhados** - Essencial para debug durante apresentação

