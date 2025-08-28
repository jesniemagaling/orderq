import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

export default function Nav({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  const location = useLocation();
  const { cartCount } = useCart();
  const showLogo = location.pathname === '/' || location.pathname === '/search';

  return (
    <header className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2 sm:space-x-3">
        {showLogo ? (
          <>
            <img
              src="/icons/orderq-logo.svg"
              alt="OrderQ Logo"
              className="w-8 h-8 sm:w-12 sm:h-12"
            />
            <span className="text-xl font-extrabold sm:text-3xl text-primary">
              OrderQ
            </span>
          </>
        ) : (
          <span className="text-[26px] font-medium sm:text-[32px]">
            {title || 'OrderQ'}
          </span>
        )}
      </div>

      <nav>
        <Link
          to="/cart"
          className="flex items-center gap-1 p-2 bg-white rounded-full hover:opacity-80"
        >
          <div className="relative">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.43164 3.25H3.9328C4.48495 3.25 4.96813 3.62121 5.1104 4.15472L5.52553 5.71143M8.11914 15.4375C6.32422 15.4375 4.86914 16.8926 4.86914 18.6875H21.9316M8.11914 15.4375H20.2723C21.4868 12.9451 22.5467 10.3635 23.4393 7.70521C18.2809 6.38783 12.8755 5.6875 7.30664 5.6875C6.71103 5.6875 6.11729 5.69551 5.52553 5.71143M8.11914 15.4375L5.52553 5.71143M6.49414 21.9375C6.49414 22.3862 6.13037 22.75 5.68164 22.75C5.23291 22.75 4.86914 22.3862 4.86914 21.9375C4.86914 21.4888 5.23291 21.125 5.68164 21.125C6.13037 21.125 6.49414 21.4888 6.49414 21.9375ZM20.3066 21.9375C20.3066 22.3862 19.9429 22.75 19.4941 22.75C19.0454 22.75 18.6816 22.3862 18.6816 21.9375C18.6816 21.4888 19.0454 21.125 19.4941 21.125C19.9429 21.125 20.3066 21.4888 20.3066 21.9375Z"
                stroke="#1A1A1A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute sm:-top-1 sm:-right-1 -top-2 -right-2 bg-primary-500 text-white sm:text-xs text-[10px] rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </div>
        </Link>
      </nav>
    </header>
  );
}
