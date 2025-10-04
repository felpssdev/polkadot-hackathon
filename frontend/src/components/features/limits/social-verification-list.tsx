'use client'

import { FaXTwitter, FaFacebook, FaLinkedin, FaGithub } from 'react-icons/fa6'
import {
  mockUserLimits,
  mockExchangeRate,
  formatCurrency,
} from '@/lib/mock-data'

interface SocialNetwork {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  limit: string
  reward: string
  verified?: boolean
}

const socialNetworks: SocialNetwork[] = [
  {
    id: 'twitter',
    name: 'X',
    icon: FaXTwitter,
    limit: formatCurrency(50 * mockExchangeRate, 'BRL'),
    reward: '+0.5 USDC',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FaFacebook,
    limit: formatCurrency(50 * mockExchangeRate, 'BRL'),
    reward: '+0.5 USDC',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: FaLinkedin,
    limit: formatCurrency(mockUserLimits.buyLimit * mockExchangeRate, 'BRL'),
    reward: '+2 USDC',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: FaGithub,
    limit: formatCurrency(mockUserLimits.buyLimit * mockExchangeRate, 'BRL'),
    reward: '+2 USDC',
  },
]

export function SocialVerificationList() {
  return (
    <div className="space-y-3">
      {socialNetworks.map((social) => (
        <div
          key={social.id}
          className="relative rounded-xl bg-white/[0.02] backdrop-blur-sm p-4 border-2 border-white/[0.08] scanlines hover:border-primary/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <social.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white mb-1">
                  {social.name}
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {social.reward} Reward
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[16px] font-pixel font-bold text-primary mb-1">
                {social.limit}
              </p>
              <span className="text-[9px] text-muted-foreground">Limit</span>
            </div>
          </div>

          <button className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 text-[10px] font-pixel font-bold text-white hover:from-primary/15 hover:to-secondary/15 active:scale-[0.98] transition-all">
            Verify Now
          </button>
        </div>
      ))}
    </div>
  )
}
