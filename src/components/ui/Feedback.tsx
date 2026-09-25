import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export function LoadingState() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-8 bg-slate-200 rounded w-32"></div>
      </div>
      <div className="h-64 bg-slate-100 rounded-lg border border-slate-200"></div>
    </div>
  )
}

export function EmptyState({ title, description, actionText, onAction, icon }: { title: string; description: string; actionText?: string; onAction?: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100">
        {icon || (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ title = "Ha ocurrido un error", description, onRetry }: { title?: string; description: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-rose-100 rounded-lg shadow-sm">
      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Intentar nuevamente
        </Button>
      )}
    </div>
  )
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState 
      title="Sin conexión a internet"
      description="Parece que has perdido la conexión. Verifica tu red e intenta nuevamente para continuar trabajando."
      onRetry={onRetry}
    />
  )
}

export function ForbiddenState({ onGoBack }: { onGoBack?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">Acceso Denegado</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">No tienes los permisos necesarios para visualizar esta información o realizar esta acción. Contacta al administrador si crees que esto es un error.</p>
      {onGoBack && (
        <Button onClick={onGoBack} variant="outline" size="sm">
          Volver atrás
        </Button>
      )}
    </div>
  )
}

export function SuccessModal({ isOpen, onClose, title, description, actionText }: { isOpen: boolean; onClose: () => void; title: string; description: string; actionText?: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center p-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="w-full">
          <Button onClick={onClose} variant="primary" className="w-full justify-center">
            {actionText || 'Entendido'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
