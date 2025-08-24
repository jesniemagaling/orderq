import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';

export default function Menu() {
  const [query1, setQuery1] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuData);

  return (
    <>
      <Nav title="Menu" />
      <SearchInput
        value={query1}
        onChange={setQuery1}
        placeholder="What do you need?"
      />
    </>
  );
}
