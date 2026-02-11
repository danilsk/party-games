export function ScoreCounter({
  label,
  value,
  onChange,
  color = 'purple',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: 'purple' | 'green' | 'red';
}) {
  const colorClasses = {
    purple: 'bg-purple-600 active:bg-purple-700',
    green: 'bg-green-600 active:bg-green-700',
    red: 'bg-red-600 active:bg-red-700',
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-300 text-sm min-w-[60px]">{label}</span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-lg font-bold transition-colors"
      >
        −
      </button>
      <span className="text-2xl font-bold tabular-nums min-w-[40px] text-center">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className={`w-10 h-10 rounded-full ${colorClasses[color]} flex items-center justify-center text-lg font-bold transition-colors`}
      >
        +
      </button>
    </div>
  );
}
