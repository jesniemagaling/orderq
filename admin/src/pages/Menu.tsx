import { useEffect, useState, useMemo } from 'react';
import api from '../lib/axios';
import { adminSocket } from '../lib/socket';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { Swiper, SwiperSlide } from 'swiper/react';
import EditMenu from '../components/EditMenu';
import { toast } from 'react-toastify';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  stocks: number;
  status: 'in_stock' | 'out_of_stock';
}

type MenuSortKey = 'id' | 'stocks' | 'price' | null;

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
  const [search, setSearch] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterStocksMin, setFilterStocksMin] = useState<number | ''>('');
  const [filterStocksMax, setFilterStocksMax] = useState<number | ''>('');
  const [filterPriceMin, setFilterPriceMin] = useState<number | ''>('');
  const [filterPriceMax, setFilterPriceMax] = useState<number | ''>('');
  const [sortConfig, setSortConfig] = useState<{
    key: MenuSortKey;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

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
    adminSocket.on('menuUpdated', (data) => {
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
      adminSocket.off('menuUpdated');
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

  const sortIndicator = (key: MenuSortKey) => {
    if (sortConfig.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↓' : '↑';
  };

  const handleSort = (key: MenuSortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key
          ? prev.direction === 'asc'
            ? 'desc'
            : 'asc'
          : key === 'price' || key === 'stocks'
          ? 'desc'
          : 'asc',
    }));
  };

  // Filtering logic
  const filteredMenu = menu.filter((item) => {
    // Category & stock filters
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStock = stockFilter === 'all' || item.status === stockFilter;

    // Search filter
    const term = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.id.toString().includes(term);

    // Column filters
    const matchesProductId =
      !filterProductId || item.id.toString().includes(filterProductId);
    const matchesName =
      !filterName || item.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesStocks =
      (filterStocksMin === '' || item.stocks >= filterStocksMin) &&
      (filterStocksMax === '' || item.stocks <= filterStocksMax);
    const matchesPrice =
      (filterPriceMin === '' || Number(item.price) >= filterPriceMin) &&
      (filterPriceMax === '' || Number(item.price) <= filterPriceMax);

    return (
      matchesCategory &&
      matchesStock &&
      matchesSearch &&
      matchesProductId &&
      matchesName &&
      matchesStocks &&
      matchesPrice
    );
  });

  const sortedMenu = useMemo(() => {
    if (!sortConfig.key) return filteredMenu;

    return [...filteredMenu].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      switch (sortConfig.key) {
        case 'id':
          valA = a.id;
          valB = b.id;
          break;

        case 'stocks':
          valA = a.stocks;
          valB = b.stocks;
          break;

        case 'price':
          valA = Number(a.price);
          valB = Number(b.price);
          break;
      }

      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredMenu, sortConfig]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
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
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, description..."
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
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
            onClick={() => (window.location.href = '/admin/menu-history')}
            className="flex items-center gap-2"
          >
            Menu History
          </Button>

          <Button
            onClick={() => (window.location.href = '/admin/add-menu')}
            className="flex items-center gap-2 "
            variant="secondary"
          >
            <PlusCircle size={18} /> Add Menu
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <div className="overflow-auto max-h-[600px] shadow-inner rounded-xl">
          <table className="min-w-[1190px] w-full text-sm text-left border-collapse table-auto">
            <thead className="sticky top-0 z-10 text-white bg-primary">
              <tr>
                <th
                  className="p-2 font-semibold text-center cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  Product ID <span className="ml-1">{sortIndicator('id')}</span>
                </th>
                <th className="p-2 font-semibold">Status</th>
                <th className="p-2 font-semibold">Product Name</th>
                <th className="p-2 font-semibold">Category</th>
                <th className="p-2 font-semibold">Description</th>
                <th
                  className="p-2 font-semibold text-center cursor-pointer"
                  onClick={() => handleSort('stocks')}
                >
                  Stocks <span className="ml-1">{sortIndicator('stocks')}</span>
                </th>
                <th
                  className="p-2 font-semibold text-center cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  Price <span className="ml-1">{sortIndicator('price')}</span>
                </th>
                <th className="p-2 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedMenu.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    No menu items found for selected filters.
                  </td>
                </tr>
              ) : (
                sortedMenu.map((item) => (
                  <tr
                    key={item.id}
                    className="transition border-b hover:bg-gray-50"
                  >
                    <td className="p-3 text-center text-gray-700">
                      #{item.id.toString().padStart(6, '0')}
                    </td>
                    <td className="p-3">
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
                    <td className="p-3 text-gray-800">{item.name}</td>
                    <td className="p-3 text-gray-800">
                      {item.category || '—'}
                    </td>
                    <td className="max-w-xs p-3 text-gray-500 truncate">
                      {item.description || '—'}
                    </td>
                    <td className="p-3 text-center text-gray-700">
                      {item.stocks}
                    </td>
                    <td className="p-3 text-center text-gray-700">
                      {formatPrice(item.price)}
                    </td>
                    <td className="p-3 space-x-3 text-center">
                      <button
                        className="inline-flex items-center gap-1 font-medium text-green-600 hover:text-green-800"
                        onClick={() => openEditModal(item.id)}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 font-medium text-red-600 hover:text-red-800"
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
