import { supabase } from './supabase';

export const storageService = {
  /**
   * Upload image to Supabase Storage bucket 'product-images'
   */
  async uploadProductImage(file: File): Promise<{ url: string | null; error: Error | null }> {
    // 1. Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return { url: null, error: new Error('Please upload a valid image file (JPEG, PNG, or WebP)') };
    }

    // 2. Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: new Error('Image size must be less than 5MB') };
    }

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        // Fallback: create base64 data url for preview/local storage
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result as string, error: null });
          reader.onerror = () => resolve({ url: null, error: new Error('Failed to read image file') });
          reader.readAsDataURL(file);
        });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: any) {
      // Fallback to Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result as string, error: null });
        reader.onerror = () => resolve({ url: null, error: err });
        reader.readAsDataURL(file);
      });
    }
  },
};

