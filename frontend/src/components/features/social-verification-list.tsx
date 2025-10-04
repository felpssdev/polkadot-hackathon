'use client'

import {
  CheckCircle,
  Circle,
  Twitter,
  MessageCircle,
  Send,
  Github,
} from 'lucide-react'
import {
  mockSocialVerifications,
  getVerificationProgress,
} from '@/lib/mock-data'

interface SocialVerificationListProps {
  showProgress?: boolean
}

export function SocialVerificationList({
  showProgress = true,
}: SocialVerificationListProps) {
  const progress = getVerificationProgress()

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />
      case 'discord':
        return <MessageCircle className="w-4 h-4" />
      case 'telegram':
        return <Send className="w-4 h-4" />
      case 'github':
        return <Github className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return 'Twitter'
      case 'discord':
        return 'Discord'
      case 'telegram':
        return 'Telegram'
      case 'github':
        return 'GitHub'
      default:
        return platform
    }
  }

  return (
    <div className="space-y-4">
      {showProgress && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-pixel text-sm font-bold">
              Verification Progress
            </h3>
            <span className="text-primary text-xs font-pixel">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/60 text-xs font-pixel mt-2">
            Verify more social accounts to increase your transaction limits
          </p>
        </div>
      )}

      <div className="space-y-2">
        {mockSocialVerifications.map((social) => (
          <div
            key={social.platform}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex items-center gap-2">
              {social.verified ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-white/40" />
              )}
              {getPlatformIcon(social.platform)}
            </div>
            <div className="flex-1">
              <p className="text-white font-pixel text-sm font-bold">
                {getPlatformName(social.platform)}
              </p>
              {social.username && (
                <p className="text-white/60 text-xs font-pixel">
                  {social.username}
                </p>
              )}
            </div>
            <div className="text-right">
              {social.verified ? (
                <span className="text-green-400 text-xs font-pixel">
                  Verified
                </span>
              ) : (
                <button className="text-primary text-xs font-pixel hover:text-primary/80 transition-colors">
                  Verify
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
