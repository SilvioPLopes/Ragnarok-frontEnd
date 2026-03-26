// components/ui/captcha-modal.tsx
'use client'

import { useGame } from '@/lib/game-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export function CaptchaModal() {
  const { captchaVisible, hideCaptcha } = useGame()

  return (
    <Dialog open={captchaVisible} onOpenChange={(open) => { if (!open) hideCaptcha() }}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-primary">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle className="font-[family-name:var(--font-pixel)] text-sm text-primary">
              VERIFICAÇÃO DE SEGURANÇA
            </DialogTitle>
          </div>
          <DialogDescription className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
            O sistema de segurança detectou atividade incomum. Por favor, confirme que você é humano.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={hideCaptcha}
            className="w-full font-[family-name:var(--font-pixel)] text-sm pixel-button"
          >
            SOU HUMANO
          </Button>
        </DialogFooter>
        {/* TODO: integrar reCAPTCHA/hCaptcha — POST /api/antifraude/captcha/verify */}
      </DialogContent>
    </Dialog>
  )
}
