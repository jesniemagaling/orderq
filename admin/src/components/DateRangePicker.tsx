type Props = {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onApply?: () => void;
};

export default function DateRangePicker({
  start,
  end,
  onStart,
  onEnd,
  onApply,
}: Props) {
  const setPreset = (preset: 'today' | '7days' | 'month') => {
    const now = new Date();
    if (preset === 'today') {
      const s = now.toISOString().slice(0, 10);
      onStart(s);
      onEnd(s);
    } else if (preset === '7days') {
      const sDate = new Date();
      sDate.setDate(now.getDate() - 6);
      onStart(sDate.toISOString().slice(0, 10));
      onEnd(now.toISOString().slice(0, 10));
    } else if (preset === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      onStart(first);
      onEnd(last);
    }
    if (onApply) onApply();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Start</label>
        <input
          type="date"
          value={start}
          onChange={(e) => onStart(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <label className="text-sm text-gray-600">End</label>
        <input
          type="date"
          value={end}
          onChange={(e) => onEnd(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <button onClick={onApply} className="px-3 py-1 bg-gray-200 rounded">
          Apply
        </button>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={() => setPreset('today')}
          className="px-2 py-1 text-sm bg-white border rounded"
        >
          Today
        </button>
        <button
          onClick={() => setPreset('7days')}
          className="px-2 py-1 text-sm bg-white border rounded"
        >
          Last 7
        </button>
        <button
          onClick={() => setPreset('month')}
          className="px-2 py-1 text-sm bg-white border rounded"
        >
          This month
        </button>
      </div>
    </div>
  );
}
