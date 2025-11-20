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
  const [loading, setLoading] = useState(false);

  // Fetch menu item when modal opens
  useEffect(() => {
    const fetchItem = async () => {
      if (!menuId || !isOpen) return;
      try {
        const res = await api.get(`/menu/${menuId}`);
        const item = res.data;
        setForm({
          category: item.category || '',
          name: item.name || '',
          stocks: item.stocks?.toString() || '',
          price: item.price?.toString() || '',
          description: item.description || '',
        });
        if (item.image_url) setPreview(item.image_url);
      } catch (err) {
        console.error('Failed to fetch menu item:', err);
      }
    };

    fetchItem();
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
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuId) return;

    const priceValue = Number(form.price);
    const stockValue = Number(form.stocks);

    if (priceValue < 1 || stockValue < 1) {
      toast.warn('Price and Stocks must be at least 1.');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = preview;

      if (image) {
        imageUrl = await convertToBase64(image);
      }

      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: priceValue,
        category: form.category,
        stocks: stockValue,
        status: stockValue > 0 ? 'in_stock' : 'out_of_stock',
        image_url: imageUrl || null,
      };

      await api.put(`/menu/${menuId}`, payload);

      toast.success(`${form.name.trim() || 'Menu item'} updated successfully!`);
      await onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update menu:', err);
      toast.error(`${form.name.trim() || 'Menu item'} failed to update.`);
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

          {/* Form Fields */}
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
                <option value="Iced">Iced</option>
                <option value="Fruity">Fruity</option>
                <option value="Hot">Hot</option>
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
                placeholder="Product Name"
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
                  min={1}
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
                placeholder="Description"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]"
              />
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            onClick={onClose}
            className="text-gray-800 bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#820D17] text-white hover:bg-[#9a1620]"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
