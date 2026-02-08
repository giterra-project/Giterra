import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface InsightCardProps {
  label: string;
  title: string;
  preview?: string;
  icon?: LucideIcon;
  color?: string; // e.g. "text-emerald-400"
  onClick: () => void;
}

function InsightCard({ label, title, preview, icon: Icon, color = "text-teal-300", onClick }: InsightCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.015, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/35 p-4 text-left transition-all hover:border-teal-300/45"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 translate-y-[-100%] transition-all duration-1000 group-hover:translate-y-[100%] group-hover:opacity-100" />

      <div className="flex items-start justify-between mb-2">
        <div className={`text-[10px] font-bold tracking-widest uppercase ${color} opacity-80 transition-opacity group-hover:opacity-100`}>
          {label}
        </div>
        {Icon && <Icon size={16} className={`${color} opacity-60 transition-opacity group-hover:opacity-100`} />}
      </div>

      <div className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-white">
        {title}
      </div>

      {preview && (
        <div className="mt-auto line-clamp-3 text-xs leading-relaxed text-white/55 transition-colors group-hover:text-white/80">
          {preview}
        </div>
      )}

      <div className="absolute right-0 top-0 h-2 w-2 rounded-tr-lg border-r border-t border-teal-200/50 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 h-2 w-2 rounded-bl-lg border-b border-l border-amber-200/50 opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.button>
  );
}

export default InsightCard;
