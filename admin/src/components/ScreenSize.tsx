import { useEffect, useState } from 'react';

export default function ScreenSize() {
  const [isTooSmall, setIsTooSmall] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsTooSmall(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isTooSmall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-6">
      <div className="max-w-sm bg-white text-black p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Desktop Only</h2>
        <p className="text-sm text-gray-700">
          The OrderQ Admin Dashboard is optimized for desktop screens (1024px
          and above). Please use a laptop or desktop device to use.
        </p>
      </div>
    </div>
  );
}
