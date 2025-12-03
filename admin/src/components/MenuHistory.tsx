import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { adminSocket } from '../lib/socket';

interface MenuHistoryItem {
  id: number;
  menu_id: number;
  action: 'add' | 'update' | 'delete';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: string;
}

export default function MenuHistory() {
  const [history, setHistory] = useState<MenuHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<
    'all' | 'add' | 'update' | 'delete'
  >('all');

  const fetchHistory = async () => {
    try {
      const res = await api.get<MenuHistoryItem[]>('/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch menu history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    adminSocket.on('menuHistoryUpdated', (entry: MenuHistoryItem) => {
      console.log('[MenuHistory] Real-time update:', entry);
      setHistory((prev) => [entry, ...prev]);
    });

    return () => {
      adminSocket.off('menuHistoryUpdated');
    };
  }, []);

  const filteredHistory = history.filter((item) =>
    actionFilter === 'all' ? true : item.action === actionFilter
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu History</h1>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Action Filter
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#820D17]/40"
          >
            <option value="all">All</option>
            <option value="add">Add</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <Swiper
            slidesPerView="auto"
            spaceBetween={0}
            freeMode={true}
            grabCursor={true}
            className="min-w-[1190px]"
          >
            <SwiperSlide style={{ width: 'auto' }}>
              <table className="min-w-[1190px] w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 font-semibold text-gray-700">ID</th>
                    <th className="p-2 font-semibold text-gray-700">Menu ID</th>
                    <th className="p-2 font-semibold text-gray-700">Action</th>
                    <th className="p-2 font-semibold text-gray-700">
                      Old Data
                    </th>
                    <th className="p-2 font-semibold text-gray-700">
                      New Data
                    </th>
                    <th className="p-2 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-gray-500"
                      >
                        No history found for selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="transition border-b hover:bg-gray-50"
                      >
                        <td className="p-2 text-gray-700">
                          #{item.id.toString().padStart(6, '0')}
                        </td>
                        <td className="p-2 text-gray-700">
                          #{item.menu_id.toString().padStart(6, '0')}
                        </td>
                        <td className="p-2 capitalize">
                          <span
                            className={`${
                              item.action === 'add'
                                ? 'text-green-600'
                                : item.action === 'update'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.action}
                          </span>
                        </td>
                        <td className="max-w-xs p-2 text-gray-500 truncate">
                          {item.old_data ? JSON.stringify(item.old_data) : '—'}
                        </td>
                        <td className="max-w-xs p-2 text-gray-500 truncate">
                          {item.new_data ? JSON.stringify(item.new_data) : '—'}
                        </td>
                        <td className="p-2 text-gray-700">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </SwiperSlide>
          </Swiper>
        </div>
      )}
    </>
  );
}
