import { JSX } from 'react'
import { IoMdClose } from 'react-icons/io'
import { ModalProps } from '../../utils/types'

export default function Modal({
  open,
  onClose,
  children,
  disableClose = false
}: ModalProps): JSX.Element | null {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-96 rounded-2xl bg-white p-6 text-black shadow-2xl">
        {!disableClose && (
          <button
            onClick={onClose}
            className="text-primary absolute top-2 right-3 hover:text-gray-700"
          >
            <IoMdClose />
          </button>
        )}

        {children}
      </div>
    </div>
  )
}
