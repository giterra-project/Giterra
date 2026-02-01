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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/20 bg-black/80 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)] flex flex-col"
      >
        {/* Holographic Header Background */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-indigo-900/40 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="prose prose-invert prose-indigo max-w-none">
            <div className="text-base text-gray-300 leading-8 whitespace-pre-line font-medium">
              {content}
            </div>
          </div>

          {/* Coding-style decorative footer */}
          <div className="mt-12 pt-6 border-t border-dashed border-white/10 flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            <span>// End of Stream</span>
            <span>Sys.Analysis_v2.0</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default InsightModal
