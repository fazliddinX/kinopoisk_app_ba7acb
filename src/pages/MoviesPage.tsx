import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Grid3X3, List, SlidersHorizontal, X, ChevronDown,
  Star, Clock, Calendar, Plus, BookmarkPlus, Filter, ChevronRight
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY  = import.meta.env.VITE_X_API_KEY

const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API-KEY',
  'x-api-key': API_KEY,
}

function extractList<T>(data: unknown): T[] {
  if (!data) return []
  const d = data as Record<string, unknown>
  const inner = d?.data as Record<string, unknown> | undefined
  const resp = inner?.response ?? (inner?.data as Record<string, unknown> | undefined)?.response
  if (Array.isArray(resp)) return resp as T[]
  return []
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
  age_rating?: string
  is_featured?: boolean
  genres_id?: string
}

interface Genre {
  guid: string
  name?: string
  slug_name?: string
}

const COUNTRIES = [
  'Все страны', 'США', 'Великобритания', 'Франция', 'Германия',
  'Италия', 'Япония', 'Южная Корея', 'Россия', 'Испания'
]

const SORT_OPTIONS = [
  { value: 'rating', label: 'По рейтингу' },
  { value: 'year',   label: 'По году' },
  { value: 'votes',  label: 'По голосам' },
  { value: 'title',  label: 'По названию' },
]

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?ixlib=rb-4.1.0&w=400&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1761926642798-5ec47e7013cd?ixlib=rb-4.1.0&w=400&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixlib=rb-4.1.0&w=400&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixlib=rb-4.1.0&w=400&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixlib=rb-4.1.0&w=400&h=600&fit=crop&auto=format&q=80',
]

function getRatingClass(rating?: number) {
  if (!rating) return 'rating-none'
  if (rating >= 7) return 'rating-high'
  if (rating >= 5) return 'rating-mid'
  return 'rating-low'
}

function formatDuration(min?: number) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────
function SkeletonCard({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
        <Skeleton className="w-20 h-28 rounded-lg shrink-0 skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2 skeleton-shimmer" />
          <Skeleton className="h-4 w-1/3 skeleton-shimmer" />
          <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
          <Skeleton className="h-4 w-2/3 skeleton-shimmer" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="poster-ratio w-full rounded-xl skeleton-shimmer" />
      <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
      <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
    </div>
  )
}

// ─── Movie Grid Card ────────────────────────────────────────────────────────
function MovieGridCard({ movie, index }: { movie: Movie; index: number }) {
  const navigate = useNavigate()
  const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (index % 5) * 0.07 }}
      className="group relative cursor-pointer"
      onClick={() => navigate(`/movies/${movie.guid}`)}
    >
      {/* Poster */}
      <div className="poster-ratio relative rounded-xl overflow-hidden bg-card border border-border">
        <img
          src={movie.poster ?? fallback}
          alt={movie.title ?? 'Movie poster'}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = fallback
          }}
        />
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />

        {/* Rating badge */}
        {movie.rating != null && (
          <div className={cn(
            'absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold',
            getRatingClass(movie.rating)
          )}>
            {movie.rating.toFixed(1)}
          </div>
        )}

        {/* Age rating */}
        {movie.age_rating && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-semibold bg-black/70 text-muted-foreground border border-border">
            {movie.age_rating}
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <BookmarkPlus className="w-3 h-3" />
              Смотреть
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
          {movie.title ?? '—'}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {movie.year && <span>{movie.year}</span>}
          {movie.duration_min && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
              <span>{formatDuration(movie.duration_min)}</span>
            </>
          )}
          {movie.content_type && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
              <span className="text-primary/80">{movie.content_type}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Movie List Card ────────────────────────────────────────────────────────
function MovieListCard({ movie, index }: { movie: Movie; index: number }) {
  const navigate = useNavigate()
  const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (index % 10) * 0.04 }}
      className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 cursor-pointer card-hover"
      onClick={() => navigate(`/movies/${movie.guid}`)}
    >
      {/* Poster thumbnail */}
      <div className="relative w-20 shrink-0 rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '2/3' }}>
        <img
          src={movie.poster ?? fallback}
          alt={movie.title ?? 'Movie poster'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = fallback
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {movie.title ?? '—'}
            </h3>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{movie.original_title}</p>
            )}
          </div>
          {movie.rating != null && (
            <div className={cn(
              'shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold',
              getRatingClass(movie.rating)
            )}>
              {movie.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
          {movie.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />{movie.year}
            </span>
          )}
          {movie.duration_min && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatDuration(movie.duration_min)}
            </span>
          )}
          {movie.country && (
            <span>{movie.country}</span>
          )}
          {movie.content_type && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              {movie.content_type}
            </Badge>
          )}
          {movie.age_rating && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {movie.age_rating}
            </Badge>
          )}
          {movie.votes_count && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {movie.votes_count.toLocaleString('ru-RU')}
            </span>
          )}
        </div>

        {/* Description */}
        {movie.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {movie.description}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center">
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen]   = useState(false)
  const [page, setPage]                 = useState(1)
  const [allMovies, setAllMovies]       = useState<Movie[]>([])
  const pageSize = 20

  // Filter state
  const [selectedGenres,  setSelectedGenres]  = useState<string[]>([])  // genre guids
  const [selectedCountry, setSelectedCountry] = useState('Все страны')
  const [contentType,     setContentType]     = useState<'all' | 'film' | 'series'>('all')
  const [minRating,       setMinRating]       = useState(0)
  const [maxRating,       setMaxRating]       = useState(10)
  const [yearFrom,        setYearFrom]        = useState<string>('')
  const [yearTo,          setYearTo]          = useState<string>('')
  const [sortBy,          setSortBy]          = useState('rating')
  const [searchQ,         setSearchQ]         = useState(searchParams.get('q') ?? '')

  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })

  // ─── Fetch Genres ─────────────────────────────────────────────────────────
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v2/items/genres`, { headers })
      if (!res.ok) throw new Error('genres fetch failed')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })
  const genres = extractList<Genre>(genresData)

  // ─── Fetch Movies ─────────────────────────────────────────────────────────
  const { data: moviesData, isLoading, isFetching } = useQuery({
    queryKey: ['movies-catalog', page, sortBy, selectedGenres, selectedCountry, contentType, minRating, maxRating, yearFrom, yearTo, searchQ],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', String(pageSize))
      params.set('offset', String((page - 1) * pageSize))
      if (searchQ) params.set('search', searchQ)
      const res = await fetch(`${API_BASE}/v2/items/movies?${params}`, { headers })
      if (!res.ok) throw new Error('movies fetch failed')
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })

  const rawMovies = extractList<Movie>(moviesData)

  // Filter + sort client-side
  const filteredMovies = rawMovies
    .filter(m => {
      if (contentType === 'film'   && (m.content_type ?? '').toLowerCase().includes('сериал')) return false
      if (contentType === 'series' && !(m.content_type ?? '').toLowerCase().includes('сериал')) return false
      if (selectedCountry !== 'Все страны' && m.country !== selectedCountry) return false
      if (m.rating != null && (m.rating < minRating || m.rating > maxRating)) return false
      if (yearFrom && m.year && m.year < Number(yearFrom)) return false
      if (yearTo   && m.year && m.year > Number(yearTo))   return false
      if (searchQ) {
        const q = searchQ.toLowerCase()
        if (!(m.title ?? '').toLowerCase().includes(q) && !(m.original_title ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sortBy === 'year')   return (b.year   ?? 0) - (a.year   ?? 0)
      if (sortBy === 'votes')  return (b.votes_count ?? 0) - (a.votes_count ?? 0)
      if (sortBy === 'title')  return (a.title ?? '').localeCompare(b.title ?? '')
      return 0
    })

  // Accumulate pages
  useEffect(() => {
    if (page === 1) {
      setAllMovies(filteredMovies)
    } else {
      setAllMovies(prev => {
        const existingGuids = new Set(prev.map(m => m.guid))
        const newOnes = filteredMovies.filter(m => !existingGuids.has(m.guid))
        return [...prev, ...newOnes]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moviesData, page, sortBy, selectedGenres, selectedCountry, contentType, minRating, maxRating, yearFrom, yearTo, searchQ])

  // Reset to page 1 on filter change
  const resetFilters = useCallback(() => {
    setPage(1)
    setAllMovies([])
  }, [])

  const handleGenreToggle = (guid: string) => {
    setSelectedGenres(prev =>
      prev.includes(guid) ? prev.filter(g => g !== guid) : [...prev, guid]
    )
    resetFilters()
  }

  const handleCountryChange = (c: string) => { setSelectedCountry(c); resetFilters() }
  const handleContentType   = (ct: 'all' | 'film' | 'series') => { setContentType(ct); resetFilters() }
  const handleSortChange    = (s: string) => { setSortBy(s); resetFilters() }
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); resetFilters() }

  const clearAllFilters = () => {
    setSelectedGenres([])
    setSelectedCountry('Все страны')
    setContentType('all')
    setMinRating(0)
    setMaxRating(10)
    setYearFrom('')
    setYearTo('')
    setSearchQ('')
    resetFilters()
  }

  const activeFilterCount =
    selectedGenres.length +
    (selectedCountry !== 'Все страны' ? 1 : 0) +
    (contentType !== 'all' ? 1 : 0) +
    (minRating > 0 || maxRating < 10 ? 1 : 0) +
    (yearFrom || yearTo ? 1 : 0)

  const hasMore = rawMovies.length === pageSize

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative h-52 md:h-64 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80"
          alt="Cinema catalog"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none';
            (e.currentTarget.parentElement as HTMLElement).style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
          }}
        />
        <div className="absolute inset-0 cinematic-overlay-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 hero-texture" />
        <div className="relative z-10 h-full flex flex-col justify-end pb-8 px-4 sm:px-6 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 className="text-3xl md:text-5xl font-bold gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
              Каталог фильмов
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Тысячи фильмов и сериалов — найдите своё следующее кино
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Sticky Filters Bar ───────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">

          {/* Top row: search + sort + view toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="input-dark pl-9 h-10 text-sm"
              />
            </form>

            {/* Content type tabs */}
            <div className="flex rounded-lg overflow-hidden border border-border shrink-0">
              {(['all', 'film', 'series'] as const).map(ct => (
                <button
                  key={ct}
                  onClick={() => handleContentType(ct)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    contentType === ct
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {ct === 'all' ? 'Все' : ct === 'film' ? 'Фильмы' : 'Сериалы'}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value)}
                className="input-dark h-10 pr-8 text-sm appearance-none cursor-pointer"
                style={{ paddingRight: '2rem' }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-border shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-2 transition-colors',
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 transition-colors',
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen(prev => !prev)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium shrink-0',
                filtersOpen || activeFilterCount > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтры
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters panel */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mt-4 pt-4 border-t border-border space-y-5 overflow-hidden"
            >
              {/* Genres */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Жанры</p>
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => (
                    <button
                      key={g.guid}
                      onClick={() => handleGenreToggle(g.guid)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                        selectedGenres.includes(g.guid)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {g.name ?? '—'}
                    </button>
                  ))}
                  {genres.length === 0 && (
                    <span className="text-xs text-muted-foreground">Загрузка жанров...</span>
                  )}
                </div>
              </div>

              {/* Country, Year range, Rating range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Country */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Страна</p>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={e => handleCountryChange(e.target.value)}
                      className="input-dark h-10 text-sm appearance-none pr-8"
                      style={{ paddingRight: '2rem' }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Year from */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Год от</p>
                  <input
                    type="number"
                    placeholder="1970"
                    value={yearFrom}
                    min={1900}
                    max={2025}
                    onChange={e => { setYearFrom(e.target.value); resetFilters() }}
                    className="input-dark h-10 text-sm"
                  />
                </div>

                {/* Year to */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Год до</p>
                  <input
                    type="number"
                    placeholder="2025"
                    value={yearTo}
                    min={1900}
                    max={2025}
                    onChange={e => { setYearTo(e.target.value); resetFilters() }}
                    className="input-dark h-10 text-sm"
                  />
                </div>

                {/* Rating min */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Рейтинг: {minRating.toFixed(1)} — {maxRating.toFixed(1)}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0} max={10} step={0.5}
                      value={minRating}
                      onChange={e => { setMinRating(Number(e.target.value)); resetFilters() }}
                      className="flex-1 accent-primary"
                    />
                    <input
                      type="range"
                      min={0} max={10} step={0.5}
                      value={maxRating}
                      onChange={e => { setMaxRating(Number(e.target.value)); resetFilters() }}
                      className="flex-1 accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  Сбросить все фильтры
                </button>
              )}
            </motion.div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && !filtersOpen && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedGenres.map(guid => {
                const g = genres.find(x => x.guid === guid)
                return (
                  <span key={guid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
                    {g?.name ?? guid}
                    <button onClick={() => handleGenreToggle(guid)} className="hover:text-accent"><X className="w-3 h-3" /></button>
                  </span>
                )
              })}
              {selectedCountry !== 'Все страны' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
                  {selectedCountry}
                  <button onClick={() => { setSelectedCountry('Все страны'); resetFilters() }} className="hover:text-accent"><X className="w-3 h-3" /></button>
                </span>
              )}
              {(yearFrom || yearTo) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
                  {yearFrom || '…'} – {yearTo || '…'}
                  <button onClick={() => { setYearFrom(''); setYearTo(''); resetFilters() }} className="hover:text-accent"><X className="w-3 h-3" /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-accent transition-colors underline">
                Сбросить всё
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Загрузка...'
              : (
                <span>
                  Найдено{' '}
                  <span className="text-foreground font-semibold">
                    {allMovies.length.toLocaleString('ru-RU')}
                  </span>
                  {' '}фильм{allMovies.length % 10 === 1 && allMovies.length % 100 !== 11 ? '' : allMovies.length % 10 >= 2 && allMovies.length % 10 <= 4 && (allMovies.length % 100 < 10 || allMovies.length % 100 >= 20) ? 'а' : 'ов'}
                </span>
              )
            }
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Сбросить фильтры
            </button>
          )}
        </motion.div>

        {/* Loading skeletons */}
        {isLoading && allMovies.length === 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 15 }).map((_, i) => (
                <SkeletonCard key={i} view="grid" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} view="list" />
              ))}
            </div>
          )
        )}

        {/* Empty state */}
        {!isLoading && allMovies.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Ничего не найдено</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Попробуйте изменить параметры поиска или сбросить фильтры
            </p>
            <Button variant="outline" className="mt-6" onClick={clearAllFilters}>
              Сбросить фильтры
            </Button>
          </motion.div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && allMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allMovies.map((movie, i) => (
              <MovieGridCard key={movie.guid} movie={movie} index={i} />
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && allMovies.length > 0 && (
          <div className="flex flex-col gap-3">
            {allMovies.map((movie, i) => (
              <MovieListCard key={movie.guid} movie={movie} index={i} />
            ))}
          </div>
        )}

        {/* Loading more indicator */}
        {isFetching && allMovies.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Load more / Pagination */}
        {!isFetching && hasMore && allMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 mt-12"
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-px w-16 bg-border" />
              <span>Показано {allMovies.length} из {allMovies.length}+</span>
              <div className="h-px w-16 bg-border" />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setPage(prev => prev + 1)}
              className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 px-10"
            >
              Загрузить ещё
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Featured Cinematic Banner */}
        {!isLoading && allMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="mt-20 relative rounded-2xl overflow-hidden"
          >
            <div className="relative h-48 md:h-64">
              <img
                src="https://images.unsplash.com/photo-1566944284128-0630ae1a2271?ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80"
                alt="Cinema experience"
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.parentElement as HTMLElement).style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                }}
              />
              <div className="absolute inset-0 cinematic-overlay" />
              <div className="absolute inset-0 hero-texture" />
              <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12">
                <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">Персональные рекомендации</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                  Войдите, чтобы получить<br className="hidden md:block" /> список для вас
                </h2>
                <div className="flex gap-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/collections"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-foreground text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
                  >
                    Подборки
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
