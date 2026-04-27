import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: number;
}

interface MetricsGridProps {
  metrics: Metric[];
}

const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold tracking-wide">Model Performance</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg bg-secondary px-3 py-3 space-y-1"
          >
            <span className="label-technical">{m.label}</span>
            <p className="text-lg font-semibold font-mono text-foreground">
              {m.value.toFixed(3)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MetricsGrid;
