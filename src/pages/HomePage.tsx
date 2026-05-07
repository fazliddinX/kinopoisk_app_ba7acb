import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Plus,
  Star,
  Calendar,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'API-KEY',
  'x-api-key': API_KEY,
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: apiHeaders })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

interface Movie {
  guid: string
  title?: string
  original_title?: string
  poster?: string
  backdrop?: string
  year?: number
  duration_min?: number
  description?: string
  rating?: number
  votes_count?: number
  country?: string
  content_type?: string
  trailer_url?: string
  age_rating?: string
  is_featured?: boolean
}

interface NewsItem {
  guid: string
  title?: string
  body?: string
  cover_image?: string
  category?: string
  publish_date?: string
  is_featured?: boolean
}

interface Collection {
  guid: string
  name?: string
  description?: string
  cover_image?: string
  is_public?: boolean
}

interface ApiListResponse<T> {
  data: {
    response: T[]
    count?: number
  }
}

function getRatingClass(rating?: number) {
  if (!rating) return 'rating-none'
  if (rating >= 7) return 'rating-high'
  if (rating >= 5) return 'rating-mid'
  return 'rating-low'
}

function getRatingColor(rating?: number) {
  if (!rating) return 'hsl(220 25% 22%)'
  if (rating >= 7) return 'hsl(142 71% 40%)'
  if (rating >= 5) return 'hsl(38 92% 50%)'
  return 'hsl(0 84% 60%)'
}

const formatDate = (d?: string) => {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return d
  }
}

// fallback images from image pool
const HERO_IMGS = [
  'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1761926642798-5ec47e7013cd?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80',
]

const CARD_IMGS = [
  'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1566944284128-0630ae1a2271?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1516028529332-04b428b43a06?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1579036095242-fe07594274ca?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1629053105018-18b6f13bfb53?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
]

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>, idx = 0) {
  const el = e.currentTarget
  el.onerror = null
  el.style.display = 'none'
  const parent = el.parentElement
  if (parent) {
    parent.style.background = `linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))`
  }
}

// ────────────────────────────────────────────────
// RatingCircle
// ────────────────────────────────────────────────
function RatingCircle({ rating, size = 'md' }: { rating?: number; size?: 'sm' | 'md' | 'lg' }) {
  const val = rating ?? 0
  const sizeMap = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold font-heading shrink-0 border-2',
        sizeMap[size],
        val >= 7
          ? 'bg-emerald-700/80 border-emerald-500 text-white'
          : val >= 5
          ? 'bg-amber-600/80 border-amber-400 text-white'
          : val > 0
          ? 'bg-red-700/80 border-red-500 text-white'
          : 'bg-muted border-border text-muted-foreground'
      )}
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {val > 0 ? val.toFixed(1) : '—'}
    </div>
  )
}

// ────────────────────────────────────────────────
// MovieCard (poster style)
// ────────────────────────────────────────────────
function MovieCard({ movie, index = 0 }: { movie: Movie; index?: number }) {
  const fallbackImg = CARD_IMGS[index % CARD_IMGS.length]
  return (
    <Link to={`/movies/${movie.guid}`} className="group block">
      <div className="relative poster-ratio rounded-lg overflow-hidden bg-muted card-hover">
        <img
          src={movie.poster ?? fallbackImg}
          alt={movie.title ?? 'Постер'}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={imgFallback}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-card/80 text-xs text-foreground border border-border hover:bg-primary hover:text-primary-foreground transition-colors">
              <Plus className="w-3 h-3" /> В список
            </button>
          </div>
        </div>
        {/* Rating badge */}
        {(movie.rating ?? 0) > 0 && (
          <div
            className={cn(
              'absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold',
              getRatingClass(movie.rating)
            )}
          >
            {(movie.rating ?? 0).toFixed(1)}
          </div>
        )}
        {movie.age_rating && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 border border-border text-xs text-muted-foreground">
            {movie.age_rating}
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
          {movie.title ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{movie.year ?? ''}</p>
      </div>
    </Link>
  )
}

// ────────────────────────────────────────────────
// Section Header
// ────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, href }: { icon: React.ElementType; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h2>
      </div>
      {href && (
        <Link
          to={href}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Все <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────
// Skeleton loaders
// ────────────────────────────────────────────────
function PosterSkeleton() {
  return (
    <div className="space-y-2">
      <div className="poster-ratio rounded-lg skeleton-shimmer" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

// ────────────────────────────────────────────────
// Hero Carousel
// ────────────────────────────────────────────────
function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slides = movies.slice(0, 5)
  const total = slides.length

  const goTo = useCallback(
    (idx: number) => {
      if (isAnimating || idx === current) return
      setIsAnimating(true)
      setCurrent((idx + total) % total)
      setTimeout(() => setIsAnimating(false), 600)
    },
    [current, isAnimating, total]
  )

  useEffect(() => {
    if (total === 0) return
    timerRef.current = setTimeout(() => goTo((current + 1) % total), 10000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, total, goTo])

  if (total === 0) {
    return (
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-muted rounded-none overflow-hidden">
        <div className="skeleton-shimmer w-full h-full" />
      </div>
    )
  }

  const slide = slides[current]
  const backdropSrc = slide.backdrop ?? slide.poster ?? HERO_IMGS[current % HERO_IMGS.length]

  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] overflow-hidden bg-background hero-texture">
      {/* Background */}
      {slides.map((s, i) => {
        const src = s.backdrop ?? s.poster ?? HERO_IMGS[i % HERO_IMGS.length]
        return (
          <div
            key={s.guid}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === current ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={src}
              alt={s.title ?? ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover"
              onError={imgFallback}
            />
            <div className="absolute inset-0 cinematic-overlay" />
            <div className="absolute inset-0 cinematic-overlay-bottom" />
          </div>
        )
      })}

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pb-16 md:pb-24">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            {/* Meta row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {slide.age_rating && (
                <span className="px-2 py-0.5 rounded border border-border text-xs text-muted-foreground">
                  {slide.age_rating}
                </span>
              )}
              {slide.year && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />{slide.year}
                </span>
              )}
              {slide.duration_min && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />{slide.duration_min} мин
                </span>
              )}
              {slide.country && (
                <span className="text-sm text-muted-foreground">{slide.country}</span>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {slide.title ?? '—'}
            </h1>
            {slide.original_title && slide.original_title !== slide.title && (
              <p className="text-sm text-muted-foreground mb-3 italic">{slide.original_title}</p>
            )}

            {/* Description */}
            {slide.description && (
              <p className="text-sm md:text-base text-muted-foreground line-clamp-2 mb-6 max-w-xl">
                {slide.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {slide.trailer_url && (
                <a
                  href={slide.trailer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200',
                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/40'
                  )}
                >
                  <Play className="w-4 h-4 fill-current" /> Трейлер
                </a>
              )}
              <Link
                to={`/movies/${slide.guid}`}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200',
                  'bg-card/80 border border-border text-foreground hover:bg-card hover:border-primary/40'
                )}
              >
                Подробнее <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200',
                  'bg-card/60 border border-border text-muted-foreground hover:text-foreground hover:bg-card/80'
                )}
              >
                <Plus className="w-4 h-4" /> В список
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rating circle — top right */}
      <div className="absolute top-24 right-6 md:right-12 z-10">
        <motion.div
          key={`rating-${current}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <RatingCircle rating={slide.rating} size="lg" />
          {slide.votes_count && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {(slide.votes_count / 1000).toFixed(0)}K
            </p>
          )}
        </motion.div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              i === current
                ? 'w-6 h-2 bg-primary'
                : 'w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground'
            )}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => goTo((current - 1 + total) % total)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:text-primary hover:border-primary/40 transition-all duration-200"
        aria-label="Назад"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => goTo((current + 1) % total)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:text-primary hover:border-primary/40 transition-all duration-200"
        aria-label="Вперёд"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────
// Trending / Horizontal Scroll Row
// ────────────────────────────────────────────────
function HorizontalMovieRow({ movies, isLoading }: { movies: Movie[]; isLoading: boolean }) {
  return (
    <div className="scroll-row flex gap-4 pb-3">
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36 md:w-44">
              <PosterSkeleton />
            </div>
          ))
        : movies.map((m, i) => (
            <div key={m.guid} className="shrink-0 w-36 md:w-44">
              <MovieCard movie={m} index={i} />
            </div>
          ))}
    </div>
  )
}

// ────────────────────────────────────────────────
// Top Rated Section — numbered layout
// ────────────────────────────────────────────────
function TopRatedItem({ movie, rank, index }: { movie: Movie; rank: number; index: number }) {
  const fallbackImg = CARD_IMGS[index % CARD_IMGS.length]
  return (
    <Link to={`/movies/${movie.guid}`} className="group flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-card/60 transition-all duration-200 border border-transparent hover:border-border">
      <span
        className="text-4xl md:text-5xl font-extrabold text-border group-hover:text-primary/30 transition-colors shrink-0 w-10 text-right select-none"
        style={{ fontFamily: 'var(--font-heading)', lineHeight: 1 }}
      >
        {rank}
      </span>
      <div className="relative w-12 h-16 md:w-14 md:h-20 rounded overflow-hidden shrink-0 bg-muted">
        <img
          src={movie.poster ?? fallbackImg}
          alt={movie.title ?? ''}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={imgFallback}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
          {movie.title ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground">{movie.year ?? ''}</p>
      </div>
      <RatingCircle rating={movie.rating} size="sm" />
    </Link>
  )
}

// ────────────────────────────────────────────────
// New Releases Grid
// ────────────────────────────────────────────────
function NewReleasesGrid({ movies, isLoading }: { movies: Movie[]; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => <PosterSkeleton key={i} />)
        : movies.map((m, i) => <MovieCard key={m.guid} movie={m} index={i} />)}
    </div>
  )
}

// ────────────────────────────────────────────────
// Collections Section
// ────────────────────────────────────────────────
function CollectionCard({ col, index }: { col: Collection; index: number }) {
  const fallback = CARD_IMGS[(index + 3) % CARD_IMGS.length]
  return (
    <Link to="/collections" className="group relative rounded-xl overflow-hidden block card-hover" style={{ minHeight: 220 }}>
      <img
        src={col.cover_image ?? fallback}
        alt={col.name ?? ''}
        loading="lazy"
        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        onError={imgFallback}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      <div className="relative z-10 p-5 flex flex-col justify-end h-full" style={{ minHeight: 220 }}>
        <h3 className="text-base font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          {col.name ?? '—'}
        </h3>
        {col.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{col.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
            Открыть подборку
          </span>
        </div>
      </div>
    </Link>
  )
}

// ────────────────────────────────────────────────
// News Section
// ────────────────────────────────────────────────
function NewsCard({ item, large = false, index = 0 }: { item: NewsItem; large?: boolean; index?: number }) {
  const fallback = CARD_IMGS[index % CARD_IMGS.length]
  if (large) {
    return (
      <Link to="/news" className="group block relative rounded-xl overflow-hidden card-hover" style={{ minHeight: 380 }}>
        <img
          src={item.cover_image ?? fallback}
          alt={item.title ?? ''}
          loading="lazy"
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          onError={imgFallback}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
        <div className="relative z-10 p-6 flex flex-col justify-end h-full" style={{ minHeight: 380 }}>
          {item.category && (
            <Badge className="mb-3 w-fit bg-primary/20 border-primary/40 text-primary">{item.category}</Badge>
          )}
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 line-clamp-3" style={{ fontFamily: 'var(--font-heading)' }}>
            {item.title ?? '—'}
          </h3>
          {item.publish_date && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />{formatDate(item.publish_date)}
            </p>
          )}
        </div>
      </Link>
    )
  }
  return (
    <Link to="/news" className="group flex gap-3 p-3 rounded-lg hover:bg-card/60 border border-transparent hover:border-border transition-all duration-200">
      <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
        <img
          src={item.cover_image ?? fallback}
          alt={item.title ?? ''}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={imgFallback}
        />
      </div>
      <div className="flex-1 min-w-0">
        {item.category && (
          <span className="text-xs text-primary font-medium">{item.category}</span>
        )}
        <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
          {item.title ?? '—'}
        </p>
        {item.publish_date && (
          <p className="text-xs text-muted-foreground mt-1">{formatDate(item.publish_date)}</p>
        )}
      </div>
    </Link>
  )
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────
export default function HomePage() {
  // Featured movies for hero
  const { data: featuredData, isLoading: featuredLoading } = useQuery<ApiListResponse<Movie>>({
    queryKey: ['movies-featured'],
    queryFn: () => apiFetch('/v2/items/movies?filters[is_featured]=true&limit=5'),
  })

  // All movies for trending
  const { data: trendingData, isLoading: trendingLoading } = useQuery<ApiListResponse<Movie>>({
    queryKey: ['movies-trending'],
    queryFn: () => apiFetch('/v2/items/movies?limit=16&sort=-votes_count'),
  })

  // Top rated
  const { data: topRatedData, isLoading: topRatedLoading } = useQuery<ApiListResponse<Movie>>({
    queryKey: ['movies-top-rated'],
    queryFn: () => apiFetch('/v2/items/movies?limit=10&sort=-rating'),
  })

  // New releases
  const { data: newReleasesData, isLoading: newReleasesLoading } = useQuery<ApiListResponse<Movie>>({
    queryKey: ['movies-new-releases'],
    queryFn: () => apiFetch('/v2/items/movies?limit=10&sort=-year'),
  })

  // Series
  const { data: seriesData, isLoading: seriesLoading } = useQuery<ApiListResponse<Movie>>({
    queryKey: ['movies-series'],
    queryFn: () => apiFetch('/v2/items/movies?filters[content_type]=Сериал&limit=12&sort=-rating'),
  })

  // Collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery<ApiListResponse<Collection>>({
    queryKey: ['collections-featured'],
    queryFn: () => apiFetch('/v2/items/collections?filters[is_public]=true&limit=3'),
  })

  // News
  const { data: newsData, isLoading: newsLoading } = useQuery<ApiListResponse<NewsItem>>({
    queryKey: ['news-home'],
    queryFn: () => apiFetch('/v2/items/news?limit=4&sort=-publish_date'),
  })

  const featuredMovies: Movie[] = featuredData?.data?.data?.response ?? []
  const trendingMovies: Movie[] = trendingData?.data?.data?.response ?? []
  const topRatedMovies: Movie[] = topRatedData?.data?.data?.response ?? []
  const newReleases: Movie[] = newReleasesData?.data?.data?.response ?? []
  const series: Movie[] = seriesData?.data?.data?.response ?? []
  const collections: Collection[] = collectionsData?.data?.data?.response ?? []
  const newsItems: NewsItem[] = newsData?.data?.data?.response ?? []

  // Refs for inView animations
  const trendingRef = useRef(null)
  const topRef = useRef(null)
  const newRef = useRef(null)
  const seriesRef = useRef(null)
  const collectionsRef = useRef(null)
  const newsRef = useRef(null)

  const trendingInView = useInView(trendingRef, { once: true, margin: '-80px' })
  const topInView = useInView(topRef, { once: true, margin: '-80px' })
  const newInView = useInView(newRef, { once: true, margin: '-80px' })
  const seriesInView = useInView(seriesRef, { once: true, margin: '-80px' })
  const collectionsInView = useInView(collectionsRef, { once: true, margin: '-80px' })
  const newsInView = useInView(newsRef, { once: true, margin: '-80px' })

  // Hero: if featured is empty but we have any movies, use first 5
  const heroMovies = featuredMovies.length > 0 ? featuredMovies : trendingMovies.slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO ─── */}
      {featuredLoading ? (
        <div className="w-full h-[65vh] md:h-[85vh] skeleton-shimmer" />
      ) : (
        <HeroCarousel movies={heroMovies} />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-16 py-12">

        {/* ─── TRENDING NOW ─── */}
        <motion.section
          ref={trendingRef}
          initial={{ opacity: 0, y: 24 }}
          animate={trendingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeader icon={TrendingUp} title="Сейчас смотрят" href="/movies" />
          <HorizontalMovieRow movies={trendingMovies} isLoading={trendingLoading} />
        </motion.section>

        {/* ─── TOP RATED ─── */}
        <motion.section
          ref={topRef}
          initial={{ opacity: 0, y: 24 }}
          animate={topInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
        >
          <SectionHeader icon={Award} title="Топ-10 фильмов" href="/movies?sort=-rating" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {topRatedLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-10 h-8" />
                    <Skeleton className="w-12 h-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              : topRatedMovies.map((m, i) => (
                  <TopRatedItem key={m.guid} movie={m} rank={i + 1} index={i} />
                ))}
          </div>
        </motion.section>

        {/* ─── NEW RELEASES ─── */}
        <motion.section
          ref={newRef}
          initial={{ opacity: 0, y: 24 }}
          animate={newInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeader icon={Sparkles} title="Новинки" href="/movies?sort=-year" />
          <NewReleasesGrid movies={newReleases} isLoading={newReleasesLoading} />
        </motion.section>

        {/* ─── POPULAR SERIES ─── */}
        <motion.section
          ref={seriesRef}
          initial={{ opacity: 0, y: 24 }}
          animate={seriesInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeader icon={Star} title="Популярные сериалы" href="/movies?type=series" />
          <HorizontalMovieRow movies={series} isLoading={seriesLoading} />
        </motion.section>

        {/* ─── COLLECTIONS ─── */}
        <motion.section
          ref={collectionsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={collectionsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeader icon={BookOpen} title="Подборки" href="/collections" />
          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="rounded-xl" style={{ minHeight: 220 }} />
              ))}
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {collections.map((col, i) => (
                <CollectionCard key={col.guid} col={col} index={i} />
              ))}
            </div>
          ) : (
            // Fallback with static collection cards from image pool
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { guid: 'c1', name: 'Лучшие триллеры', description: 'Захватывающие фильмы, которые не отпустят до финала', cover_image: CARD_IMGS[0] },
                { guid: 'c2', name: 'Классика кино', description: 'Золотой фонд мирового кинематографа — шедевры, проверенные временем', cover_image: CARD_IMGS[2] },
                { guid: 'c3', name: 'Новинки 2024', description: 'Самые ожидаемые премьеры этого года', cover_image: CARD_IMGS[4] },
              ].map((col, i) => (
                <CollectionCard key={col.guid} col={col} index={i} />
              ))}
            </div>
          )}
        </motion.section>

        {/* ─── LATEST NEWS ─── */}
        <motion.section
          ref={newsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={newsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeader icon={BookOpen} title="Последние новости" href="/news" />
          {newsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Skeleton className="rounded-xl" style={{ minHeight: 380 }} />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="rounded-lg h-24" />
                ))}
              </div>
            </div>
          ) : newsItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Large featured */}
              <NewsCard item={newsItems[0]} large index={0} />
              {/* Stacked small */}
              <div className="flex flex-col gap-2">
                {newsItems.slice(1, 4).map((n, i) => (
                  <NewsCard key={n.guid} item={n} index={i + 1} />
                ))}
                <Link
                  to="/news"
                  className="mt-2 flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200"
                >
                  Все новости <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            // Fallback static news
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <NewsCard
                item={{
                  guid: 'n1',
                  title: 'Оскар 2024: полный список победителей и главные сюрпризы церемонии',
                  category: 'Награды',
                  cover_image: CARD_IMGS[1],
                  publish_date: '2024-03-10',
                }}
                large
                index={0}
              />
              <div className="flex flex-col gap-2">
                {[
                  { guid: 'n2', title: 'Новый фильм Нолана соберёт рекордную кассу', category: 'Кино', cover_image: CARD_IMGS[3], publish_date: '2024-03-08' },
                  { guid: 'n3', title: 'Стриминговые сервисы меняют правила игры в Голливуде', category: 'Индустрия', cover_image: CARD_IMGS[5], publish_date: '2024-03-06' },
                  { guid: 'n4', title: 'Каннский фестиваль объявил программу 2024 года', category: 'Фестиваль', cover_image: CARD_IMGS[7], publish_date: '2024-03-04' },
                ].map((n, i) => (
                  <NewsCard key={n.guid} item={n} index={i + 1} />
                ))}
                <Link
                  to="/news"
                  className="mt-2 flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200"
                >
                  Все новости <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </motion.section>

        {/* ─── CTA BANNER ─── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={HERO_IMGS[2]}
              alt="Присоединяйтесь к КиноПорталу"
              loading="lazy"
              className="w-full h-48 md:h-64 object-cover"
              onError={imgFallback}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 md:px-12 max-w-lg">
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Ваш личный кинотеатр
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Оценивайте фильмы, создавайте подборки, читайте рецензии и находите идеальное кино для каждого настроения.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/auth"
                    className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-primary/40"
                  >
                    Начать бесплатно
                  </Link>
                  <Link
                    to="/movies"
                    className="px-5 py-2.5 rounded-lg border border-border bg-card/60 text-foreground font-semibold text-sm hover:border-primary/40 transition-all duration-200"
                  >
                    Смотреть каталог
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  )
}
