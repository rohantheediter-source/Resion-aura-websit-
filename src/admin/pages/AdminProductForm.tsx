import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { productsService } from '../../services/productsService';
import { storageService } from '../../services/storageService';
import { Product, Category } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<string>('');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('10');
  const [sku, setSku] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [material, setMaterial] = useState('Optical Grade UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals');
  const [cureTime, setCureTime] = useState('72-Hour Controlled Chamber Curing');
  const [careInstructions, setCareInstructions] = useState('Clean with a dry, ultra-soft microfiber cloth. Avoid harsh chemicals.');
  const [description, setDescription] = useState('');
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await productsService.getCategories();
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (id) {
          const prods = await productsService.getAllAdminProducts();
          const found = prods.find((p) => p.id === id);
          if (found) {
            setName(found.name);
            setSlug(found.slug);
            setCategoryId(found.category_id);
            setPrice(found.price.toString());
            setCompareAtPrice(found.compare_at_price ? found.compare_at_price.toString() : '');
            setStock(found.stock.toString());
            setSku(found.sku || '');
            setDimensions(found.dimensions || '');
            setMaterial(found.material || '');
            setCureTime(found.cure_time || '');
            setCareInstructions(found.care_instructions || '');
            setDescription(found.description || '');
            setStory(found.story || '');
            setImageUrl(found.image || '');
            setIsActive(found.is_active);
            setIsFeatured(found.is_featured);
            setIsBestseller(found.is_bestseller);
            setIsNewArrival(found.is_new_arrival);
          }
        }
      } catch (err) {
        console.error('Failed to load product form data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
      );
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { url, error: uploadErr } = await storageService.uploadProductImage(file);
      if (uploadErr || !url) {
        error(uploadErr?.message || 'Failed to upload product image');
      } else {
        setImageUrl(url);
        success('Product image uploaded successfully');
      }
    } catch (err: any) {
      error(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !categoryId) {
      error('Please complete the title, category, and price');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await productsService.upsertProduct({
        id: id || undefined,
        name: name.trim(),
        slug: slug.trim(),
        category_id: categoryId,
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        stock: parseInt(stock, 10) || 0,
        sku: sku.trim() || `RA-${Date.now().toString().slice(-4)}`,
        dimensions: dimensions.trim(),
        material: material.trim(),
        cure_time: cureTime.trim(),
        care_instructions: careInstructions.trim(),
        description: description.trim(),
        story: story.trim(),
        image: imageUrl || '/images/products/da818ee20766a8244b4a924dd001d4c1.png',
        images: [imageUrl || '/images/products/da818ee20766a8244b4a924dd001d4c1.png'],
        is_active: isActive,
        is_featured: isFeatured,
        is_bestseller: isBestseller,
        is_new_arrival: isNewArrival,
      });

      success(`Successfully saved "${saved.name}" to the catalog!`);
      navigate('/admin/products');
    } catch (err: any) {
      error(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading artwork editor..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#0f3830]">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-[#0b241e] text-neutral-400 hover:text-white border border-[#c5a059]/30"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#dfbe7e] font-mono">
              {isEditing ? 'UPDATE MASTERPIECE' : 'NEW STUDIO CREATION'}
            </span>
            <h1 className="font-display text-2xl font-bold text-white">
              {isEditing ? `Edit: ${name}` : 'Add New Product to Catalog'}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] mb-4 pb-2 border-b border-[#0f3830]">
            Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Artwork Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="e.g. Celestial Nebula Geode Wall Clock"
              className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Artisan Discipline / Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Selling Price (INR ₹) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="4999"
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs font-bold text-[#dfbe7e] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Compare-at Original Price (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="6499"
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-neutral-400 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>
        </div>

        {/* Product Media & Image Upload */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] mb-4 pb-2 border-b border-[#0f3830]">
            Product Imagery & Supabase Storage
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Image Preview */}
            <div className="relative aspect-square max-w-[200px] rounded-2xl overflow-hidden bg-[#071915] border border-neutral-700 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-neutral-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-[10px]">No image selected</span>
                </div>
              )}
            </div>

            {/* Upload & URL Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Upload Image File (Supabase Storage)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#071915] border border-dashed border-neutral-600 hover:border-[#c5a059] text-xs text-neutral-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#dfbe7e]" />
                  <span>{isUploadingImage ? 'Uploading image...' : 'Choose JPG, PNG, or WebP'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Or Image Path / Remote URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/products/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Copy */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] mb-4 pb-2 border-b border-[#0f3830]">
            Artisan Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Dimensions
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="16 inches diameter, 18mm thickness"
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Materials
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the resin clarity, natural inclusions, and overall artistic aura..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Atelier Story / Craftsmanship Notes
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={2}
              placeholder="Notes on the curing ritual, raw crystals, and botanical foraging..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>
        </div>

        {/* Visibility & Badges */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] mb-4 pb-2 border-b border-[#0f3830]">
            Storefront Visibility & Badges
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059]"
              />
              <span className="font-semibold text-neutral-300">Published / Active</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059]"
              />
              <span className="font-semibold text-neutral-300">Featured Atelier Piece</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059]"
              />
              <span className="font-semibold text-neutral-300">Bestseller Badge</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059]"
              />
              <span className="font-semibold text-neutral-300">New Arrival Badge</span>
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            to="/admin/products"
            className="px-6 py-3 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-[#0b241e]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-gold-glow disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Committing to Database...' : isEditing ? 'Save Changes' : 'Publish Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

