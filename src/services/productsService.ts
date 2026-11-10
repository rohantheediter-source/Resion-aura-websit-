import { supabase } from './supabase';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/initialProducts';

const LOCAL_PRODUCTS_KEY = 'resin_aura_local_products_v1';
const LOCAL_CATEGORIES_KEY = 'resin_aura_local_categories_v1';

// Helper to get local stored products (for admin edits when working locally/offline)
function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return INITIAL_PRODUCTS;
}

function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (_) {}
}

function getLocalCategories(): Category[] {
  try {
    const saved = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return INITIAL_CATEGORIES;
}

function saveLocalCategories(categories: Category[]) {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (_) {}
}

export const productsService = {
  /**
   * Fetch all categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return getLocalCategories();
      }
      return data as Category[];
    } catch {
      return getLocalCategories();
    }
  },

  /**
   * Fetch all active products
   */
  async getProducts(categorySlug?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          images:product_images(image_url, display_order)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        const local = getLocalProducts();
        if (categorySlug && categorySlug !== 'all') {
          return local.filter((p) => p.category_slug === categorySlug && p.is_active);
        }
        return local.filter((p) => p.is_active);
      }

      // Map Supabase relational response to Product interface
      const mapped: Product[] = data.map((item: any) => {
        const imageList = item.images && item.images.length > 0
          ? item.images.sort((a: any, b: any) => a.display_order - b.display_order).map((i: any) => i.image_url)
          : ['/images/products/da818ee20766a8244b4a924dd001d4c1.png'];

        return {
          id: item.id,
          category_id: item.category_id,
          category_slug: item.category?.slug,
          category_name: item.category?.name,
          name: item.name,
          slug: item.slug,
          description: item.description,
          story: item.story,
          price: Number(item.price),
          compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : undefined,
          stock: item.stock,
          sku: item.sku || `RA-${item.id.slice(0, 4)}`,
          is_active: item.is_active,
          is_featured: item.is_featured,
          is_bestseller: item.is_bestseller,
          is_new_arrival: item.is_new_arrival,
          dimensions: item.dimensions,
          material: item.material,
          cure_time: item.cure_time,
          care_instructions: item.care_instructions,
          rating: item.rating ? Number(item.rating) : 5.0,
          review_count: item.review_count || 12,
          image: imageList[0],
          images: imageList,
          created_at: item.created_at,
        };
      });

      if (categorySlug && categorySlug !== 'all') {
        return mapped.filter((p) => p.category_slug === categorySlug);
      }
      return mapped;
    } catch {
      const local = getLocalProducts();
      if (categorySlug && categorySlug !== 'all') {
        return local.filter((p) => p.category_slug === categorySlug && p.is_active);
      }
      return local.filter((p) => p.is_active);
    }
  },

  /**
   * Fetch single product by slug or id
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          images:product_images(image_url, display_order)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        const imageList = data.images && data.images.length > 0
          ? data.images.sort((a: any, b: any) => a.display_order - b.display_order).map((i: any) => i.image_url)
          : ['/images/products/da818ee20766a8244b4a924dd001d4c1.png'];

        return {
          id: data.id,
          category_id: data.category_id,
          category_slug: data.category?.slug,
          category_name: data.category?.name,
          name: data.name,
          slug: data.slug,
          description: data.description,
          story: data.story,
          price: Number(data.price),
          compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : undefined,
          stock: data.stock,
          sku: data.sku,
          is_active: data.is_active,
          is_featured: data.is_featured,
          is_bestseller: data.is_bestseller,
          is_new_arrival: data.is_new_arrival,
          dimensions: data.dimensions,
          material: data.material,
          cure_time: data.cure_time,
          care_instructions: data.care_instructions,
          rating: data.rating ? Number(data.rating) : 5.0,
          review_count: data.review_count || 12,
          image: imageList[0],
          images: imageList,
          created_at: data.created_at,
        };
      }
    } catch (_) {}

    // Fallback to local
    const local = getLocalProducts();
    return local.find((p) => p.slug === slug || p.id === slug) || null;
  },

  /**
   * Admin: Get all products including inactive
   */
  async getAllAdminProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          images:product_images(image_url, display_order)
        `)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return getLocalProducts();
      }

      return data.map((item: any) => {
        const imageList = item.images && item.images.length > 0
          ? item.images.sort((a: any, b: any) => a.display_order - b.display_order).map((i: any) => i.image_url)
          : ['/images/products/da818ee20766a8244b4a924dd001d4c1.png'];

        return {
          id: item.id,
          category_id: item.category_id,
          category_slug: item.category?.slug,
          category_name: item.category?.name,
          name: item.name,
          slug: item.slug,
          description: item.description,
          story: item.story,
          price: Number(item.price),
          compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : undefined,
          stock: item.stock,
          sku: item.sku,
          is_active: item.is_active,
          is_featured: item.is_featured,
          is_bestseller: item.is_bestseller,
          is_new_arrival: item.is_new_arrival,
          dimensions: item.dimensions,
          material: item.material,
          cure_time: item.cure_time,
          care_instructions: item.care_instructions,
          rating: item.rating ? Number(item.rating) : 5.0,
          review_count: item.review_count || 0,
          image: imageList[0],
          images: imageList,
          created_at: item.created_at,
        };
      });
    } catch {
      return getLocalProducts();
    }
  },

  /**
   * Admin: Create or update product
   */
  async upsertProduct(product: Partial<Product> & { name: string; price: number; category_id: string }): Promise<Product> {
    const slug = product.slug || product.name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    const id = product.id || crypto.randomUUID();

    const productPayload = {
      id,
      name: product.name,
      slug,
      category_id: product.category_id,
      description: product.description || '',
      story: product.story || '',
      price: product.price,
      compare_at_price: product.compare_at_price || null,
      stock: product.stock ?? 10,
      sku: product.sku || `RA-${Date.now().toString().slice(-4)}`,
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      is_bestseller: product.is_bestseller ?? false,
      is_new_arrival: product.is_new_arrival ?? true,
      dimensions: product.dimensions || '',
      material: product.material || 'Ultra-Clear UV-Resistant Epoxy Resin',
      cure_time: product.cure_time || '72-Hour Curing Process',
      care_instructions: product.care_instructions || 'Wipe with microfiber cloth.',
    };

    let remoteSaved = false;
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert(productPayload)
        .select()
        .single();

      if (!error && data) {
        remoteSaved = true;
        // Save images
        if (product.images && product.images.length > 0) {
          await supabase.from('product_images').delete().eq('product_id', id);
          const imageRecords = product.images.map((url, idx) => ({
            product_id: id,
            image_url: url,
            is_primary: idx === 0,
            display_order: idx,
          }));
          await supabase.from('product_images').insert(imageRecords);
        }
      }
    } catch (e) {
      console.warn('Could not save to Supabase directly, updating local cache:', e);
    }

    // Always update local cache so changes are immediately visible
    const local = getLocalProducts();
    const categories = getLocalCategories();
    const cat = categories.find(c => c.id === product.category_id);

    const fullProduct: Product = {
      ...productPayload,
      compare_at_price: product.compare_at_price || undefined,
      category_slug: cat?.slug || 'wall-clocks',
      category_name: cat?.name || 'Resin Wall Clocks',
      image: (product.images && product.images[0]) || product.image || '/images/products/da818ee20766a8244b4a924dd001d4c1.png',
      images: product.images && product.images.length > 0 ? product.images : [(product.image || '/images/products/da818ee20766a8244b4a924dd001d4c1.png')],
      rating: product.rating || 5.0,
      review_count: product.review_count || 1,
      created_at: new Date().toISOString(),
    };

    const existingIndex = local.findIndex(p => p.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = { ...local[existingIndex], ...fullProduct };
    } else {
      local.unshift(fullProduct);
    }
    saveLocalProducts(local);

    return fullProduct;
  },

  /**
   * Admin: Delete product
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (_) {}

    const local = getLocalProducts().filter(p => p.id !== id);
    saveLocalProducts(local);
    return true;
  },

  /**
   * Admin: Quick toggle status or featured
   */
  async toggleProductField(id: string, field: 'is_active' | 'is_featured' | 'is_bestseller', value: boolean): Promise<void> {
    try {
      await supabase.from('products').update({ [field]: value }).eq('id', id);
    } catch (_) {}

    const local = getLocalProducts();
    const item = local.find(p => p.id === id);
    if (item) {
      item[field] = value;
      saveLocalProducts(local);
    }
  },
};
