import Logo from '@/components/Logo';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';

export default function Home() {
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');

  return (
    <>
      <div className="">
        <header>
          <Logo />
          <div className="flex items-center justify-center w-full py-1.5 my-6 text-sm font-bold text-white rounded-lg bg-primary-500">
            START YOUR ORDER
          </div>
          <SearchInput
            value={query1}
            onChange={setQuery1}
            placeholder="What do you need?"
          />
        </header>
      </div>
    </>
  );
}
