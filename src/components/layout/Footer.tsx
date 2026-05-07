import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Mail, Globe, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

const footerLinks = {
  catalog: [
    { href: '/movies', label: 'Фильмы' },
    { href: '/movies?type=series', label: 'Сериалы' },
    { href: '/collections', label: 'Подборки' },
    { href: '/news', label: 'Новости' },
  ],
  account: [
    { href: '/profile', label: 'Мой профиль' },
    { href: '/profile#watchlist', label: 'Буду смотреть' },
    { href: '/profile#reviews', label: 'Мои рецензии' },
    { href: '/auth', label: 'Войти' },
  ],
  info: [
    { href: '/about', label: 'О сервисе' },
    { href: '/contact', label: 'Контакты' },
    { href: '/privacy', label: 'Конфиденциальность' },
    { href: '/terms', label: 'Условия использования' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/7 bg-card mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Film className="w-4 h-4 text-primary-foreground" />
              </div>
              <span
                className="font-bold text-xl tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="text-foreground">Кино</span>
                <span className="text-primary">Портал</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Крупнейший кинопортал с рецензиями, рейтингами и персональными рекомендациями.
              Открывайте новые фильмы каждый день.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a
                href="mailto:info@kinoportal.ru"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                info@kinoportal.ru
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Москва, Россия
              </span>
              <a
                href="https://kinoportal.ru"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
                kinoportal.ru
              </a>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h3
              className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Каталог
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3
              className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Аккаунт
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3
              className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Информация
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} КиноПортал. Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground">
            Сделано с любовью к кино &nbsp;🎬
          </p>
        </div>
      </div>
    </footer>
  );
}
