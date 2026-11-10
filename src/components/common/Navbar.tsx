import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  LogOut,
  Package,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { user, profile, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop All', href: '/shop' },
    { name: 'Wall Clocks', href: '/shop?category=wall-clocks' },
    { name: 'Jewelry & Sets', href: '/shop?category=jewelry-sets' },
    { name: 'Platters & Decor', href: '/shop?category=ceremonial-decor' },
    { name: 'Custom Design', href: '/custom-design', isSpecial: true },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];


  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
      {/* Top Luxury Announcement Bar */}
      <div className="bg-[#07241e] text-[#dfbe7e] text-[11px] py-1.5 px-4 font-medium tracking-widest uppercase border-b border-[#c5a059]/20 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-[#c5a059]" />
        <span>Bespoke Luxury Resin Art • Free Express Shipping on orders over ₹1,999</span>
        <Sparkles className="w-3 h-3 text-[#c5a059] hidden sm:inline" />
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-[#0b3b33] rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.svg"
                alt="Resin Aura Logo"
                className="w-10 h-10 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="font-display text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#07241e] group-hover:text-[#0b3b33] transition-colors">
                  RESIN AURA
                </span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-[#856338] font-semibold -mt-1">
                  Artisan Luxury
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = location.pathname + location.search === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-xs uppercase tracking-widest font-semibold transition-all duration-200 py-1 border-b-2 flex items-center gap-1.5 ${
                    isActive
                      ? 'border-[#c5a059] text-[#0b3b33]'
                      : 'border-transparent text-neutral-600 hover:text-[#0b3b33] hover:border-[#c5a059]/50'
                  }`}
                >
                  <span>{link.name}</span>
                  {(link as any).isSpecial && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059]/40 font-bold">
                      Bespoke
                    </span>
                  )}
                </Link>

              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-700 hover:text-[#0b3b33] hover:bg-neutral-50 rounded-full transition-colors"
              title="Search collection"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="p-2 text-neutral-700 hover:text-[#0b3b33] hover:bg-neutral-50 rounded-full transition-colors relative"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {totalWishlist > 0 && (
                <span className="absolute 0 top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalWishlist}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="p-2 text-neutral-700 hover:text-[#0b3b33] hover:bg-neutral-50 rounded-full transition-colors relative"
              title="Shopping Cart"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute 0 top-1 right-1 w-4 h-4 bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-2 text-neutral-700 hover:text-[#0b3b33] hover:bg-neutral-50 rounded-full transition-colors"
                title="Account"
                aria-label="Account"
              >
                <UserIcon className="w-5 h-5" />
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-100 py-2 z-50 animate-fade-in"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Signed in as</p>
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {profile?.full_name || user.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-[#0b3b33]"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-400" />
                        My Profile & Addresses
                      </Link>
                      <Link
                        to="/profile#orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-[#0b3b33]"
                      >
                        <Package className="w-4 h-4 text-neutral-400" />
                        My Order History
                      </Link>
                      <Link
                        to="/track-order"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-[#0b3b33]"
                      >
                        <Sparkles className="w-4 h-4 text-neutral-400" />
                        Track an Order
                      </Link>
                      <div className="border-t border-neutral-100 my-1" />
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await signOut();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#0b3b33] hover:bg-neutral-50"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
                      >
                        Create an Account
                      </Link>
                      <div className="border-t border-neutral-100 my-1" />
                      <Link
                        to="/track-order"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
                      >
                        <Package className="w-3.5 h-3.5 text-neutral-400" />
                        Track Your Order
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {searchOpen && (
        <div className="border-t border-neutral-100 bg-[#FAF8F5] py-3 px-4 animate-fade-in shadow-inner">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-[#856338]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resin clocks, preserved floral jhumkas, thalis, pendants..."
              className="flex-1 bg-transparent border-none text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] text-xs font-semibold uppercase tracking-wider hover:bg-[#07241e]"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-100 bg-white px-4 pt-3 pb-6 animate-fade-in">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#0b3b33] py-2 border-b border-neutral-50"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-wider font-medium text-neutral-500 py-1.5"
              >
                Track Your Order
              </Link>
              {user ? (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs uppercase tracking-wider font-medium text-[#0b3b33] py-1.5"
                >
                  My Account ({profile?.full_name || 'Profile'})
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs uppercase tracking-wider font-semibold text-[#0b3b33] py-1.5"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

