import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  Search,
  Menu,
  X,
  User,
  ChevronDown,
  Film,
  Tv,
  BookOpen,
  Star,
} from 'lucide-react';

const navLinks = [
  { href: '/movies', label: 'Фильмы', icon: Film },
  { href: '/movies?type=series', label: 'Сериалы', icon: Tv },
  { href: '/collections', label: 'Подборки', icon: Star },
  { href: '/news', label: 'Новости', icon: BookOpen },
];

export default function Navbar() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentPath = pathname + search;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const isActive = (href: string) => {
    const base = href.split('?')[0];
    if (base === '/') return pathname === '/';
    return pathname.startsWith(base);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || menuOpen
          ? 'glass border-b border-white/7 shadow-lg'
          : 'bg-gradient-to-b from-black/60 to-transparent'
      )}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="КиноПортал — на главную"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-glow">
              <Film className="w-4 h-4 text-primary-foreground" />
            </div>
            <span
              className="font-heading text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <span className="text-foreground">Кино</span>
              <span className="text-primary">Портал</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск фильмов, актёров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full h-10 pl-9 pr-4 rounded-lg text-sm',
                  'bg-white/5 border border-white/7',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-primary/50 focus:bg-white/8',
                  'transition-all duration-200'
                )}
              />
            </form>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Link
              to="/profile"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive('/profile')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <User className="w-4 h-4" />
              Профиль
            </Link>
            <Link
              to="/auth"
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-all duration-200',
                'shadow-md hover:shadow-primary/30'
              )}
            >
              Войти
            </Link>
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              aria-label="Поиск"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Поиск фильмов, актёров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full h-10 pl-9 pr-4 rounded-lg text-sm',
                  'bg-white/5 border border-white/7',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-primary/50',
                  'transition-all duration-200'
                )}
              />
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/7 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/7 my-2" />
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive('/profile')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <User className="w-4 h-4" />
                Мой профиль
              </Link>
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center justify-center gap-2 mt-1 px-4 py-3 rounded-lg text-sm font-semibold',
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-all'
                )}
              >
                Войти
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
