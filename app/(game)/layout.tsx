// app/(game)/layout.tsx
import { GameProvider } from '@/lib/game-context'
import { CaptchaModal } from '@/components/ui/captcha-modal'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      {children}
      <CaptchaModal />
    </GameProvider>
  )
}
