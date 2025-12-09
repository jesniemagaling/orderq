import { useState } from 'react';
import DailyIncome from './sales/DailyIncome';
import OrdersPerTable from './sales/OrdersPerTable';
import OrdersPerDay from './sales/OrdersPerDay';
import ItemSales from './sales/ItemSales';
import Button from '../components/ui/Button';
import SalesGraph from './sales/SalesPerDay';
import CategorySales from './sales/CategorySales';
import SalesSummary from './sales/SalesSummary';
import PaymentMethodBreakdown from './sales/PaymentMethodBreakdown';
import HourlyHeatmap from './sales/HourlyHeatMap';

export default function Sales() {
  const tabs = [
    'Daily Income',
    'Sales Per Day',
    'Sales Summary',
    'Orders Per Table',
    'Orders Per Day',
    'Item Sales / Top Selling',
    'Category Sales',
    'Payment Method Breakdown',
    'Hourly Heatmap',
  ];

  const [active, setActive] = useState('Daily Income');

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold">Sales</h1>

      {/* Tab Buttons */}
      <div className="flex gap-2 pb-2 mb-6 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <Button
            key={tab}
            size="md"
            variant={active === tab ? 'primary' : 'secondary'}
            onClick={() => setActive(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Switch Components */}
      {active === 'Daily Income' && <DailyIncome />}
      {active === 'Sales Per Day' && <SalesGraph />}
      {active === 'Sales Summary' && <SalesSummary />}
      {active === 'Orders Per Table' && <OrdersPerTable />}
      {active === 'Orders Per Day' && <OrdersPerDay />}
      {active === 'Item Sales / Top Selling' && <ItemSales />}
      {active === 'Category Sales' && <CategorySales />}
      {active === 'Payment Method Breakdown' && <PaymentMethodBreakdown />}
      {active === 'Hourly Heatmap' && <HourlyHeatmap />}
    </>
  );
}
