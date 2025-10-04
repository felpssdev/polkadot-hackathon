'use client'

import { useRouter } from 'next/navigation'
import { LimitsHeader } from '@/components/features/limits/limits-header'
import { CurrentLimits } from '@/components/features/limits/current-limits'
import { SocialVerificationList } from '@/components/features/social-verification-list'
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
