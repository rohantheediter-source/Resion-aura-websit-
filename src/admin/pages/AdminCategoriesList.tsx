import React, { useEffect, useState } from 'react';
import { Tag, Plus, Check, ArrowRight } from 'lucide-react';
import { productsService } from '../../services/productsService';
import { Category, Product } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminCategoriesList: React.FC = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          productsService.getCategories(),
          productsService.getAllAdminProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
    );
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      error('Please enter category name and slug');
      return;
    }

    setIsSubmitting(true);
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      image_url: imageUrl.trim() || '/images/products/da818ee20766a8244b4a924dd001d4c1.png',
      is_featured: true,
      display_order: categories.length + 1,
    };

    setCategories((prev) => [...prev, newCat]);
    success(`Artisan discipline "${newCat.name}" added to catalog`);
    setModalOpen(false);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading disciplines registry..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#dfbe7e] font-mono">
            COLLECTION TAXONOMY
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Artisan Disciplines & Categories ({categories.length})
          </h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = products.filter((p) => p.category_slug === cat.slug).length;
          return (
            <div
              key={cat.id}
              className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-black/40">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b241e] via-transparent to-transparent" />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#071915]/90 border border-[#c5a059]/40 text-[10px] font-bold text-[#dfbe7e]">
                  {count} {count === 1 ? 'Creation' : 'Creations'}
                </span>
              </div>

              <div className="p-6">
                <h3 className="font-display text-base font-bold text-white mb-1.5">{cat.name}</h3>
                <p className="text-[11px] text-neutral-400 font-mono mb-3">Slug: /{cat.slug}</p>
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="p-4 bg-[#071915]/60 border-t border-[#0f3830] flex items-center justify-between text-xs">
                <a
                  href={`/shop?category=${cat.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 hover:text-[#dfbe7e] flex items-center gap-1"
                >
                  <span>View in Storefront</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-[#0d221d] border border-[#c5a059]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 text-white">
            <h3 className="font-display text-xl font-bold mb-4 pb-2 border-b border-[#0f3830]">
              Create New Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="e.g. Resin Nameplates & Signages"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/products/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-xs font-bold text-[#071915] uppercase tracking-wider"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

