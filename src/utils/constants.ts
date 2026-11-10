/**
 * Centralized Store & WhatsApp Configuration for RESIN AURA
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (process.env as any || {});

export const STORE_NAME = env.VITE_STORE_NAME || 'RESIN AURA';
export const CURRENCY_SYMBOL = env.VITE_CURRENCY_SYMBOL || '₹';
export const FREE_SHIPPING_THRESHOLD = Number(env.VITE_FREE_SHIPPING_THRESHOLD) || 1999;
export const STANDARD_SHIPPING_FEE = Number(env.VITE_STANDARD_SHIPPING_FEE) || 149;

// WhatsApp Business Number Configuration
// Clean digits without '+' or spaces for wa.me API: 917223008721
export const WHATSAPP_BUSINESS_NUMBER =
  (env.VITE_WHATSAPP_NUMBER as string | undefined)?.replace(/[^0-9]/g, '') ||
  '917223008721';

// Formatted display representation
export const WHATSAPP_DISPLAY_NUMBER =
  (env.VITE_WHATSAPP_DISPLAY as string | undefined) || '+91 7223008721';



/**
 * Builds the official WhatsApp Click-to-Chat URL
 * Format: https://wa.me/WHATSAPP_BUSINESS_NUMBER?text=ENCODED_MESSAGE
 */
export function buildWhatsAppChatUrl(message: string, customPhone?: string): string {
  const phone = (customPhone || WHATSAPP_BUSINESS_NUMBER).replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedText}`;
}

/**
 * Common Resin Artisan Color Palettes
 */
export const POPULAR_COLOR_PALETTES = [
  'Emerald Green & 24K Gold Flakes',
  'Sapphire Ocean Blue & Silver Leaf',
  'Deep Obsidian Black & Champagne Gold',
  'Rose Quartz & Metallic Bronze',
  'Pearl White, Opal & Gold Veins',
  'Amethyst Purple & Crystal Cluster',
  'Custom Palette (Specified in Notes)',
];

/**
 * Popular Bespoke Product Categories
 */
export const BESPOKE_PRODUCT_CATEGORIES = [
  'Luxury Wall Clock (14" - 24")',
  'Geode River Coffee / Side Table',
  'Ocean Wave Serving Tray & Coasters',
  'Wedding Bouquet & Keepsake Preservation',
  'Pooja Mandir Sacred Murti Backdrop',
  'Artisan Jewelry, Ring Dishes & Vanity Set',
  'Custom Personalized Nameplate',
  '3D Agate Resin Wall Sculpture',
  'Other Bespoke Commission',
];

