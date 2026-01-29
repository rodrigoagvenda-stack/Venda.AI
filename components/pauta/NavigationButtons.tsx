'use client'

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationButtonsProps {
  onBack?: () => void
  onNext: () => void
  showBack?: boolean
  nextLabel?: string
  nextDisabled?: boolean
  isLoading?: boolean
}

export function NavigationButtons({
  onBack,
  onNext,
  showBack = true,
  nextLabel = 'Continuar',
  nextDisabled = false,
  isLoading = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      ) : (
        <div />
      )}

      <Button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
