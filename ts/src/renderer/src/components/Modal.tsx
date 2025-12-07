import { JSX, ReactNode } from 'react'
import { IoMdClose } from 'react-icons/io'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  disableClose: boolean
}

export default function Modal({
  open,
  onClose,
  children,
  disableClose = false
}: ModalProps): JSX.Element | null {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-2xl p-6 w-96 shadow-2xl relative">
        {!disableClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-black"
          >
            <IoMdClose />
          </button>
        )}

        {children}
      </div>
    </div>
  )
}
