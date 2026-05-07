import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Play,
  Bookmark,
  Star,
  Clock,
  Calendar,
  Globe,
  Shield,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  User,
  Clapperboard,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── API Config ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'API-KEY',
  'x-api-key': API_KEY,
}

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: apiHeaders })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: apiHeaders,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ─── Types ───────────────────────────────────────────────────────────────────
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
  genres_id?: string
}

interface CastRole {
  guid: string
  role_name?: string
  role_type?: string
  billing_order?: number
  actors_id?: string
  movies_id?: string
}

interface Actor {
  guid: string
  name?: string
  original_name?: string
  photo?: string
  birth_date?: string
  birth_place?: string
}

interface Review {
  guid: string
  title?: string
  body?: string
  rating?: number
  review_type?: string
  likes_count?: number
  dislikes_count?: number
  users_id?: string
}

interface Genre {
  guid: string
  name?: string
  slug_name?: string
}

interface MovieGenre {
  guid: string
  movies_id?: string
  genres_id?: string
  is_primary?: boolean
}

// ─── Helper functions ────────────────────────────────────────────────────────
function extractList<T>(data: unknown): T[] {
  if (!data) return []
  const d = data as { data?: { data?: { response?: T[] } } }
  return d?.data?.data?.response ?? []
}

function getRatingClass(rating: number | undefined) {
  if (!rating) return 'rating-none'
  if (rating >= 7) return 'rating-high'
  if (rating >= 5) return 'rating-mid'
  return 'rating-low'
}

function formatDuration(min: number | undefined) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} мин`
  return `${h} ч ${m} мин`
}

const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80'
const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80'
const ACTOR_FALLBACKS = [
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
]

// ─── Skeleton loaders ────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="relative w-full" style={{ minHeight: 600 }}>
      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-32 pb-12 flex flex-col lg:flex-row gap-8">
        <Skeleton className="w-52 h-80 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-10 w-2/3 rounded" />
          <Skeleton className="h-5 w-1/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-20 w-full rounded" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40 rounded" />
            <Skeleton className="h-10 w-32 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Rating Circle ───────────────────────────────────────────────────────────
function RatingCircle({ rating, size = 'md' }: { rating: number | undefined; size?: 'sm' | 'md' | 'lg' }) {
  const cls = getRatingClass(rating)
  const sizeMap = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold font-heading shrink-0',
        sizeMap[size],
        cls
      )}
    >
      {rating?.toFixed(1) ?? '—'}
    </div>
  )
}

// ─── Star Selector ───────────────────────────────────────────────────────────
function StarRatingSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`Оценить ${star}`}
        >
          <Star
            className={cn(
              'w-5 h-5 transition-colors',
              (hover || value) >= star ? 'text-primary fill-primary' : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Review Card ─────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false)
  const body = review.body ?? ''
  const isLong = body.length > 300

  const typeConfig: Record<string, { label: string; color: string }> = {
    positive: { label: 'Позитивная', color: 'text-emerald-400' },
    negative: { label: 'Негативная', color: 'text-red-400' },
    neutral: { label: 'Нейтральная', color: 'text-muted-foreground' },
  }
  const typeKey = (review.review_type ?? 'neutral').toLowerCase()
  const typeInfo = typeConfig[typeKey] ?? typeConfig.neutral

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 24 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass rounded-xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-border">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{review.title ?? 'Без заголовка'}</p>
            <p className={cn('text-xs', typeInfo.color)}>{typeInfo.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {review.rating != null && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                getRatingClass(review.rating)
              )}
            >
              {review.rating}/10
            </span>
          )}
        </div>
      </div>

      <p className={cn('text-sm text-muted-foreground leading-relaxed', !expanded && isLong && 'line-clamp-4')}>
        {body || 'Текст рецензии отсутствует.'}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          {expanded ? 'Свернуть' : 'Читать далее'}
          <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
        </button>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
          <ThumbsUp className="w-3.5 h-3.5" />
          {review.likes_count ?? 0}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
          <ThumbsDown className="w-3.5 h-3.5" />
          {review.dislikes_count ?? 0}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Similar Movie Card ───────────────────────────────────────────────────────
function SimilarMovieCard({ movie }: { movie: Movie }) {
  return (
    <Link to={`/movies/${movie.guid}`}>
      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 24 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="group card-hover cursor-pointer"
      >
        <div className="relative poster-ratio rounded-xl overflow-hidden bg-muted">
          <img
            src={movie.poster ?? FALLBACK_POSTER}
            alt={movie.title ?? 'Movie poster'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement!.style.background =
                'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
            }}
          />
          {movie.rating != null && (
            <span
              className={cn(
                'absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs font-bold',
                getRatingClass(movie.rating)
              )}
            >
              {movie.rating.toFixed(1)}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="mt-2 px-1">
          <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {movie.title ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{movie.year ?? '—'}</p>
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('about')
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewForm, setReviewForm] = useState({
    title: '',
    body: '',
    rating: 7,
    review_type: 'neutral',
  })
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [trailerDialogOpen, setTrailerDialogOpen] = useState(false)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)

  const tabsRef = useRef<HTMLDivElement>(null)
  const tabsInView = useInView(tabsRef, { once: true })

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: movieData, isLoading: movieLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => apiFetch(`/v2/items/movies/${id}`),
    enabled: !!id,
  })

  const { data: castRolesData, isLoading: castLoading } = useQuery({
    queryKey: ['cast-roles', id],
    queryFn: () => apiFetch(`/v2/items/cast_roles?movies_id=${id}&limit=20`),
    enabled: !!id,
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => apiFetch(`/v2/items/reviews?movies_id=${id}&limit=20`),
    enabled: !!id,
  })

  const { data: movieGenresData } = useQuery({
    queryKey: ['movie-genres', id],
    queryFn: () => apiFetch(`/v2/items/movie_genres?movies_id=${id}`),
    enabled: !!id,
  })

  const { data: allGenresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => apiFetch('/v2/items/genres'),
  })

  const { data: allActorsData } = useQuery({
    queryKey: ['actors'],
    queryFn: () => apiFetch('/v2/items/actors'),
  })

  const { data: similarMoviesData } = useQuery({
    queryKey: ['similar-movies', id],
    queryFn: () => apiFetch('/v2/items/movies?limit=8'),
    enabled: !!id,
  })

  // ─── Mutations ────────────────────────────────────────────────────────────
  const addToWatchlistMutation = useMutation({
    mutationFn: () =>
      apiPost('/v2/items/watchlist', {
        movies_id: id,
        status: 'will_watch',
        added_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => toast.success('Добавлено в список «Буду смотреть»'),
    onError: () => toast.error('Не удалось добавить в список'),
  })

  const rateMutation = useMutation({
    mutationFn: () =>
      apiPost('/v2/items/watchlist', {
        movies_id: id,
        user_rating: ratingValue,
        status: 'watched',
      }),
    onSuccess: () => {
      toast.success(`Оценка ${ratingValue}/10 сохранена`)
      setRateDialogOpen(false)
    },
    onError: () => toast.error('Не удалось сохранить оценку'),
  })

  const submitReviewMutation = useMutation({
    mutationFn: () =>
      apiPost('/v2/items/reviews', {
        movies_id: id,
        title: reviewForm.title,
        body: reviewForm.body,
        rating: reviewForm.rating,
        review_type: reviewForm.review_type,
      }),
    onSuccess: () => {
      toast.success('Рецензия опубликована!')
      setReviewDialogOpen(false)
      setReviewForm({ title: '', body: '', rating: 7, review_type: 'neutral' })
      queryClient.invalidateQueries({ queryKey: ['reviews', id] })
    },
    onError: () => toast.error('Не удалось отправить рецензию'),
  })

  // ─── Data extraction ──────────────────────────────────────────────────────
  const movie: Movie | null = (movieData as { data?: { data?: { response?: Movie } } })?.data?.data?.response ?? null
  const castRoles: CastRole[] = extractList<CastRole>(castRolesData)
  const reviews: Review[] = extractList<Review>(reviewsData)
  const allActors: Actor[] = extractList<Actor>(allActorsData)
  const allGenres: Genre[] = extractList<Genre>(allGenresData)
  const movieGenres: MovieGenre[] = extractList<MovieGenre>(movieGenresData)
  const similarMovies: Movie[] = extractList<Movie>(similarMoviesData).filter((m) => m.guid !== id).slice(0, 8)

  // Build genre list for this movie
  const movieGenreList = movieGenres
    .map((mg) => allGenres.find((g) => g.guid === mg.genres_id))
    .filter(Boolean) as Genre[]

  // Also include genres_id direct FK if present
  const directGenre = movie?.genres_id ? allGenres.find((g) => g.guid === movie.genres_id) : null
  const allMovieGenres = [
    ...movieGenreList,
    ...(directGenre && !movieGenreList.find((g) => g.guid === directGenre.guid) ? [directGenre] : []),
  ]

  if (movieLoading) return <HeroSkeleton />

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clapperboard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Фильм не найден</h2>
          <p className="text-muted-foreground mb-6">Попробуйте вернуться в каталог</p>
          <Link to="/movies">
            <Button>К каталогу фильмов</Button>
          </Link>
        </div>
      </div>
    )
  }

  const backdropUrl = movie.backdrop ?? FALLBACK_BACKDROP
  const posterUrl = movie.poster ?? FALLBACK_POSTER

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO BANNER ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 600 }}>
        {/* Backdrop */}
        <div className="absolute inset-0">
          <img
            src={backdropUrl}
            alt={`${movie.title ?? 'Movie'} backdrop`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = FALLBACK_BACKDROP
            }}
          />
          <div className="absolute inset-0 cinematic-overlay" />
          <div className="absolute inset-0 cinematic-overlay-bottom" />
          {/* Grid texture overlay */}
          <div className="hero-texture absolute inset-0 pointer-events-none z-10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 pt-28 pb-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="shrink-0"
            >
              <div className="w-52 md:w-64 poster-ratio rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl glow-primary">
                <img
                  src={posterUrl}
                  alt={`${movie.title ?? 'Movie'} poster`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = FALLBACK_POSTER
                  }}
                />
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
              className="flex-1 flex flex-col gap-4"
            >
              {/* Title */}
              <div>
                <h1
                  className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {movie.title ?? '—'}
                </h1>
                {movie.original_title && (
                  <p className="text-lg text-muted-foreground mt-1 font-light">
                    {movie.original_title}
                  </p>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {movie.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {movie.year}
                  </span>
                )}
                {movie.duration_min && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(movie.duration_min)}
                  </span>
                )}
                {movie.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {movie.country}
                  </span>
                )}
                {movie.age_rating && (
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {movie.age_rating}+
                  </span>
                )}
                {movie.content_type && (
                  <Badge variant="secondary" className="text-xs">
                    {movie.content_type}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <RatingCircle rating={movie.rating} size="lg" />
                <div>
                  <p className="text-foreground font-semibold text-lg">
                    {movie.rating?.toFixed(1) ?? '—'}
                    <span className="text-muted-foreground text-sm font-normal"> / 10</span>
                  </p>
                  {movie.votes_count != null && (
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat('ru-RU').format(movie.votes_count)} оценок
                    </p>
                  )}
                </div>
              </div>

              {/* Genres */}
              {allMovieGenres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allMovieGenres.map((g) => (
                    <Link key={g.guid} to={`/movies?genre=${g.slug_name ?? ''}`}>
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors"
                      >
                        {g.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Description preview */}
              {movie.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 max-w-2xl">
                  {movie.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-2">
                {/* Watchlist */}
                <Button
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                  onClick={() => addToWatchlistMutation.mutate()}
                  disabled={addToWatchlistMutation.isPending}
                >
                  <Bookmark className="w-4 h-4" />
                  Буду смотреть
                </Button>

                {/* Rate */}
                <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="gap-2">
                      <Star className="w-4 h-4" />
                      Оценить
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Оценить фильм</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-sm">
                        Выберите оценку от 1 до 10
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex flex-col gap-4">
                      <StarRatingSelector value={ratingValue} onChange={setRatingValue} />
                      {ratingValue > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Ваша оценка:{' '}
                          <span className="text-primary font-bold">{ratingValue}/10</span>
                        </p>
                      )}
                      <Button
                        onClick={() => rateMutation.mutate()}
                        disabled={ratingValue === 0 || rateMutation.isPending}
                        className="w-full"
                      >
                        {rateMutation.isPending ? 'Сохранение...' : 'Сохранить оценку'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Trailer */}
                {movie.trailer_url && (
                  <Dialog open={trailerDialogOpen} onOpenChange={setTrailerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-border hover:border-primary/40">
                        <Play className="w-4 h-4" />
                        Трейлер
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Трейлер — {movie.title ?? 'Фильм'}</DialogTitle>
                        <DialogDescription className="sr-only">Просмотр трейлера фильма</DialogDescription>
                      </DialogHeader>
                      <div className="relative w-full backdrop-ratio rounded-xl overflow-hidden bg-black">
                        <iframe
                          src={movie.trailer_url}
                          title="Trailer"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                      <a
                        href={movie.trailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Открыть на внешнем сайте
                      </a>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TABS SECTION ──────────────────────────────────────────────────── */}
      <section
        ref={tabsRef}
        className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={tabsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab list */}
            <TabsList className="flex flex-wrap gap-1 h-auto bg-card border border-border p-1 rounded-xl mb-8 w-full md:w-auto">
              {[
                { value: 'about', label: 'О фильме' },
                { value: 'cast', label: 'Актёры' },
                { value: 'reviews', label: `Рецензии${reviews.length > 0 ? ` (${reviews.length})` : ''}` },
                { value: 'similar', label: 'Похожие' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 md:flex-none text-sm data-[state=active]:text-primary data-[state=active]:bg-primary/10"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab: О фильме ──────────────────────────────────────────── */}
            <TabsContent value="about">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Description */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div>
                    <h2
                      className="text-xl font-bold text-foreground mb-3"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Описание
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {movie.description || 'Описание отсутствует.'}
                    </p>
                  </div>

                  {/* Backdrop image */}
                  <div className="backdrop-ratio rounded-xl overflow-hidden">
                    <img
                      src={
                        movie.backdrop ??
                        'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80'
                      }
                      alt="Movie scene"
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.style.background =
                          'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                      }}
                    />
                  </div>
                </div>

                {/* Info table */}
                <div className="glass rounded-xl p-6">
                  <h3
                    className="text-sm font-bold text-foreground uppercase tracking-wider mb-4"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Детали
                  </h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Год', value: movie.year?.toString() },
                      { label: 'Страна', value: movie.country },
                      { label: 'Продолжительность', value: formatDuration(movie.duration_min) },
                      { label: 'Возрастной рейтинг', value: movie.age_rating ? `${movie.age_rating}+` : undefined },
                      { label: 'Тип', value: movie.content_type },
                      {
                        label: 'Жанры',
                        value: allMovieGenres.length > 0
                          ? allMovieGenres.map((g) => g.name ?? '—').join(', ')
                          : undefined,
                      },
                    ].map((row) =>
                      row.value ? (
                        <div key={row.label}>
                          <div className="flex justify-between gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
                            <span className="text-xs text-foreground text-right">{row.value}</span>
                          </div>
                          <Separator className="mt-3" />
                        </div>
                      ) : null
                    )}

                    {/* Rating in detail */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <RatingCircle rating={movie.rating} size="lg" />
                      {movie.votes_count != null && (
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('ru-RU').format(movie.votes_count)} оценок
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* ── Tab: Актёры ─────────────────────────────────────────────── */}
            <TabsContent value="cast">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {castLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-28">
                        <Skeleton className="w-20 h-20 rounded-full" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : castRoles.length === 0 ? (
                  <div className="text-center py-16">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Информация об актёрах отсутствует</p>
                  </div>
                ) : (
                  <div className="scroll-row flex gap-6 pb-4">
                    {castRoles
                      .sort((a, b) => (a.billing_order ?? 99) - (b.billing_order ?? 99))
                      .map((role, idx) => {
                        const actor = allActors.find((a) => a.guid === role.actors_id)
                        const fallbackPhoto = ACTOR_FALLBACKS[idx % ACTOR_FALLBACKS.length]
                        return (
                          <motion.div
                            key={role.guid}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.05 }}
                            className="shrink-0 w-32 flex flex-col items-center gap-2 group"
                          >
                            <Link to={actor ? `/actors/${actor.guid}` : '#'} className="relative">
                              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300">
                                <img
                                  src={actor?.photo ?? fallbackPhoto}
                                  alt={actor?.name ?? 'Actor'}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.parentElement!.style.background =
                                      'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                                  }}
                                />
                              </div>
                            </Link>
                            <div className="text-center">
                              <p className="text-xs font-semibold text-foreground line-clamp-2">
                                {actor?.name ?? '—'}
                              </p>
                              {role.role_name && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {role.role_name}
                                </p>
                              )}
                              {role.role_type && (
                                <Badge variant="outline" className="text-xs mt-1 scale-90">
                                  {role.role_type}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* ── Tab: Рецензии ────────────────────────────────────────────── */}
            <TabsContent value="reviews">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col gap-6"
              >
                {/* Submit review button */}
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-bold text-foreground"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {reviews.length > 0 ? `${reviews.length} рецензий` : 'Рецензии'}
                  </h3>
                  <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Star className="w-4 h-4" />
                        Написать рецензию
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Написать рецензию</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                          Поделитесь впечатлениями о фильме
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-2">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Заголовок</label>
                          <input
                            type="text"
                            className="input-dark"
                            placeholder="Краткое впечатление о фильме"
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Оценка: {reviewForm.rating}/10
                          </label>
                          <StarRatingSelector
                            value={reviewForm.rating}
                            onChange={(v) => setReviewForm((p) => ({ ...p, rating: v }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Тип рецензии</label>
                          <div className="flex gap-2">
                            {[
                              { value: 'positive', label: 'Позитивная', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
                              { value: 'neutral', label: 'Нейтральная', color: 'text-muted-foreground border-border' },
                              { value: 'negative', label: 'Негативная', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setReviewForm((p) => ({ ...p, review_type: opt.value }))}
                                className={cn(
                                  'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                                  reviewForm.review_type === opt.value
                                    ? opt.color
                                    : 'border-border text-muted-foreground hover:bg-muted'
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Текст рецензии</label>
                          <textarea
                            rows={5}
                            className="input-dark resize-none"
                            placeholder="Расскажите подробнее о своих впечатлениях..."
                            value={reviewForm.body}
                            onChange={(e) => setReviewForm((p) => ({ ...p, body: e.target.value }))}
                          />
                        </div>
                        <Button
                          onClick={() => submitReviewMutation.mutate()}
                          disabled={
                            !reviewForm.title.trim() ||
                            !reviewForm.body.trim() ||
                            submitReviewMutation.isPending
                          }
                          className="w-full"
                        >
                          {submitReviewMutation.isPending ? 'Публикация...' : 'Опубликовать рецензию'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {reviewsLoading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-16 glass rounded-xl">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">Рецензий пока нет</p>
                    <p className="text-xs text-muted-foreground">Станьте первым, кто напишет рецензию!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.guid} review={review} />
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* ── Tab: Похожие ─────────────────────────────────────────────── */}
            <TabsContent value="similar">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {similarMovies.length === 0 ? (
                  <div className="text-center py-16">
                    <Clapperboard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Похожие фильмы не найдены</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {similarMovies.map((m, idx) => (
                      <motion.div
                        key={m.guid}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.06 }}
                      >
                        <SimilarMovieCard movie={m} />
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-8 text-center">
                  <Link to="/movies">
                    <Button variant="outline" className="gap-2 border-border hover:border-primary/40">
                      Смотреть все фильмы
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </section>
    </div>
  )
}
