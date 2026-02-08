import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface InsightModalProps {
  title: string
  content: string
  onClose: () => void
}

function InsightModal({ title, content, onClose }: InsightModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 backdrop-blur-sm p-3 md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-black/82 shadow-[0_0_50px_-10px_rgba(255,255,255,0.15)]"
      >
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-20 bg-gradient-to-b from-teal-700/35 to-transparent" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.7)]" />
            <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-white/60 transition-all hover:rotate-90 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-8">
          <div className="prose prose-invert prose-indigo max-w-none">
            <div className="whitespace-pre-line text-sm font-medium leading-7 text-white/80 md:text-base md:leading-8">
              {content}
            </div>
          </div>

          <div className="mt-10 flex justify-between border-t border-dashed border-white/10 pt-5 font-mono text-[10px] uppercase tracking-widest text-white/35">
            <span>// End of Stream</span>
            <span>Sys.Analysis_v2.0</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default InsightModal
