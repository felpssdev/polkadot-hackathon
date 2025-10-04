# Wallet Integration - PolkaPay

Integração completa com wallets Polkadot (SubWallet, Polkadot.js, Talisman).

## 🎯 Funcionalidades

### ✅ Detecta wallets instaladas
- SubWallet
- Polkadot.js Extension
- Talisman

### ✅ Conexão real com blockchain
- Usa `@polkadot/extension-dapp`
- Suporta múltiplas contas
- Seleção de conta
- Desconexão
- Assinatura de mensagens

### ✅ Persistência
- Estado da conexão salvo no localStorage
- Reconecta automaticamente
- Lembra conta selecionada

## 📦 Instalação

```bash
cd frontend
npm install
```

As seguintes dependências foram adicionadas:
- `@polkadot/extension-dapp` - Conexão com wallets
- `@polkadot/api` - API Polkadot
- `@polkadot/util` - Utilitários
- `@polkadot/util-crypto` - Criptografia

## 🔌 Como Usar

### 1. Provider (já configurado)

O `WalletProvider` já está no `layout.tsx` e envolve toda a aplicação.

### 2. Hook `useWallet`

```typescript
import { useWallet } from '@/contexts/WalletContext'

function MyComponent() {
  const {
    isConnected,
    isConnecting,
    selectedAccount,
    accounts,
    connect,
    disconnect,
    selectAccount,
    sign,
    installedWallets,
    error
  } = useWallet()

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {selectedAccount?.address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

### 3. Assinar Mensagens

```typescript
const { sign, selectedAccount } = useWallet()

async function signAndSend() {
  const message = 'Login to PolkaPay'
  const signature = await sign(message)
  
  if (signature) {
    // Enviar para backend
    const response = await fetch('/api/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: selectedAccount?.address,
        message,
        signature
      })
    })
  }
}
```

## 🌐 Fluxo de Autenticação

### 1. Usuário acessa `/wallet`

- Sistema detecta wallets instaladas
- Mostra lista de wallets disponíveis
- Exibe aviso se nenhuma wallet instalada

### 2. Usuário conecta wallet

```typescript
// O botão chama:
await connect()
```

Isso:
1. Chama `web3Enable('PolkaPay')` para inicializar
2. Pede permissão ao usuário (popup da wallet)
3. Obtém lista de contas com `web3Accounts()`
4. Salva no estado e localStorage

### 3. Seleção de conta (se múltiplas)

Se o usuário tem múltiplas contas na wallet:
```typescript
selectAccount(account)
```

### 4. Autenticação com backend

```typescript
// 1. Assinar mensagem
const signature = await sign('Login to PolkaPay')

// 2. Enviar para backend
fetch('http://localhost:8000/api/v1/auth/wallet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: selectedAccount.address,
    message: 'Login to PolkaPay',
    signature
  })
})

// 3. Backend verifica assinatura
// 4. Retorna JWT token
// 5. Frontend usa token em requisições
```

## 🔐 Segurança

### Não Custodial
- App NUNCA tem acesso às chaves privadas
- Wallet extension mantém controle total
- Assinaturas feitas pela wallet

### Verificação de Assinatura (Backend)

```python
from app.services.polkadot_service import polkadot_service

is_valid = polkadot_service.verify_signature(
    wallet_address="5GrwvaEF...",
    message="Login to PolkaPay",
    signature="0x..."
)
```

## 🎨 UI/UX

### Status da Wallet

```typescript
// Mostra status visual
{isConnected && (
  <div className="bg-primary/20 border-primary">
    <Wallet className="text-primary" />
    <span>{getFormattedAddress()}</span>
    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
  </div>
)}
```

### Wallets Detectadas

```typescript
{installedWallets.map(wallet => (
  wallet.installed && (
    <div key={wallet.name}>
      {wallet.icon} {wallet.displayName}
    </div>
  )
))}
```

### Erros

```typescript
{error && (
  <div className="bg-red-500/10 border-red-500/30">
    <AlertCircle />
    <p>{error}</p>
  </div>
)}
```

## 🧪 Testando

### 1. Instalar SubWallet

- Chrome/Brave: https://subwallet.app/
- Firefox: https://subwallet.app/
- Mobile: App iOS/Android

### 2. Criar Conta

1. Abrir SubWallet
2. "Create new account"
3. Salvar seed phrase (IMPORTANTE!)
4. Definir senha

### 3. Conectar na App

```bash
# Rodar frontend
cd frontend
npm run dev
```

1. Ir para http://localhost:3000/wallet
2. Preencher email
3. Clicar "Connect Polkadot Wallet"
4. SubWallet abrirá popup
5. Autorizar a conexão
6. Selecionar conta
7. ✅ Conectado!

## 📱 Wallets Suportadas

| Wallet | Desktop | Mobile | Link |
|--------|---------|--------|------|
| SubWallet | ✅ | ✅ | https://subwallet.app |
| Polkadot.js | ✅ | ❌ | https://polkadot.js.org/extension/ |
| Talisman | ✅ | ❌ | https://talisman.xyz |

## 🔧 Customização

### Adicionar Nova Wallet

Edite `src/lib/polkadot.ts`:

```typescript
export const SUPPORTED_WALLETS = [
  {
    name: 'nova-wallet',
    displayName: 'Nova Wallet',
    icon: '⭐',
  },
  // ...
]
```

### Customizar Mensagem de Assinatura

```typescript
const message = `
Welcome to PolkaPay!

Sign this message to login.

Nonce: ${Date.now()}
`

const signature = await sign(message)
```

## 🐛 Troubleshooting

### "No wallet extension found"

**Solução:** Instale SubWallet, Polkadot.js ou Talisman

### "No accounts found"

**Solução:** Crie uma conta na wallet extension

### "User rejected request"

**Solução:** Usuário cancelou no popup da wallet. Normal.

### "Failed to connect"

**Soluções:**
1. Recarregar página
2. Verificar se extension está ativa
3. Verificar console do browser para erros

### Extension não detectada no Firefox

**Solução:** Firefox pode bloquear extensions. Verificar configurações.

## 📚 Documentação Adicional

- [Polkadot.js Extension Docs](https://polkadot.js.org/docs/extension/)
- [SubWallet Docs](https://docs.subwallet.app/)
- [Talisman Docs](https://docs.talisman.xyz/)

## 🎯 Próximos Passos

- [ ] Implementar WalletConnect para mobile
- [ ] Suporte a Ledger
- [ ] Multi-sig wallets
- [ ] Trocar de conta sem desconectar
- [ ] Histórico de transações on-chain
- [ ] Balance checker

## 💡 Dicas

1. **Sempre verifique `isConnected` antes de usar `selectedAccount`**
2. **Trate erros gracefully** - usuário pode cancelar
3. **Forneça feedback visual** - loading, success, error
4. **Permita desconexão fácil** - usuário deve ter controle
5. **Cache com cuidado** - localStorage pode ser limpo

---

**Happy Coding!** 🚀

