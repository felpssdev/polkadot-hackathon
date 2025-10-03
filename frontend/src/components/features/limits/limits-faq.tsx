'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Quais são os limites padrão?',
    answer: `Para novos usuários:
• Limite de Compra: R$ 10 por pedido, 1 pedido por dia (para começar com cautela).
• Limite de Venda: R$ 100 por pedido, até 10 pedidos por dia (R$ 1.000 limite diário, já que os comerciantes são verificados e prontos para negociar).

Para usuários com pelo menos uma verificação zk:
• Limite de Compra: Seu limite de transação por pedido, até 5 pedidos por dia.
• Limite de Venda: R$ 100 por pedido, até 10 pedidos por dia (R$ 1.000 limite diário).

Limite máximo por transação: R$ 2.000 USDC.
Limite mensal de pedidos de compra: 25 pedidos.
Limite de volume anual: R$ 100.000 USDC por usuário.
Quer limites maiores? Visite a seção Meus Limites para completar verificações zk e desbloquear mais.`,
  },
  {
    question: 'Os limites de compra e venda são rastreados separadamente?',
    answer:
      'Sim, os limites de compra e venda são rastreados separadamente. Você pode ter limites diferentes para cada tipo de transação.',
  },
  {
    question: 'Posso perder meus limites aumentados?',
    answer:
      'Não, uma vez que você aumenta seus limites através de verificações, eles são permanentes. No entanto, limites podem ser reduzidos por atividade suspeita ou violações de termos de serviço.',
  },
]

export function LimitsFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-pixel font-bold text-white">FAQs</h2>
        <button className="text-[11px] text-primary hover:text-primary/80 transition-colors">
          Ver todas
        </button>
      </div>

      <div className="space-y-2">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="rounded-xl bg-white/[0.02] border-2 border-white/[0.08] overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[12px] font-medium text-white pr-4">
                {item.question}
              </span>
              {openIndex === index ? (
                <ChevronUp
                  className="h-4 w-4 text-muted-foreground flex-shrink-0"
                  strokeWidth={2.5}
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4 text-muted-foreground flex-shrink-0"
                  strokeWidth={2.5}
                />
              )}
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
