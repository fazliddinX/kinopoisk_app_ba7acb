import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Film, Users, Star, Clock, Calendar, ChevronRight, Loader2, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API-KEY',
  'x-api-key': API_KEY,
}

function getRatingClass(rating: number | null | undefined) {
  if (!rating) return 'rating-none'
  if (rating >= 7) return 'rating-high'
  if (rating >= 5) return 'rating-mid'
  return 'rating-low'
}

function formatDuration(min: number | null | undefined) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} мин`
  return `${h} ч ${m} мин`
}

interface Movie {
  guid: string
  title?: string
  original_title?: string
  poster?: string
  backdrop?: string
  year?: number
  duration_min?: number
  rating?: number
  votes_count?: number
  country?: string
  content_type?: string
  description?: string
  age_rating?: string
}

interface Actor {
  guid: string
  name?: string
  original_name?: string
  photo?: string
  birth_date?: string
  birth_place?: string
  biography?: string
}

const THUMB_IMAGES = [
  'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1761926642798-5ec47e7013cd?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
]

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1761926642798-5ec47e7013cd?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80',
]

async function fetchMovies(query: string): Promise<Movie[]> {
  try {
    const res = await fetch(
      `${API_BASE}/v2/items/movies?search=${encodeURIComponent(query)}&limit=30`,
      { headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.data?.data?.response) ? data.data.data.response : []
  } catch {
    return []
  }
}

async function fetchActors(query: string): Promise<Actor[]> {
  try {
    const res = await fetch(
      `${API_BASE}/v2/items/actors?search=${encodeURIComponent(query)}&limit=20`,
      { headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.data?.data?.response) ? data.data.data.response : []
  } catch {
    return []
  }
}

async function fetchSuggestions(query: string): Promise<{ movies: Movie[]; actors: Actor[] }> {
  const [movies, actors] = await Promise.all([
    fetchMovies(query),
    fetchActors(query),
  ])
  return { movies: movies.slice(0, 5), actors: actors.slice(0, 3) }
}

function MovieCardGrid({ movie, index }: { movie: Movie; index: number }) {
  const fallbackImg = THUMB_IMAGES[index % THUMB_IMAGES.length]
  const rating = movie.rating ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link
        to={`/movies/${movie.guid}`}
        className="group block card-hover rounded-xl overflow-hidden bg-card border border-border"
      >
        <div className="poster-ratio relative overflow-hidden">
          <img
            src={movie.poster || fallbackImg}
            alt={movie.title ?? 'Фильм'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = fallbackImg
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {rating > 0 && (
            <div className={cn('absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-lg', getRatingClass(rating))}>
              {rating.toFixed(1)}
            </div>
          )}
          {movie.age_rating && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-muted-foreground border border-white/10">
              {movie.age_rating}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button size="sm" className="w-full text-xs h-8">
              Подробнее
            </Button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
            {movie.title ?? '—'}
          </h3>
          {movie.original_title && movie.original_title !== movie.title && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{movie.original_title}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            {movie.year && <span>{movie.year}</span>}
            {movie.duration_min && (
              <>
                <span>·</span>
                <span>{formatDuration(movie.duration_min)}</span>
              </>
            )}
          </div>
          {movie.content_type && (
            <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0.5 border-primary/30 text-primary">
              {movie.content_type}
            </Badge>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function MovieCardList({ movie, index }: { movie: Movie; index: number }) {
  const fallbackImg = THUMB_IMAGES[index % THUMB_IMAGES.length]
  const rating = movie.rating ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: 'easeOut' }}
    >
      <Link
        to={`/movies/${movie.guid}`}
        className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 card-hover"
      >
        <div className="relative w-16 h-24 rounded-lg overflow-hidden shrink-0">
          <img
            src={movie.poster || fallbackImg}
            alt={movie.title ?? 'Фильм'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = fallbackImg
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {movie.title ?? '—'}
              </h3>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{movie.original_title}</p>
              )}
            </div>
            {rating > 0 && (
              <div className={cn('shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', getRatingClass(rating))}>
                {rating.toFixed(1)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            {movie.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {movie.year}
              </span>
            )}
            {movie.duration_min && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(movie.duration_min)}
              </span>
            )}
            {movie.country && <span>{movie.country}</span>}
            {movie.content_type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                {movie.content_type}
              </Badge>
            )}
          </div>
          {movie.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{movie.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </motion.div>
  )
}

function ActorCard({ actor, index }: { actor: Actor; index: number }) {
  const fallbackImg = THUMB_IMAGES[index % THUMB_IMAGES.length]

  const getAge = (birthDate?: string) => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    const now = new Date()
    const age = now.getFullYear() - birth.getFullYear()
    return age > 0 && age < 120 ? age : null
  }

  const age = getAge(actor.birth_date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Link
        to={`/actors/${actor.guid}`}
        className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 card-hover text-center"
      >
        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all duration-300">
          <img
            src={actor.photo || fallbackImg}
            alt={actor.name ?? 'Актёр'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) parent.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
            {actor.name ?? '—'}
          </h3>
          {actor.original_name && (
            <p className="text-xs text-muted-foreground mt-0.5">{actor.original_name}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
            {age && <span>{age} лет</span>}
            {actor.birth_place && (
              <>
                {age && <span>·</span>}
                <span className="line-clamp-1">{actor.birth_place}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function SkeletonGrid({ count = 10, view = 'grid' }: { count?: number; view?: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border">
            <Skeleton className="w-16 h-24 rounded-lg shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5 mt-1" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-card border border-border">
          <Skeleton className="poster-ratio w-full" />
          <div className="p-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(initialQuery)
  const [activeQuery, setActiveQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('movies')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [movies, setMovies] = useState<Movie[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [suggestions, setSuggestions] = useState<{ movies: Movie[]; actors: Actor[] }>({ movies: [], actors: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggLoading, setSuggLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch results on query change
  useEffect(() => {
    if (!activeQuery.trim()) {
      setMovies([])
      setActors([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(false)
    Promise.all([fetchMovies(activeQuery), fetchActors(activeQuery)]).then(([m, a]) => {
      setMovies(m)
      setActors(a)
      setLoading(false)
      setSearched(true)
    })
  }, [activeQuery])

  // Suggestions debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const val = inputValue.trim()
    if (!val || val === activeQuery) {
      setSuggestions({ movies: [], actors: [] })
      setShowSuggestions(false)
      return
    }
    if (val.length < 2) return
    setSuggLoading(true)
    debounceRef.current = setTimeout(async () => {
      const sugg = await fetchSuggestions(val)
      setSuggestions(sugg)
      setShowSuggestions(sugg.movies.length > 0 || sugg.actors.length > 0)
      setSuggLoading(false)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue, activeQuery])

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (!q) return
    setActiveQuery(q)
    setShowSuggestions(false)
    setSearchParams({ q })
  }

  const handleSuggestionClick = (q: string) => {
    setInputValue(q)
    setActiveQuery(q)
    setShowSuggestions(false)
    setSearchParams({ q })
  }

  const clearSearch = () => {
    setInputValue('')
    setActiveQuery('')
    setMovies([])
    setActors([])
    setSearched(false)
    setShowSuggestions(false)
    setSearchParams({})
    inputRef.current?.focus()
  }

  const films = movies.filter(m => (m.content_type ?? '').toLowerCase() !== 'сериал')
  const series = movies.filter(m => (m.content_type ?? '').toLowerCase() === 'сериал')

  const tabCounts = {
    movies: films.length,
    series: series.length,
    actors: actors.length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Banner */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGES[0]}
            alt="Поиск"
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) parent.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
          <div className="hero-texture absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center mb-8"
          >
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {activeQuery ? (
                <>
                  Результаты для{' '}
                  <span className="text-primary">&laquo;{activeQuery}&raquo;</span>
                </>
              ) : (
                <>Поиск по кинобазе</>
              )}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Фильмы, сериалы, актёры — всё в одном месте
            </p>
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="relative max-w-2xl mx-auto"
          >
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => {
                    if (suggestions.movies.length > 0 || suggestions.actors.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  placeholder="Введите название фильма или имя актёра..."
                  className={cn(
                    'w-full h-14 pl-12 pr-20 rounded-xl text-base',
                    'glass border border-white/10',
                    'text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]',
                    'transition-all duration-200'
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {(inputValue || suggLoading) && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      {suggLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Найти
                  </button>
                </div>
              </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (suggestions.movies.length > 0 || suggestions.actors.length > 0) && (
                <motion.div
                  ref={suggestionsRef}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 z-50 glass border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  {suggestions.movies.length > 0 && (
                    <div>
                      <div className="px-4 py-2 border-b border-white/5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Фильмы</span>
                      </div>
                      {suggestions.movies.map((movie) => (
                        <button
                          key={movie.guid}
                          onClick={() => handleSuggestionClick(movie.title ?? '')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-8 h-12 rounded overflow-hidden shrink-0 bg-muted">
                            <img
                              src={movie.poster || THUMB_IMAGES[0]}
                              alt={movie.title ?? ''}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none' }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{movie.title ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {[movie.year, movie.content_type].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          {(movie.rating ?? 0) > 0 && (
                            <span className={cn('ml-auto shrink-0 text-xs font-bold px-2 py-0.5 rounded-full', getRatingClass(movie.rating!))}>
                              {(movie.rating ?? 0).toFixed(1)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.actors.length > 0 && (
                    <div>
                      <div className="px-4 py-2 border-t border-white/5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Актёры</span>
                      </div>
                      {suggestions.actors.map((actor) => (
                        <button
                          key={actor.guid}
                          onClick={() => navigate(`/actors/${actor.guid}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-muted">
                            <img
                              src={actor.photo || THUMB_IMAGES[1]}
                              alt={actor.name ?? ''}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none' }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{actor.name ?? '—'}</p>
                            {actor.original_name && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{actor.original_name}</p>
                            )}
                          </div>
                          <Users className="ml-auto shrink-0 w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* No query state */}
        {!activeQuery && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Начните поиск
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Введите название фильма, сериала или имя актёра в строку поиска выше, чтобы найти нужное.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['Интерстеллар', 'Кристофер Нолан', 'Крестный отец', 'Брэд Питт', 'Матрица'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => {
                    setInputValue(hint)
                    setActiveQuery(hint)
                    setSearchParams({ q: hint })
                  }}
                  className="px-4 py-2 rounded-full text-sm bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/40 transition-all duration-200"
                >
                  {hint}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Поиск...</span>
            </div>
            <SkeletonGrid count={10} view={viewMode} />
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Найдено: {movies.length + actors.length} результатов
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Фильмы: {films.length} · Сериалы: {series.length} · Актёры: {actors.length}
                </p>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Вид:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg border transition-all',
                    viewMode === 'grid'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Сетка"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="0" y="0" width="6" height="6" rx="1" />
                    <rect x="8" y="0" width="6" height="6" rx="1" />
                    <rect x="0" y="8" width="6" height="6" rx="1" />
                    <rect x="8" y="8" width="6" height="6" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg border transition-all',
                    viewMode === 'list'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Список"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {movies.length === 0 && actors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Film className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Ничего не найдено
                </h3>
                <p className="text-muted-foreground">
                  По запросу &laquo;{activeQuery}&raquo; результатов не найдено. Попробуйте изменить запрос.
                </p>
                <Button variant="outline" className="mt-6" onClick={clearSearch}>
                  Очистить поиск
                </Button>
              </motion.div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 bg-card border border-border h-auto p-1 flex-wrap gap-1">
                  <TabsTrigger
                    value="movies"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                  >
                    <Film className="w-3.5 h-3.5" />
                    Фильмы
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                      {tabCounts.movies}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="series"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Сериалы
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                      {tabCounts.series}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="actors"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Актёры
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                      {tabCounts.actors}
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Films Tab */}
                <TabsContent value="movies">
                  {films.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Фильмов по этому запросу не найдено</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {films.map((movie, i) => (
                        <MovieCardGrid key={movie.guid} movie={movie} index={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {films.map((movie, i) => (
                        <MovieCardList key={movie.guid} movie={movie} index={i} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Series Tab */}
                <TabsContent value="series">
                  {series.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Сериалов по этому запросу не найдено</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {series.map((movie, i) => (
                        <MovieCardGrid key={movie.guid} movie={movie} index={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {series.map((movie, i) => (
                        <MovieCardList key={movie.guid} movie={movie} index={i} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Actors Tab */}
                <TabsContent value="actors">
                  {actors.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Актёров по этому запросу не найдено</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {actors.map((actor, i) => (
                        <ActorCard key={actor.guid} actor={actor} index={i} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </motion.div>
        )}

        {/* Quick links when no query */}
        {!activeQuery && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="mt-12"
          >
            <h2 className="text-xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
              Популярные разделы
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Лучшие фильмы',
                  desc: 'Топ фильмов по рейтингу всех времён',
                  img: 'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
                  href: '/movies',
                  icon: Film,
                },
                {
                  title: 'Подборки',
                  desc: 'Кураторские коллекции от редакции',
                  img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
                  href: '/collections',
                  icon: Star,
                },
                {
                  title: 'Новости кино',
                  desc: 'Свежие события из мира кинематографа',
                  img: 'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
                  href: '/news',
                  icon: Users,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group relative overflow-hidden rounded-xl border border-border card-hover"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) parent.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                          <ChevronRight className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
