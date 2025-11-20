import { useEffect, useState } from 'react';
import api from '../lib/axios';
import io from 'socket.io-client';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { Swiper, SwiperSlide } from 'swiper/react';
import EditMenu from '../components/EditMenu';
import { toast } from 'react-toastify';

const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  stocks: number;
  status: 'in_stock' | 'out_of_stock';
}

export default function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<
    'all' | 'in_stock' | 'out_of_stock'
  >('all');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const openEditModal = (id: number) => {
    setSelectedId(id);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedId(null);
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get<MenuItem[]>('/menu');
      const data = res.data;
      setMenu(data);

      const uniqueCategories: string[] = [
        'All',
        ...Array.from(
          new Set(data.map((item) => String(item.category || 'Uncategorized')))
        ),
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    // for real-time menu updates
    socket.on('menuUpdated', (data) => {
      console.log('[Menu] Real-time menu update:', data);

      if (data.type === 'update') {
        setMenu((prev) =>
          prev.map((item) =>
            item.id === data.item.id ? { ...item, ...data.item } : item
          )
        );
      } else if (data.type === 'add') {
        setMenu((prev) => [data.item, ...prev]);
      } else if (data.type === 'delete') {
        setMenu((prev) => prev.filter((item) => item.id !== data.item.id));
      }
    });

    return () => {
      socket.off('menuUpdated');
    };
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      setMenu((prev) => prev.filter((item) => item.id !== id));
      toast.success(`${name} deleted from the menu.`);
    } catch (err) {
      console.error('Failed to delete menu item:', err);
      toast.error(`Failed to delete ${name}.`);
    }
  };

  const formatPrice = (price: number | string) => {
    const num = Number(price);
    return isNaN(num) ? '₱0.00' : `₱${num.toFixed(2)}`;
  };

  // Filtering logic
  const filteredMenu = menu.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStock = stockFilter === 'all' || item.status === stockFilter;
    return matchesCategory && matchesStock;
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#820D17]/40"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(
                  e.target.value as 'all' | 'in_stock' | 'out_of_stock'
                )
              }
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#820D17]/40"
            >
              <option value="all">All</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <Button
            onClick={() => (window.location.href = '/admin/add-menu')}
            className="flex items-center gap-2 "
          >
            <PlusCircle size={18} /> Add Menu
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <Swiper
            slidesPerView="auto"
            spaceBetween={0}
            freeMode={true}
            grabCursor={true}
            allowTouchMove={true}
            className="min-w-[1190px]"
          >
            <SwiperSlide style={{ width: 'auto' }}>
              <table className="min-w-[1190px] w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 font-semibold text-gray-700">
                      Product ID
                    </th>
                    <th className="p-2 font-semibold text-gray-700">Status</th>
                    <th className="p-2 font-semibold text-gray-700">
                      Product Name
                    </th>
                    <th className="p-2 font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="p-2 font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="p-2 font-semibold text-gray-700 text-center">
                      Stocks
                    </th>
                    <th className="p-2 font-semibold text-gray-700 text-center">
                      Price
                    </th>
                    <th className="p-2 font-semibold text-gray-700 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center text-gray-500 py-6"
                      >
                        No menu items found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMenu.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-2 text-gray-700">
                          #{item.id.toString().padStart(6, '0')}
                        </td>
                        <td className="p-2">
                          <span
                            className={`${
                              item.status === 'in_stock'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.status === 'in_stock'
                              ? 'In Stock'
                              : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-2 text-gray-800">{item.name}</td>
                        <td className="p-2 text-gray-800">
                          {item.category || '—'}
                        </td>
                        <td className="p-2 text-gray-500 truncate max-w-xs">
                          {item.description || '—'}
                        </td>
                        <td className="p-2 text-center text-gray-700">
                          {item.stocks}
                        </td>
                        <td className="p-2 text-center text-gray-700">
                          {formatPrice(item.price)}
                        </td>
                        <td className="p-2 text-center space-x-3">
                          <button
                            className="text-green-600 hover:text-green-800 font-medium inline-flex items-center gap-1"
                            onClick={() => openEditModal(item.id)}
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
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
      <EditMenu
        isOpen={isEditOpen}
        onClose={closeEditModal}
        menuId={selectedId}
        onUpdated={fetchMenu}
      />
    </>
  );
}
