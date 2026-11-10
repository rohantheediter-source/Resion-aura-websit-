import React, { useEffect, useState } from 'react';
import { HeroBanner } from '../components/home/HeroBanner';
import { FeaturedCollections } from '../components/home/FeaturedCollections';
import { BestsellerGrid } from '../components/home/BestsellerGrid';
import { BespokeCommissionBanner } from '../components/home/BespokeCommissionBanner';
import { ArtisanStorySection } from '../components/home/ArtisanStorySection';
import { CraftsmanshipProcess } from '../components/home/CraftsmanshipProcess';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { productsService } from '../services/productsService';
import { Product } from '../types';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const list = await productsService.getProducts();
        setProducts(list);
      } catch (err) {
        console.error('Failed to load homepage products:', err);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroBanner />
      <FeaturedCollections />
      <BestsellerGrid products={products} />
      <BespokeCommissionBanner />
      <ArtisanStorySection />
      <CraftsmanshipProcess />
      <TestimonialsSection />
    </div>
  );
};


