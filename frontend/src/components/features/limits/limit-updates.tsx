'use client'

export function LimitUpdates() {
  return (
    <div className="space-y-3 mt-6">
      <h2 className="text-[15px] font-pixel font-bold text-white">
        Atualizações de Limites
      </h2>

      <div className="rounded-xl bg-white/[0.02] backdrop-blur-sm p-8 border-2 border-white/[0.08] text-center">
        <p className="text-[12px] text-muted-foreground">
          Nenhuma atualização de limite encontrada
        </p>
      </div>
    </div>
  )
}
