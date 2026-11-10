import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, Sparkles, X } from 'lucide-react';
import { Product, Category } from '../types';
import { productsService } from '../services/productsService';
import { ProductCard } from '../components/common/ProductCard';
import { ProductFilters } from '../components/shop/ProductFilters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'featured';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Filters state
  const [priceRange, setPriceRange] = useState<[number, number]>([400, 10000]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Load products & categories
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          productsService.getCategories(),
          productsService.getProducts(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setProducts(prods);
        }
      } catch (err) {
        console.error('Failed to load shop products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (categoryParam && categoryParam !== 'all') {
      result = result.filter((p) => p.category_slug === categoryParam);
    }

    // Search query
    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    // Price filter
    result = result.filter((p) => p.price <= priceRange[1]);

    // In Stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // Sorting
    if (sortParam === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortParam === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortParam === 'newest') {
      result.sort((a, b) => (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0));
    } else if (sortParam === 'rating') {
      result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else {
      // featured
      result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return result;
  }, [products, categoryParam, searchParam, sortParam, priceRange, inStockOnly]);

  const handleCategorySelect = (slug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const clearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setPriceRange([400, 10000]);
    setInStockOnly(false);
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
  };

  const currentCategory = categories.find((c) => c.slug === categoryParam);

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#856338] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Resin Aura Gallery</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e]">
            {currentCategory ? currentCategory.name : 'The Complete Collection'}
          </h1>
          <p className="font-serif-luxury text-base sm:text-lg text-neutral-600 max-w-2xl mt-2">
            {currentCategory
              ? currentCategory.description
              : 'Explore our catalog of handcrafted geode wall clocks, botanical preserved jewelry, ceremonial thalis, and custom commissions.'}
          </p>
        </div>

        {/* Active Search Notification */}
        {searchParam && (
          <div className="mb-6 flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#c5a059]/40 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <Search className="w-4 h-4 text-[#856338]" />
              <span>Showing creations matching:</span>
              <strong className="text-[#0b3b33] font-bold">"{searchParam}"</strong>
            </div>
            <button
              onClick={clearSearch}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
            >
              <span>Clear</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="text-xs text-neutral-500 font-medium">
            Showing <strong className="text-neutral-900 font-bold">{filteredProducts.length}</strong> bespoke works
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF8F5] text-xs font-semibold text-neutral-700 border border-neutral-300"
            >
              <Filter className="w-3.5 h-3.5 text-[#856338]" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-neutral-400 uppercase tracking-wider hidden sm:inline">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortParam}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-[#FAF8F5] border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-[#0b3b33] cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar Filters + Products Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <ProductFilters
            categories={categories}
            selectedCategory={categoryParam}
            onSelectCategory={handleCategorySelect}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            inStockOnly={inStockOnly}
            onInStockChange={setInStockOnly}
            onResetFilters={resetFilters}
            mobileFiltersOpen={mobileFiltersOpen}
            onCloseMobileFilters={() => setMobileFiltersOpen(false)}
          />

          {/* Main Grid Content */}
          <div className="flex-1 w-full">
            {isLoading ? (
              <LoadingSpinner label="Fetching bespoke resin curations..." />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title="No Creations Found"
                description="We couldn't find any resin works matching your selected filters or search parameters. Try adjusting your filter settings or search terms."
                actionLabel="Reset All Filters"
                onAction={resetFilters}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

