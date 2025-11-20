import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../lib/axios';
import { toast } from 'react-toastify';

export default function AddMenu() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: '',
    name: '',
    stocks: '',
    price: '',
    description: '',
  });

  const [nextProductId, setNextProductId] = useState<number | null>(null);

  // Fetch next product ID
  useEffect(() => {
    const fetchNextProductId = async () => {
      try {
        const res = await api.get('/menu');
        const items = res.data;
        if (items.length > 0) {
          const lastId = Math.max(...items.map((item: any) => item.id));
          setNextProductId(lastId + 1);
        } else {
          setNextProductId(1);
        }
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setNextProductId(1);
      }
    };
    fetchNextProductId();
  }, []);

  const formattedId = nextProductId
    ? `#${nextProductId.toString().padStart(6, '0')}`
    : 'Loading...';

  // Image upload preview (optional)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Automatically determine status based on stock count
  const computedStatus = Number(form.stocks) > 0 ? 'in_stock' : 'out_of_stock';

  // Convert uploaded image to Base64 (for image_url field)
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

    const priceValue = Number(form.price);
    const stockValue = Number(form.stocks);

    if (priceValue < 1 || stockValue < 1) {
      toast.warn('Price and Stocks must be at least 1.');
      return;
    }

    try {
      let imageUrl = '';

      // Convert image to base64 (optional)
      if (image) {
        imageUrl = await convertToBase64(image);
      }

      // Send JSON instead of FormData
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        category: form.category,
        stocks: form.stocks,
        status: computedStatus,
        image_url: imageUrl || null, // base64 or null
      };

      await api.post('/menu', payload);

      toast.success(`${form.name.trim() || 'New item'} added to menu!`);
      navigate('/admin/menu');
    } catch (err) {
      console.error('Failed to add menu:', err);
      toast.error('Failed to save menu.');
    }
  };

  return (
    <div className="flex flex-col justify-between ">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Button
          onClick={() => window.history.back()}
          className="text-white transition rounded-lg"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap justify-between flex-1 gap-8"
      >
        {/* Image Upload */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-[300px] max-w-3xl">
          <label
            htmlFor="image"
            className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg w-64 h-64 flex flex-col items-center justify-center text-gray-500 hover:border-[#820D17] transition"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="object-cover w-full h-full rounded-lg"
              />
            ) : (
              <>
                <Upload size={36} strokeWidth={1.5} className="mb-2" />
                <span className="font-medium">Upload Image</span>
              </>
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              required
            />
          </label>
        </div>

        {/* Form Fields */}
        <div className="flex-1 min-w-[300px] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product ID
            </label>
            <p className="mt-1">{formattedId}</p>
          </div>

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
              placeholder="Product Name"
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
                placeholder="Quantity"
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
                placeholder="Price"
                min={1}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-[#820D17]/40"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <p
              className={`mt-2 ml-2 font-semibold ${
                computedStatus === 'in_stock'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {computedStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
            </p>
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

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button type="submit" onClick={handleSubmit}>
          Save Menu
        </Button>
      </div>
    </div>
  );
}
