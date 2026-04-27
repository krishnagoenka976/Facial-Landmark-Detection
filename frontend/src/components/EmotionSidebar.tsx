import { motion } from "framer-motion";

interface EmotionData {
  label: string;
  value: number;
}

interface EmotionSidebarProps {
  emotions: EmotionData[];
  detectedLabel: string;
}

const EmotionRow = ({ label, value, index }: EmotionData & { index: number }) => (
  <motion.div
    className="space-y-1.5"
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="flex justify-between label-technical">
      <span>{label}</span>
      <span>{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="h-1 w-full rounded-full overflow-hidden bg-secondary">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-primary"
      />
    </div>
  </motion.div>
);

const EmotionSidebar = ({ emotions, detectedLabel }: EmotionSidebarProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">Emotion Classification</h3>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
        <span className="label-technical">Detected</span>
        <span className="ml-auto text-sm font-semibold text-primary">{detectedLabel}</span>
      </div>

      <div className="space-y-3">
        {emotions.map((emotion, i) => (
          <EmotionRow key={emotion.label} {...emotion} index={i} />
        ))}
      </div>
    </div>
  );
};

export default EmotionSidebar;
