import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);

      const { token, user } = res.data;
      const role = user.role;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'admin') navigate('/admin/overview');
      else if (role === 'cashier') navigate('/cashier/tables');
      else if (role === 'kitchen') navigate('/kitchen/orders');
      else setError('Unknown role. Contact admin.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="absolute top-6 left-8 flex items-center gap-2">
        <img src="/orderq-logo.svg" alt="OrderQ" className="h-10 w-10" />
        <span className="text-xl font-bold">OrderQ</span>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-center text-3xl font-extrabold text-gray-900">
            Login
          </h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            Welcome back! Please log in to access your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your Email"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#820D17] focus:ring-2 focus:ring-[#820D17]/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your Password"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#820D17] focus:ring-2 focus:ring-[#820D17]/30"
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
