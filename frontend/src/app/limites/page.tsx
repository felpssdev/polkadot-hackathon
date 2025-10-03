'use client'

import { useRouter } from 'next/navigation'
import { LimitsHeader } from '@/components/features/limits/limits-header'
import { CurrentLimits } from '@/components/features/limits/current-limits'
import { VerificationProgress } from '@/components/features/limits/verification-progress'
import { SocialVerificationList } from '@/components/features/limits/social-verification-list'
import { LimitsFAQ } from '@/components/features/limits/limits-faq'
import { LimitUpdates } from '@/components/features/limits/limit-updates'

export default function LimitsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-8">
      <LimitsHeader onBack={() => router.push('/')} />

      <main className="max-w-md mx-auto space-y-5 py-4 px-5">
        {/* Current Limits */}
        <CurrentLimits />

        {/* Verification Progress Card */}
        <VerificationProgress verified={0} total={1} />

        {/* Verification Instructions */}
        <div className="space-y-3">
          <h2 className="text-sm font-pixel font-bold text-white">
            Verificar e Aumentar Limites
          </h2>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Todas as tarefas no P2P.ME usam verificação Zk, mantendo seus dados
            privados para sempre enquanto aumenta seus limites.
          </p>
        </div>

        {/* Social Verification List */}
        <SocialVerificationList />

        {/* FAQ Section */}
        <LimitsFAQ />

        {/* Limit Updates History */}
        <LimitUpdates />
      </main>
    </div>
  )
}
