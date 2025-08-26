interface CompletionPieChartProps {
  completed: number;
  total: number;
  size?: number;
}

const CompletionPieChart = ({ completed, total, size = 48 }: CompletionPieChartProps) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const circumference = 2 * Math.PI * 16; // radius of 16
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-foreground">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export { CompletionPieChart };