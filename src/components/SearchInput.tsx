import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative w-full my-4 ${className}`}>
      <Search className="absolute w-5 h-5 -translate-y-1/2 sm:w-6 sm:h-6 opacity-90 left-3 top-1/2 text-muted-foreground" />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 sm:pl-12"
      />
    </div>
  );
}
