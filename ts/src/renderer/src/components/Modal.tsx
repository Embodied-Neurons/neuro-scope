import { JSX, ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, onClose, children }: ModalProps): JSX.Element | null {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-2xl p-6 w-96 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-black">
        </button>
        {children}
      </div>
    </div>
  )
}
