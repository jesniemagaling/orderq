import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../lib/axios';
import { toast } from 'react-toastify';

interface EditMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuId: number | null;
  onUpdated: () => Promise<void>;
}

interface MenuItem {
  id: number;
  category: string;
  name: string;
  stocks: number;
  price: number;
  description: string;
  image_url?: string;
}

export default function EditMenu({
  isOpen,
  onClose,
  menuId,
  onUpdated,
}: EditMenuProps) {
  const [form, setForm] = useState({
    category: '',
    name: '',
    stocks: '',
    price: '',
    description: '',
  });

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch menu item and categories
  useEffect(() => {
    if (!menuId || !isOpen) return;

    const fetchMenuItem = async () => {
      try {
        const res = await api.get<MenuItem>(`/menu/${menuId}`);
        const item = res.data;

        setForm({
          category: item.category || '',
          name: item.name || '',
          stocks: item.stocks?.toString() || '',
          price: item.price?.toString() || '',
          description: item.description || '',
        });

        if (item.image_url) {
          const fullUrl = `${import.meta.env.VITE_BACKEND_URL}${
            item.image_url
          }?t=${Date.now()}`;
          setPreview(fullUrl);
          setExistingImage(item.image_url);
        }
      } catch (err) {
        console.error('Failed to fetch menu item:', err);
        toast.error('Failed to load menu item');
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await api.get('/menu/categories');
        setCategories(res.data.map((cat: any) => cat.name));
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchMenuItem();
    fetchCategories();
  }, [menuId, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!menuId) return;

    const priceValue = Number(form.price);
    const stockValue = Number(form.stocks);

    if (priceValue < 1 || stockValue < 0) {
      toast.warn('Price must be ≥ 1 and Stocks ≥ 0.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description);
      formData.append('price', String(priceValue));
      formData.append('category', form.category);
      formData.append('stocks', String(stockValue));
      formData.append('status', stockValue > 0 ? 'in_stock' : 'out_of_stock');

      if (image) formData.append('image', image);

      // Update the menu item
      await api.put(`/menu/${menuId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${form.name.trim()} updated successfully!`);

      // Refetch updated item to get the new image URL
      const updatedRes = await api.get<MenuItem>(`/menu/${menuId}`);
      if (updatedRes.data.image_url) {
        const fullUrl = `${import.meta.env.VITE_BACKEND_URL}${
          updatedRes.data.image_url
        }?t=${Date.now()}`;
        setPreview(fullUrl);
        setExistingImage(updatedRes.data.image_url);
      }

      await onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update menu:', err);
      toast.error(`${form.name.trim()} failed to update.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-600 top-3 right-3 hover:text-gray-800"
        >
          <X size={20} />
        </button>

        <h2 className="mb-6 text-2xl font-semibold">Edit Menu Item</h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap justify-between gap-8"
        >
          {/* Image Upload */}
          <div className="flex flex-col items-center justify-center flex-1 min-w-[250px]">
            <label
              htmlFor="image"
              className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg w-48 h-48 flex flex-col items-center justify-center text-gray-500 hover:border-[#820D17] transition"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="object-cover w-full h-full rounded-lg"
                />
              ) : (
                <>
                  <Upload size={28} strokeWidth={1.5} className="mb-2" />
                  <span className="font-medium">Upload Image</span>
                </>
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* FORM FIELDS */}
          <div className="flex-1 min-w-[250px] space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]/40"
              >
                <option value="">Choose Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stocks
                </label>
                <input
                  type="number"
                  name="stocks"
                  value={form.stocks}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min={1}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]/40"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end w-full gap-3 mt-6">
            <Button onClick={onClose} className="text-gray-800 bg-gray-300">
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#820D17] text-white hover:bg-[#9a1620]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
