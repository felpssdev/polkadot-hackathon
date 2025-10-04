# 🚀 Instalação e Teste - Integração SubWallet

Guia completo para instalar, testar e usar a integração com SubWallet.

## 📦 Passo 1: Instalar Dependências

```bash
cd frontend
npm install
```

Isso instalará as novas dependências:
- `@polkadot/extension-dapp@^0.46.6`
- `@polkadot/api@^10.11.2`
- `@polkadot/util@^12.6.2`
- `@polkadot/util-crypto@^12.6.2`

## 🦊 Passo 2: Instalar SubWallet

### Chrome/Brave/Edge

1. Acesse: https://subwallet.app/download.html
2. Clique em "Install for Chrome"
3. Clique em "Add to Chrome"
4. Extension instalada! 🎉

### Firefox

1. Acesse: https://subwallet.app/download.html
2. Clique em "Install for Firefox"
3. Siga instruções

### Safari

1. Download da Mac App Store
2. Habilite a extension nas preferências

## 🔑 Passo 3: Criar Conta na SubWallet

### Primeira Vez

1. **Abrir SubWallet** - Clique no ícone da extension
2. **"Create a new account"**
3. **IMPORTANTE:** Anote sua **seed phrase** (12/24 palavras)
   - ⚠️ **NUNCA compartilhe**
   - ⚠️ **Salve em local seguro**
   - ⚠️ **Você perderá acesso aos fundos se perder**
4. **Definir senha** - Para proteger a wallet
5. **Pronto!** Sua conta foi criada

### Já tem conta?

1. **"Import an account"**
2. Cole sua seed phrase
3. Defina senha
4. Pronto!

## 🎮 Passo 4: Rodar o Frontend

```bash
cd frontend

# Rodar dev server
npm run dev

# Frontend estará em:
# http://localhost:3000
```

## ✅ Passo 5: Testar Conexão

### 1. Acessar Página de Login

```
http://localhost:3000/wallet
```

Você verá:
- ✅ "Wallets Detected" (verde) se SubWallet está instalada
- ❌ "No Wallet Detected" (amarelo) se não está instalada

### 2. Conectar Wallet

1. **Preencher email** (qualquer email válido)
2. **Clicar "Connect Polkadot Wallet"**
3. **SubWallet abrirá popup**
   - Se primeira vez: "Authorize"
   - Se já autorizou: vai direto
4. **Selecionar conta** (se tiver múltiplas)
5. **✅ Conectado!**

### 3. Ver Status no Header

Após conectar, você verá no canto superior direito:
- 🌊 Ícone da wallet
- Endereço encurtado (ex: `5GrwvaE...HGKutQY`)
- Ponto verde piscando (conectado)

### 4. Dropdown da Wallet

Clique no endereço no header:
- Ver endereço completo
- Copiar endereço
- Trocar de conta (se tiver múltiplas)
- Desconectar

## 🧪 Testar Funcionalidades

### 1. Múltiplas Contas

```javascript
// Se você tem múltiplas contas na SubWallet:
1. Criar 2+ contas na SubWallet
2. Conectar no PolkaPay
3. Sistema mostrará seletor de contas
4. Escolher uma
5. No header, pode trocar de conta
```

### 2. Copiar Endereço

```
1. Clicar no endereço no header
2. Clicar "Copy Address"
3. Ver "Copied!" (verde)
4. Testar: Ctrl+V em qualquer lugar
```

### 3. Desconectar e Reconectar

```
1. Clicar no endereço no header
2. Clicar "Disconnect"
3. Volta para /wallet
4. Conectar novamente
5. Deve reconectar automaticamente com mesma conta
```

### 4. Persistência

```
1. Conectar wallet
2. Recarregar página (F5)
3. Ainda conectado? ✅
4. Fechar e abrir navegador
5. Ainda conectado? ✅
```

## 🎯 Testar com Backend (Futuro)

```typescript
// No componente:
import { useWallet } from '@/contexts/WalletContext'

function LoginWithBackend() {
  const { sign, selectedAccount } = useWallet()
  
  const handleLogin = async () => {
    // 1. Assinar mensagem
    const message = 'Login to PolkaPay'
    const signature = await sign(message)
    
    // 2. Enviar para backend
    const response = await fetch('http://localhost:8000/api/v1/auth/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: selectedAccount?.address,
        message,
        signature
      })
    })
    
    const data = await response.json()
    // data.access_token -> JWT token
    
    // 3. Usar token em requisições futuras
    localStorage.setItem('jwt_token', data.access_token)
  }
  
  return <button onClick={handleLogin}>Login</button>
}
```

## 🐛 Troubleshooting

### "No wallet extension found"

**Problema:** SubWallet não detectada

**Solução:**
1. Verificar se extension está instalada
2. Verificar se está habilitada
3. Recarregar página (F5)
4. Tentar em outra aba

### "No accounts found"

**Problema:** Nenhuma conta na wallet

**Solução:**
1. Abrir SubWallet
2. Criar nova conta
3. Recarregar página
4. Conectar novamente

### "User rejected request"

**Problema:** Usuário clicou "Reject" no popup

**Solução:**
- Normal! Usuário cancelou
- Tentar novamente
- Clicar "Authorize" no popup

### Popup não aparece

**Problema:** SubWallet não mostra popup

**Solução:**
1. Verificar se popup foi bloqueado pelo navegador
2. Olhar barra de endereço para ícone de popup bloqueado
3. Permitir popups para localhost
4. Tentar novamente

### "Failed to connect wallet"

**Solução:**
1. Fechar e reabrir SubWallet
2. Recarregar página
3. Verificar console do browser (F12) para erros
4. Verificar se SubWallet está atualizada

### Wallet conectada mas saldo zerado

**Normal!** É uma conta nova na testnet. Para obter tokens:

1. **Rococo Testnet Faucet**
   ```
   https://faucet.polkadot.io/
   ```
   - Cole seu endereço
   - Escolha "Rococo"
   - Clique "Send me ROC"
   - Aguarde confirmação

2. **Verificar saldo**
   - Abrir SubWallet
   - Trocar para rede "Rococo"
   - Ver saldo de ROC

## 📱 Testar no Mobile

### SubWallet Mobile

1. **Baixar app**
   - iOS: App Store
   - Android: Google Play

2. **Criar/Importar conta**

3. **WalletConnect** (futuro)
   - Frontend gera QR Code
   - App scannea QR
   - Conectado!

## 🎓 Conceitos Importantes

### 1. Extension Injection

```typescript
// Como funciona:
window.injectedWeb3 = {
  'subwallet-js': { enable: fn, version: '1.0' },
  'polkadot-js': { enable: fn, version: '1.0' },
  // ...
}
```

### 2. Fluxo de Autorização

```
1. App chama web3Enable('PolkaPay')
2. Extension detecta request
3. Mostra popup de autorização
4. Usuário aprova
5. Extension retorna API
6. App pode usar web3Accounts(), sign(), etc
```

### 3. Não Custodial

```
✅ App NUNCA tem acesso à seed phrase
✅ App NUNCA tem acesso à private key
✅ Extension mantém controle total
✅ Assinaturas feitas na extension
✅ Usuário aprova cada ação
```

## 📊 Status da Conexão

### Estados Possíveis

```typescript
{
  isConnected: boolean       // Wallet conectada?
  isConnecting: boolean      // Conectando agora?
  selectedAccount: Account   // Conta selecionada
  accounts: Account[]        // Todas as contas
  installedWallets: Wallet[] // Wallets detectadas
  error: string | null       // Erro se houver
}
```

### Fluxo Visual

```
1. 🔴 Desconectado
   - Botão "Connect Wallet"
   - Aviso se não tiver extension

2. 🟡 Conectando
   - Loading spinner
   - "Connecting wallet..."

3. 🟢 Conectado
   - Endereço no header
   - Ponto verde piscando
   - Dropdown funcionando
```

## 🎨 Customização

### Adicionar Nova Wallet

Editar `src/lib/polkadot.ts`:

```typescript
export const SUPPORTED_WALLETS = [
  {
    name: 'subwallet-js',
    displayName: 'SubWallet',
    icon: '🌊',
  },
  {
    name: 'nova-wallet',  // Nova!
    displayName: 'Nova Wallet',
    icon: '⭐',
  },
]
```

### Mudar Cores da Wallet

Editar `src/components/features/wallet-status.tsx`:

```typescript
// Trocar de primary para outra cor
className="bg-green-500/20"  // Era primary/20
className="text-green-500"   // Era primary
```

## 📚 Links Úteis

- **SubWallet Docs:** https://docs.subwallet.app/
- **Polkadot.js Docs:** https://polkadot.js.org/docs/
- **Faucet Rococo:** https://faucet.polkadot.io/
- **Polkadot.js Apps:** https://polkadot.js.org/apps/

## ✨ Features Implementadas

- ✅ Detecta SubWallet, Polkadot.js, Talisman
- ✅ Conexão real com blockchain
- ✅ Suporte a múltiplas contas
- ✅ Troca de conta sem desconectar
- ✅ Copiar endereço
- ✅ Desconexão
- ✅ Persistência (localStorage)
- ✅ Reconexão automática
- ✅ UI/UX polida
- ✅ Feedback visual de estados
- ✅ Tratamento de erros
- ✅ Assinatura de mensagens (preparado)

## 🚀 Próximos Passos

- [ ] Integrar assinatura com backend
- [ ] Mostrar saldo DOT no header
- [ ] WalletConnect para mobile
- [ ] Suporte a Ledger
- [ ] Histórico de transações
- [ ] Múltiplas redes (Polkadot, Kusama, etc)

---

**Pronto para testar!** 🎉

Se tiver problemas, verifique o console do browser (F12) para mensagens de erro detalhadas.

