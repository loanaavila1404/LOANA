'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  variant?: 'default' | 'light'
}

export function Modal({ isOpen, onClose, title, children, footer, className, variant = 'default' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isLight = variant === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={cn(
          isLight 
            ? "bg-white border-slate-200" 
            : "bg-canvas border-border",
          "rounded-xl shadow-lg border w-full max-w-lg flex flex-col max-h-[90vh]", 
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={cn("flex items-center justify-between p-4 border-b", isLight ? "border-slate-200" : "border-border")}>
          <h2 id="modal-title" className={cn("text-lg font-semibold font-heading", isLight ? "text-slate-900" : "text-graphite-900")}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className={cn(
              "p-1 rounded-md transition-colors focus:outline-none focus:ring-2",
              isLight 
                ? "text-slate-500 hover:bg-slate-100 focus:ring-[#c4121a]" 
                : "text-graphite-500 hover:bg-graphite-100 focus:ring-primary"
            )}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className={cn("p-4 border-t rounded-b-xl", isLight ? "border-slate-200 bg-slate-50" : "border-border bg-canvas/50")}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
