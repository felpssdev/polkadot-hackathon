'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  mockUserLimits,
  mockExchangeRate,
  formatCurrency,
} from '@/lib/mock-data'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'What are the default limits?',
    answer: `For new users:
• Buy Limit: $10 per order, 1 order per day (to start cautiously).
• Sell Limit: ${formatCurrency(mockUserLimits.sellLimit * mockExchangeRate, 'BRL')} per order, up to 10 orders per day (${formatCurrency(mockUserLimits.dailyLimit * mockExchangeRate, 'BRL')} daily limit, since merchants are verified and ready to trade).

For users with at least one zk verification:
• Buy Limit: Your transaction limit per order, up to 5 orders per day.
• Sell Limit: ${formatCurrency(mockUserLimits.sellLimit * mockExchangeRate, 'BRL')} per order, up to 10 orders per day (${formatCurrency(mockUserLimits.dailyLimit * mockExchangeRate, 'BRL')} daily limit).

Maximum limit per transaction: ${formatCurrency(mockUserLimits.monthlyLimit * mockExchangeRate, 'BRL')}.
Monthly buy order limit: 25 orders.
Annual volume limit: ${formatCurrency(mockUserLimits.monthlyLimit * mockExchangeRate * 10, 'BRL')} per user.
Want higher limits? Visit the My Limits section to complete zk verifications and unlock more.`,
  },
  {
    question: 'Are buy and sell limits tracked separately?',
    answer:
      'Yes, buy and sell limits are tracked separately. You can have different limits for each type of transaction.',
  },
  {
    question: 'Can I lose my increased limits?',
    answer:
      'No, once you increase your limits through verifications, they are permanent. However, limits may be reduced due to suspicious activity or terms of service violations.',
  },
]

export function LimitsFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-pixel font-bold text-white">FAQs</h2>
        <button className="text-[11px] text-primary hover:text-primary/80 transition-colors">
          View all
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
