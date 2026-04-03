import { ChevronDown } from 'lucide-react';

interface AutoRefreshSelectProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export default function AutoRefreshSelect({
  value,
  onChange,
  className = '',
}: AutoRefreshSelectProps) {
  return (
    <div
      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none bg-transparent pl-4 pr-10 py-2 text-sm font-medium text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#820D17]/20"
        aria-label="Auto refresh rate"
      >
        <option value={0}>Auto Refresh: Off</option>
        <option value={15}>Auto Refresh: 15s</option>
        <option value={30}>Auto Refresh: 30s</option>
        <option value={60}>Auto Refresh: 60s</option>
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 text-gray-500"
      />
    </div>
  );
}
