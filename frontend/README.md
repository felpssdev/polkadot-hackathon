# PolkaPay - 8bit Wallet Frontend

Interface 8-bit para o hackathon Latin Hack com Polkadot.

## 🎮 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização utilitária
- **8bitcn/ui** - Componentes 8-bit baseados em shadcn/ui
- **Lucide React** - Ícones modernos
- **Press Start 2P** - Fonte pixel art do Google Fonts

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Layout raiz com tema dark e fonte pixel
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globais e tema 8-bit
├── components/
│   ├── ui/                 # Componentes base do 8bitcn
│   │   ├── 8bit/           # Componentes 8-bit estilizados
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── avatar.tsx
│   │   └── [componente].tsx
│   ├── layout/             # Componentes de layout
│   │   └── header.tsx      # Cabeçalho com menu e logo
│   └── features/           # Componentes de funcionalidades
│       ├── balance-card.tsx          # Card de saldo
│       ├── action-button.tsx         # Botões de ação
│       ├── quick-tour.tsx            # Tour rápido do app
│       ├── transaction-limits.tsx    # Limites de transação
│       └── bottom-navigation.tsx     # Navegação inferior
└── lib/
    └── utils.ts            # Utilitários (cn, etc)
```

### Padrões de Componentes

#### 1. **Component Pattern com Props Interfaces**

Todos os componentes utilizam interfaces TypeScript para props tipadas:

```typescript
interface BalanceCardProps {
  buyPrice: string
  currency: string
  balance: string
  balanceInLocal: string
}

export function BalanceCard({ buyPrice, currency, balance, balanceInLocal }: BalanceCardProps) {
  // ...
}
```

#### 2. **Composition Pattern**

Componentes são compostos de componentes menores e reutilizáveis:

```typescript
// page.tsx compõe diversos componentes
<Header />
<BalanceCard />
<ActionButton />
<QuickTour />
```

#### 3. **Separation of Concerns**

- **Layout components**: Estrutura da página (Header)
- **Feature components**: Funcionalidades específicas (BalanceCard, TransactionLimits)
- **UI components**: Componentes base reutilizáveis (Button, Card, Badge)

#### 4. **Client Components**

Componentes interativos usam `'use client'` para habilitar React hooks e interatividade:

```typescript
'use client'

export function ActionButton({ onClick, ... }) {
  return <Button onClick={onClick}>...</Button>
}
```

## 🎨 Design System

### Cores (Tema Dark 8-bit)

- **Primary**: Roxo vibrante (#7C3AED) - Ações principais
- **Secondary**: Azul elétrico - Destaques
- **Background**: Preto profundo - Fundo
- **Muted**: Cinza azulado - Textos secundários

### Tipografia

- **Fonte Principal**: Press Start 2P (pixel art)
- **Letter Spacing**: 0.05em para melhor legibilidade
- **Line Height**: 1.6 para conforto visual

### Estilos 8-bit

```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

### Componentes Customizados

Todos os componentes seguem o estilo 8-bit com:
- Bordas sólidas sem arredondamento (`--radius: 0rem`)
- Efeitos de hover com transições
- Ícones com estilo pixelado
- Sombras e bordas pronunciadas

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 🔧 Adicionar Novos Componentes 8bitcn

```bash
# Adicionar um componente específico do registro 8bitcn
npx shadcn@latest add @8bitcn/[component-name] --yes

# Exemplos:
npx shadcn@latest add @8bitcn/button --yes
npx shadcn@latest add @8bitcn/dialog --yes
npx shadcn@latest add @8bitcn/input --yes
```

## 🎯 Funcionalidades Implementadas

- ✅ Header com menu hamburger e logo
- ✅ Card de preço de compra com badge animado
- ✅ Display de saldo disponível
- ✅ Botões de ação (Wallet, Deposit, Withdraw, Support)
- ✅ Card de tour rápido do app
- ✅ Indicadores de carousel
- ✅ Card de limites de transação
- ✅ Navegação inferior com botões principais e QR Code

## 🚀 Próximos Passos

- [ ] Integração com Polkadot.js
- [ ] Conectar wallet Web3
- [ ] Implementar funcionalidades de compra/venda
- [ ] Adicionar páginas de transações
- [ ] Sistema de notificações
- [ ] Animações e transições avançadas
- [ ] Modo responsivo otimizado

## 📝 Notas de Desenvolvimento

### ESLint Config

Usando `@rocketseat/eslint-config` que requer:
- Single quotes ao invés de double quotes
- Sem ponto-e-vírgula no final das linhas
- Formatação consistente com Prettier

### Tailwind CSS 4

O projeto usa Tailwind CSS 4 (beta) com a nova sintaxe:
- `@import "tailwindcss"` ao invés de `@tailwind`
- Configuração inline com `@theme`
- Compatível com PostCSS

### 8bitcn Registry

Os componentes 8-bit vêm do registry customizado:
- URL: `https://8bitcn.com/r/{name}.json`
- Baseado em shadcn/ui com estilização retro
- Mantém compatibilidade total com shadcn

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto foi desenvolvido para o Latin Hack - Polkadot Hackathon.

---

Desenvolvido com 💜 e muito pixel art para o Latin Hack
