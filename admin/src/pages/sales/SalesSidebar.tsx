// /pages/sales/SalesSidebar.tsx
import React from 'react';

type SalesTabKey =
  | 'Daily Income'
  | 'Sales Per Day'
  | 'Sales Summary'
  | 'Orders Per Table'
  | 'Orders Per Day'
  | 'Item Sales / Top Selling'
  | 'Category Sales'
  | 'Payment Method Breakdown'
  | 'Hourly Heatmap';

interface Props {
  tabs: readonly SalesTabKey[];
  active: SalesTabKey;
  onSelect: (t: SalesTabKey) => void;
}

export default function SalesSidebar({ tabs, active, onSelect }: Props) {
  return (
    <div className="sticky top-6 h-[calc(100vh-48px)] overflow-y-auto rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Sales</h3>
      <nav className="flex flex-col gap-1">
        {tabs.map((t) => {
          const isActive = t === active;
          return (
            <button
              key={t}
              onClick={() => onSelect(t)}
              className={`text-left px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-[#820D17] text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              {t}
            </button>
          );
        })}
      </nav>

      <div className="pt-4 mt-6 text-xs text-gray-500 border-t">
        <div className="mb-2 font-medium">Tip</div>
        <div>
          Use the master table above to search, filter by date, export, or view
          order details. The selected widget appears below the table.
        </div>
      </div>
    </div>
  );
}
