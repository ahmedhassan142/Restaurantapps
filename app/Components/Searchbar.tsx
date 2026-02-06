// components/SearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Utensils } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: 'menu' | 'category';
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchItems = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'menu') {
      router.push(`/Menu/${result._id}`);
    } else {
      router.push(`/Menu`);
    }
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-64 lg:w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length > 0 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result._id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      result.type === 'menu' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {result.type === 'menu' ? <Utensils className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{result.name}</h4>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-1">{result.description}</p>
                      {result.type === 'menu' && (
                        <p className="text-orange-600 font-semibold text-sm mt-1">${result.price}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No results found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}