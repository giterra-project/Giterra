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

function InsightCard({ label, title, preview, icon: Icon, color = "text-indigo-400", onClick }: InsightCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-full h-full text-left rounded-xl border border-white/10 bg-white/5 p-4 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col"
    >
      {/* Holographic Scanline Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 translate-y-[-100%] group-hover:translate-y-[100%] transition-all duration-1000 pointer-events-none" />

      <div className="flex items-start justify-between mb-2">
        <div className={`text-[10px] font-bold tracking-widest uppercase ${color} opacity-80 group-hover:opacity-100 transition-opacity`}>
          {label}
        </div>
        {Icon && <Icon size={16} className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`} />}
      </div>

      <div className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
        {title}
      </div>

      {preview && (
        <div className="mt-auto text-xs text-white/50 leading-relaxed line-clamp-3 group-hover:text-white/70 transition-colors">
          {preview}
        </div>
      )}

      {/* Glowing Corner Accents */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

export default InsightCard;
