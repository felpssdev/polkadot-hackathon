'use client'

interface VerificationProgressProps {
  verified: number
  total: number
}

export function VerificationProgress({
  verified,
  total,
}: VerificationProgressProps) {
  const percentage = (verified / total) * 100

  return (
    <div className="relative rounded-xl bg-white/[0.02] backdrop-blur-sm p-5 space-y-4 border-2 border-white/[0.08] scanlines">
      <div>
        <h3 className="text-[13px] font-semibold text-white mb-2">
          Verificar pelo menos uma rede social
        </h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Verifique pelo menos uma rede social para aumentar seus limites e
          continuar aumentando conforme completa transações.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-pixel text-muted-foreground">
            Redes Verificadas
          </span>
          <span className="text-[11px] font-pixel font-bold text-primary">
            {verified}/{total}
          </span>
        </div>
        <div className="w-full h-2 bg-background/60 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
