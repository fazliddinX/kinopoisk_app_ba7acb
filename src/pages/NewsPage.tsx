import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, ChevronRight, Star, TrendingUp, Newspaper } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

interface NewsItem {
  guid: string
  title?: string
  body?: string
  cover_image?: string
  category?: string
  publish_date?: string
  is_featured?: boolean
}

const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1566944284128-0630ae1a2271?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1516028529332-04b428b43a06?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1579036095242-fe07594274ca?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1629053105018-18b6f13bfb53?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
]

const CATEGORIES = ['Все', 'Премьеры', 'Рецензии', 'Интервью', 'Фестивали', 'Индустрия']

const formatDate = (d?: string) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getCategoryColor(cat?: string): string {
  const map: Record<string, string> = {
    'Премьеры': 'bg-primary/20 text-primary border-primary/30',
    'Рецензии': 'bg-accent/20 text-accent border-accent/30',
    'Интервью': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Фестивали': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Индустрия': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return map[cat ?? ''] ?? 'bg-muted text-muted-foreground border-border'
}

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(`${API_BASE}/v2/items/news?limit=50`, {
    headers: { 'Authorization': 'API-KEY', 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error('Failed to fetch news')
  const data = await res.json()
  return data?.data?.data?.response ?? []
}

function FeaturedNewsCard({ item, index }: { item: NewsItem; index: number }) {
  const imgSrc = item.cover_image ?? CARD_IMAGES[index % CARD_IMAGES.length]
  const excerpt = (item.body ?? '').replace(/<[^>]*>/g, '').slice(0, 220)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden border border-border group card-hover h-full"
    >
      {/* Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.title ?? 'News cover'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

        {item.is_featured && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary text-primary-foreground border-0 font-semibold flex items-center gap-1">
              <Star className="w-3 h-3" /> Главное
            </Badge>
          </div>
        )}

        {/* Category on image */}
        <div className="absolute bottom-4 left-4 right-4">
          {item.category && (
            <span className={cn('inline-block text-xs font-semibold px-2.5 py-1 rounded-full border mb-3', getCategoryColor(item.category))}>
              {item.category}
            </span>
          )}
          <h2
            className="text-foreground font-bold text-xl md:text-2xl leading-tight line-clamp-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {item.title ?? 'Без названия'}
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 bg-card">
        {excerpt && (
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
            {excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(item.publish_date)}
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-8 px-3 gap-1.5">
            Читать <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function SmallNewsCard({ item, index }: { item: NewsItem; index: number }) {
  const imgSrc = item.cover_image ?? CARD_IMAGES[index % CARD_IMAGES.length]
  const excerpt = (item.body ?? '').replace(/<[^>]*>/g, '').slice(0, 100)

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
      className="flex gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group cursor-pointer"
    >
      {/* Thumb */}
      <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
        <img
          src={imgSrc}
          alt={item.title ?? ''}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.style.background = 'hsl(var(--muted))'
          }}
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.category && (
          <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-1.5', getCategoryColor(item.category))}>
            {item.category}
          </span>
        )}
        <h3
          className="text-foreground text-sm font-semibold leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {item.title ?? 'Без названия'}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {formatDate(item.publish_date)}
        </div>
      </div>
    </motion.div>
  )
}

function NewsGridCard({ item, index }: { item: NewsItem; index: number }) {
  const imgSrc = item.cover_image ?? CARD_IMAGES[index % CARD_IMAGES.length]
  const excerpt = (item.body ?? '').replace(/<[^>]*>/g, '').slice(0, 130)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (index % 3) * 0.1 }}
      className="rounded-xl overflow-hidden border border-border bg-card group card-hover"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.title ?? ''}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {item.category && (
          <div className="absolute top-3 left-3">
            <span className={cn('inline-block text-xs font-semibold px-2.5 py-1 rounded-full border', getCategoryColor(item.category))}>
              {item.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="text-foreground font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {item.title ?? 'Без названия'}
        </h3>
        {excerpt && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-3">
            {excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(item.publish_date)}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </motion.div>
  )
}

function SkeletonFeatured() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <Skeleton className="h-80 w-full" />
      <div className="p-5 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonSmall() {
  return (
    <div className="flex gap-4 p-3 rounded-xl border border-border bg-card">
      <Skeleton className="w-24 h-20 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('Все')
  const [visibleCount, setVisibleCount] = useState(9)

  const { data: newsItems = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: fetchNews,
  })

  const filtered = newsItems.filter((item) => {
    if (activeCategory === 'Все') return true
    return (item.category ?? '') === activeCategory
  })

  const featured = filtered.find((i) => i.is_featured) ?? filtered[0]
  const sideNews = filtered.filter((i) => i.guid !== featured?.guid).slice(0, 3)
  const gridNews = filtered.filter((i) => i.guid !== featured?.guid).slice(3, 3 + visibleCount)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden hero-texture" style={{ minHeight: 340 }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1761926642798-5ec47e7013cd?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80"
            alt="News hero"
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement!.style.background = 'hsl(var(--card))'
            }}
          />
          <div className="absolute inset-0 cinematic-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-28 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold uppercase tracking-wider">
                Новости кино
              </Badge>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Всё о мире{' '}
              <span className="gradient-text">кинематографа</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Последние новости, рецензии, интервью и репортажи о фильмах, актёрах и индустрии развлечений.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-16 z-30 bg-background/95 border-b border-border backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scroll-row pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {cat}
              </button>
            ))}

            <span className="ml-auto text-sm text-muted-foreground shrink-0">
              {filtered.length} {filtered.length === 1 ? 'материал' : filtered.length < 5 ? 'материала' : 'материалов'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        {/* Featured + Side */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2">
              <SkeletonFeatured />
            </div>
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => <SkeletonSmall key={i} />)}
            </div>
          </div>
        ) : featured ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
          >
            {/* Featured large card */}
            <div className="lg:col-span-2">
              <FeaturedNewsCard item={featured} index={0} />
            </div>

            {/* Side news */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Последние новости
                </h2>
              </div>
              {sideNews.map((item, i) => (
                <SmallNewsCard key={item.guid} item={item} index={i + 1} />
              ))}
              {sideNews.length === 0 && (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Нет дополнительных материалов
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Newspaper className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Новости не найдены
            </h2>
          </div>
        )}

        {/* Grid section */}
        {!isLoading && gridNews.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-1 h-6 bg-accent rounded-full" />
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Все публикации
              </h2>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {gridNews.map((item, i) => (
                <NewsGridCard key={item.guid} item={item} index={i} />
              ))}
            </div>

            {/* Load more */}
            {visibleCount < filtered.length - 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((v) => v + 9)}
                  className="border-primary/30 text-primary hover:bg-primary/10 px-8 h-11"
                >
                  Загрузить ещё
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-16"
        >
          <div className="relative rounded-2xl overflow-hidden border border-primary/20">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80"
                alt="Newsletter background"
                loading="lazy"
                className="w-full h-full object-cover opacity-15"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
            </div>
            <div className="relative z-10 p-8 md:p-12">
              <div className="max-w-2xl">
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">Рассылка</Badge>
                <h2
                  className="text-2xl md:text-3xl font-bold text-foreground mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Будьте в курсе кинособытий
                </h2>
                <p className="text-muted-foreground mb-6">
                  Подпишитесь на еженедельную рассылку с главными новостями мирового кино, рецензиями на премьеры и эксклюзивными интервью.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Ваш email адрес"
                    className="input-dark flex-1 h-11"
                  />
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-11 font-semibold shrink-0">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Подписаться
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности. Отписаться можно в любой момент.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
