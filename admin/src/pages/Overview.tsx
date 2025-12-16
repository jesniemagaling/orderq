import { useEffect, useMemo, useState } from 'react';
import { Bell, DollarSign, Users, Package } from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'react-toastify';
import { adminSocket } from '../lib/socket';

// CHART.JS (BAR CONFIG)
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Order = {
  id: number;
  table_id?: number;
  table_number?: string;
  name?: string;
  total_amount?: number;
  status?: string;
  created_at?: string;
};

type TopItem = { name: string; sold: number; delta?: number };

export default function Overview() {
  const [loading, setLoading] = useState(true);

  const [tablesTotal, setTablesTotal] = useState(0);
  const [tablesOccupied, setTablesOccupied] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [lowStocksCount, setLowStocksCount] = useState(0);

  const [latestOrders, setLatestOrders] = useState<Order[]>([]);
  const [salesSeries, setSalesSeries] = useState<
    { hour: number; value: number }[]
  >([]);
  const [topSelling, setTopSelling] = useState<TopItem[]>([]);

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    });

  const occupancyText = useMemo(
    () => `${tablesOccupied}/${tablesTotal}`,
    [tablesOccupied, tablesTotal]
  );

  useEffect(() => {
    const refreshDashboard = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const date = today.toISOString().slice(0, 10);

        const [
          tablesRes,
          latestOrdersRes,
          allOrdersRes,
          topItemsRes,
          summaryRes,
          menuRes,
          hourlyRes,
        ] = await Promise.allSettled([
          api.get('/tables'),
          api.get('/orders?limit=12&sort=desc'),
          api.get('/orders'),
          api.get('/menu/top-selling'),
          api.get(`/sales/summary?start=${date}&end=${date}`),
          api.get('/menu'),
          api.get('/sales/hourly-heatmap', { params: { date } }),
        ]);

        if (tablesRes.status === 'fulfilled') {
          const tables = tablesRes.value.data;
          setTablesTotal(tables.length);
          setTablesOccupied(
            tables.filter((t: any) => t.status !== 'available').length
          );
        }

        if (latestOrdersRes.status === 'fulfilled')
          setLatestOrders(latestOrdersRes.value.data || []);

        if (allOrdersRes.status === 'fulfilled') {
          const activeCount = allOrdersRes.value.data.filter((o: any) =>
            ['pending', 'in_progress', 'unserved'].includes(o.status)
          ).length;
          setActiveOrdersCount(activeCount);
        }

        if (menuRes.status === 'fulfilled') {
          const lowStockItems = menuRes.value.data.filter(
            (m: any) => m.stocks <= 10
          );
          setLowStocksCount(lowStockItems.length);
        }

        if (summaryRes.status === 'fulfilled') {
          const d = summaryRes.value.data;
          setTodayRevenue(Number(d?.gross_sales || 0));
        }

        if (hourlyRes.status === 'fulfilled') {
          const formatted = hourlyRes.value.data.map((h: any) => ({
            hour: h.hour,
            value: Number(h.total_sales || 0),
          }));
          setSalesSeries(formatted);
        }

        if (topItemsRes.status === 'fulfilled')
          setTopSelling(topItemsRes.value.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    adminSocket.on('tableStatusUpdate', refreshDashboard);
    adminSocket.on('newOrder', refreshDashboard);
    refreshDashboard();

    return () => {
      adminSocket.off('tableStatusUpdate', refreshDashboard);
      adminSocket.off('newOrder', refreshDashboard);
    };
  }, []);

  const getFull24HourSeries = () => {
    const fullHours = Array.from({ length: 24 }, (_, i) => i);

    return fullHours.map((h) => {
      const found = salesSeries.find((s) => s.hour === h);
      return {
        hour: h,
        value: found ? found.value : 0,
      };
    });
  };

  const paddedSalesSeries = getFull24HourSeries();

  const chartData = {
    labels: paddedSalesSeries.map((s) => {
      const localHour = (s.hour + 8) % 24;
      const suffix = localHour >= 12 ? 'PM' : 'AM';
      const hour12 = localHour % 12 === 0 ? 12 : localHour % 12;
      return `${hour12}:00 ${suffix}`;
    }),
    datasets: [
      {
        label: 'Hourly Sales',
        data: paddedSalesSeries.map((s) => s.value),
        backgroundColor: '#6e0b13',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: {
        barPercentage: 0.3,
        categoryPercentage: 0.5,
        ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 0 },
      },
      y: { beginAtZero: true },
    },
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Occupancy */}
        <div className="flex items-center justify-between p-5 bg-white rounded-lg shadow-sm">
          <div>
            <p className="text-sm text-gray-500">Occupancy</p>
            <p className="text-2xl font-semibold">{occupancyText}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50">
            <Users size={28} className="text-red-500" />
          </div>
        </div>

        {/* Active Orders */}
        <div className="flex items-center justify-between p-5 bg-white rounded-lg shadow-sm">
          <div>
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="text-2xl font-semibold">{activeOrdersCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50">
            <Bell size={28} className="text-yellow-600" />
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="flex items-center justify-between p-5 bg-white rounded-lg shadow-sm">
          <div>
            <p className="text-sm text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(todayRevenue)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50">
            <DollarSign size={28} className="text-green-500" />
          </div>
        </div>

        {/* Low Stocks */}
        <div className="flex items-center justify-between p-5 bg-white rounded-lg shadow-sm">
          <div>
            <p className="text-sm text-gray-500">Low Stocks Menu</p>
            <p className="text-2xl font-semibold">{lowStocksCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50">
            <Package size={28} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latest Orders */}
        <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Latest Orders</h2>

          <div className="flex-1 overflow-x-auto rounded-lg shadow-inner">
            <table className="w-full text-sm table-auto">
              <thead className="sticky top-0 text-xs font-medium text-white border-b bg-primary">
                <tr>
                  <th className="py-2 pr-2 pl-8 text-left w-[10%]">Order#</th>
                  <th className="py-2 pr-3 pl-6 text-left w-[15%]">Time</th>
                  <th className="py-2 px-3 text-left w-[10%]">Table</th>
                  <th className="py-2 px-3 text-right w-[10%]">Amount</th>
                  <th className="py-2 px-3 text-center w-[20%]">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {latestOrders.length > 0 ? (
                  latestOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="transition-colors duration-150 hover:bg-gray-50"
                    >
                      {/* Order ID */}
                      <td className="px-3 pl-8 pr-3 text-left text-gray-700">
                        {o.id}
                      </td>

                      {/* Time */}
                      <td className="px-3 py-3 text-left text-gray-600">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Manila',
                            })
                          : '-'}
                      </td>

                      {/* Table */}
                      <td className="px-3 py-3 text-left text-gray-700">
                        {o.table_number || o.table_id || '-'}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 font-medium text-right text-gray-800">
                        {formatCurrency(Number(o.total_amount || 0))}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-block min-w-[75px] text-center ${
                            o.status === 'pending'
                              ? 'bg-gray-100 text-gray-700'
                              : o.status === 'unserved'
                              ? 'bg-yellow-100 text-yellow-700'
                              : o.status === 'served'
                              ? 'bg-blue-100 text-blue-700'
                              : o.status === 'canceled'
                              ? 'bg-red-100 text-red-700'
                              : ''
                          }`}
                        >
                          {o.status
                            ?.replace('_', ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase()) || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No recent orders available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col h-full space-y-6">
          {/* Hourly Sales Chart (BAR) */}
          <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-2 font-semibold">Hourly Sales Today</h3>
            <div className="w-full h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="flex-1 p-6 overflow-y-auto bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 font-semibold">Top Selling Items</h3>
            <ul className="space-y-3">
              {topSelling.map((t, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">Sold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{t.sold}</div>
                    <div
                      className={`text-xs ${
                        t.delta && t.delta > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {t.delta ? `${t.delta > 0 ? '+' : ''}${t.delta}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
