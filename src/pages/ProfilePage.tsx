import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Star,
  BookmarkPlus,
  FileText,
  FolderOpen,
  Edit3,
  Camera,
  Heart,
  ThumbsDown,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  Globe,
  Plus,
  Film,
  Calendar,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL as string
const API_KEY  = import.meta.env.VITE_X_API_KEY  as string

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': 'API-KEY', 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

function extractList<T>(data: unknown): T[] {
  if (!data) return []
  const d = data as Record<string, unknown>
  const resp = d?.data
  if (!resp) return []
  const r = resp as Record<string, unknown>
  const list = Array.isArray(r.response)
    ? r.response
    : Array.isArray((r.data as Record<string, unknown> | undefined)?.response)
    ? (r.data as Record<string, unknown>).response
    : null
  if (Array.isArray(list)) return list as T[]
  if (Array.isArray(resp)) return resp as T[]
  return []
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface UserRow {
  guid: string
  login?: string
  email?: string
  full_name?: string
  avatar?: string
  bio?: string
  favorite_genre?: string
}

interface MovieRow {
  guid: string
  title?: string
  poster?: string
  year?: number
  rating?: number
  content_type?: string
}

interface ReviewRow {
  guid: string
  title?: string
  body?: string
  rating?: number
  review_type?: string
  likes_count?: number
  dislikes_count?: number
  movies_id?: string
  users_id?: string
}

interface WatchlistRow {
  guid: string
  status?: string
  user_rating?: number
  notes?: string
  added_date?: string
  movies_id?: string
  users_id?: string
}

interface CollectionRow {
  guid: string
  name?: string
  description?: string
  cover_image?: string
  is_public?: boolean
  users_id?: string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDate = (d?: string) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getRatingClass = (r?: number) => {
  if (!r) return 'rating-none'
  if (r >= 7) return 'rating-high'
  if (r >= 5) return 'rating-mid'
  return 'rating-low'
}

const getReviewTypeLabel = (t?: string) => {
  if (!t) return { label: 'Нейтральная', color: 'text-muted-foreground', bg: 'bg-muted' }
  const lc = t.toLowerCase()
  if (lc.includes('pos') || lc.includes('полож')) return { label: 'Положительная', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
  if (lc.includes('neg') || lc.includes('отриц')) return { label: 'Отрицательная', color: 'text-accent', bg: 'bg-accent/10' }
  return { label: 'Нейтральная', color: 'text-muted-foreground', bg: 'bg-muted' }
}

const getStatusMeta = (status?: string) => {
  const s = (status ?? '').toLowerCase()
  if (s.includes('watch') && s.includes('ing')) return { label: 'Смотрю', icon: Eye, color: 'text-primary' }
  if (s.includes('will') || s.includes('хочу') || s.includes('буду')) return { label: 'Буду смотреть', icon: BookmarkPlus, color: 'text-blue-400' }
  if (s.includes('watched') || s.includes('просмотр')) return { label: 'Просмотрено', icon: CheckCircle, color: 'text-emerald-400' }
  if (s.includes('drop') || s.includes('брос')) return { label: 'Брошено', icon: XCircle, color: 'text-accent' }
  return { label: status ?? '—', icon: Clock, color: 'text-muted-foreground' }
}

const DEMO_USER: UserRow = {
  guid: 'demo',
  login: 'cinephile_user',
  email: 'user@kinoportal.ru',
  full_name: 'Алексей Кинолюбов',
  bio: 'Заядлый киноман с 15-летним стажем. Люблю авторское кино, нуар и научную фантастику. Пишу рецензии на всё, что смотрю.',
  favorite_genre: 'Sci-Fi / Нуар',
  avatar: '',
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        <Skeleton className="w-32 h-32 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <div className="flex gap-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-full poster-ratio rounded-lg" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MOVIE POSTER CARD ────────────────────────────────────────────────────────
interface MovieCardProps {
  movie: MovieRow
  userRating?: number
  showRating?: boolean
}

function MoviePosterCard({ movie, userRating, showRating = false }: MovieCardProps) {
  const rating = showRating ? (userRating ?? movie.rating) : movie.rating
  return (
    <Link to={`/movies/${movie.guid}`}>
      <div className="group relative rounded-lg overflow-hidden bg-card card-hover cursor-pointer">
        <div className="poster-ratio relative">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title ?? 'Фильм'}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))' }}>
              <Film className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          {/* Rating badge */}
          {rating != null && (
            <span className={cn('absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded', getRatingClass(rating))}>
              {rating.toFixed(1)}
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-2">
            <span className="text-foreground text-xs font-semibold text-center line-clamp-3">{movie.title ?? '—'}</span>
            <span className="text-muted-foreground text-xs">{movie.year ?? '—'}</span>
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs text-foreground font-medium line-clamp-2">{movie.title ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{movie.year ?? '—'}</p>
        </div>
      </div>
    </Link>
  )
}

// ─── WATCHLIST STATUS TABS ────────────────────────────────────────────────────
const WATCHLIST_STATUSES = [
  { key: 'all', label: 'Все' },
  { key: 'watching', label: 'Смотрю' },
  { key: 'will', label: 'Буду смотреть' },
  { key: 'watched', label: 'Просмотрено' },
  { key: 'dropped', label: 'Брошено' },
]

function matchStatus(status: string | undefined, key: string) {
  if (key === 'all') return true
  const s = (status ?? '').toLowerCase()
  if (key === 'watching') return s.includes('ing') && !s.includes('watched')
  if (key === 'will') return s.includes('will') || s.includes('хочу') || s.includes('буду') || s === 'plan'
  if (key === 'watched') return s === 'watched' || s.includes('просмотр') || s === 'completed'
  if (key === 'dropped') return s.includes('drop') || s.includes('брос')
  return s.includes(key)
}

// ─── EDIT PROFILE DIALOG ─────────────────────────────────────────────────────
function EditProfileDialog({ user }: { user: UserRow }) {
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [genre, setGenre] = useState(user.favorite_genre ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${API_BASE}/v2/items/users/${user.guid}`, {
        method: 'PUT',
        headers: { 'Authorization': 'API-KEY', 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, bio, favorite_genre: genre }),
      })
    } catch {}
    setSaving(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:text-foreground">
          <Edit3 className="w-4 h-4" />
          Редактировать
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">Полное имя</label>
            <input
              className="input-dark"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">О себе</label>
            <textarea
              className="input-dark min-h-[100px] resize-none"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">Любимый жанр</label>
            <input
              className="input-dark"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder="Например: Sci-Fi, Нуар"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm">Отмена</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })

  // Fetch current user (use first user as demo)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['profile-users'],
    queryFn: () => apiFetch('/v2/items/users?limit=1'),
  })
  const users = extractList<UserRow>(usersData)
  const user: UserRow = users[0] ?? DEMO_USER

  // Fetch movies for lookups
  const { data: moviesData } = useQuery({
    queryKey: ['profile-movies'],
    queryFn: () => apiFetch('/v2/items/movies?limit=50'),
  })
  const movies = extractList<MovieRow>(moviesData)
  const movieMap = Object.fromEntries(movies.map(m => [m.guid, m]))

  // Fetch reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['profile-reviews'],
    queryFn: () => apiFetch('/v2/items/reviews?limit=50'),
  })
  const reviews = extractList<ReviewRow>(reviewsData)

  // Fetch watchlist
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ['profile-watchlist'],
    queryFn: () => apiFetch('/v2/items/watchlist?limit=100'),
  })
  const watchlist = extractList<WatchlistRow>(watchlistData)

  // Fetch collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ['profile-collections'],
    queryFn: () => apiFetch('/v2/items/collections?limit=50'),
  })
  const collections = extractList<CollectionRow>(collectionsData)

  const [wlStatusFilter, setWlStatusFilter] = useState('all')
  const filteredWatchlist = watchlist.filter(w => matchStatus(w.status, wlStatusFilter))

  const statsLoading = usersLoading || reviewsLoading || watchlistLoading

  const ratedWatchlist = watchlist.filter(w => w.user_rating != null && w.user_rating > 0)

  if (usersLoading) return <ProfileSkeleton />

  const userInitials = (user.full_name ?? user.login ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* ── PROFILE HERO ─────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="relative pt-16 overflow-hidden"
      >
        {/* Background cinematic image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80"
            alt="Cinematic background"
            loading="lazy"
            className="w-full h-full object-cover opacity-20"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsl(var(--background)/0.7) 0%, hsl(var(--background)) 100%)' }} />
        </div>

        {/* Hero grid texture */}
        <div className="hero-texture absolute inset-0 z-1 pointer-events-none" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col md:flex-row gap-8 items-start md:items-center"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-full ring-4 ring-primary/40 overflow-hidden bg-muted flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.full_name ?? 'Avatar'}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <span
                    className="text-3xl font-bold text-primary"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {userInitials}
                  </span>
                )}
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {user.full_name ?? user.login ?? 'Пользователь'}
                </h1>
                {user.favorite_genre && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {user.favorite_genre}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-1">@{user.login ?? 'user'}</p>
              {user.bio && (
                <p className="text-foreground/80 text-sm leading-relaxed max-w-xl mt-3 mb-4">
                  {user.bio}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 my-4">
                {[
                  { label: 'Рецензии', value: statsLoading ? '—' : String(reviews.length), icon: FileText, color: 'text-primary' },
                  { label: 'Буду смотреть', value: statsLoading ? '—' : String(watchlist.length), icon: BookmarkPlus, color: 'text-blue-400' },
                  { label: 'Оценено', value: statsLoading ? '—' : String(ratedWatchlist.length), icon: Star, color: 'text-amber-400' },
                  { label: 'Коллекции', value: collectionsLoading ? '—' : String(collections.length), icon: FolderOpen, color: 'text-purple-400' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-0.5">
                    <s.icon className={cn('w-5 h-5', s.color)} />
                    <span
                      className="text-2xl font-bold text-foreground"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {s.value}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <EditProfileDialog user={user} />
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Camera className="w-4 h-4" />
                  Фото
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── TABS SECTION ─────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
        <Tabs defaultValue="ratings">
          {/* Tab list */}
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md py-3 border-b border-border mb-8">
            <TabsList className="bg-card/60 border border-border h-auto p-1 flex-wrap gap-1 w-full sm:w-auto">
              <TabsTrigger
                value="ratings"
                className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Мои оценки</span>
                <span className="sm:hidden">Оценки</span>
              </TabsTrigger>
              <TabsTrigger
                value="watchlist"
                className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Буду смотреть</span>
                <span className="sm:hidden">Список</span>
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Мои рецензии</span>
                <span className="sm:hidden">Рецензии</span>
              </TabsTrigger>
              <TabsTrigger
                value="collections"
                className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Коллекции</span>
                <span className="sm:hidden">Подборки</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── TAB 1: RATINGS ────────────────────────────────────────────── */}
          <TabsContent value="ratings">
            <RatingsTab watchlist={ratedWatchlist} movieMap={movieMap} moviesLoading={watchlistLoading} />
          </TabsContent>

          {/* ── TAB 2: WATCHLIST ──────────────────────────────────────────── */}
          <TabsContent value="watchlist">
            <WatchlistTab
              watchlist={filteredWatchlist}
              allWatchlist={watchlist}
              movieMap={movieMap}
              statusFilter={wlStatusFilter}
              setStatusFilter={setWlStatusFilter}
              isLoading={watchlistLoading}
            />
          </TabsContent>

          {/* ── TAB 3: REVIEWS ────────────────────────────────────────────── */}
          <TabsContent value="reviews">
            <ReviewsTab reviews={reviews} movieMap={movieMap} isLoading={reviewsLoading} />
          </TabsContent>

          {/* ── TAB 4: COLLECTIONS ────────────────────────────────────────── */}
          <TabsContent value="collections">
            <CollectionsTab collections={collections} movieMap={movieMap} isLoading={collectionsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── RATINGS TAB ──────────────────────────────────────────────────────────────
function RatingsTab({
  watchlist,
  movieMap,
  moviesLoading,
}: {
  watchlist: WatchlistRow[]
  movieMap: Record<string, MovieRow>
  moviesLoading: boolean
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true })

  if (moviesLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-full poster-ratio rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (watchlist.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Нет оценок"
        description="Оцените просмотренные фильмы, чтобы они появились здесь"
        actionLabel="Перейти к каталогу"
        actionHref="/movies"
      />
    )
  }

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Мои оценки
          <span className="ml-2 text-sm font-normal text-muted-foreground">({watchlist.length})</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {watchlist.map((w, i) => {
          const movie = movieMap[w.movies_id ?? ''] ?? null
          if (!movie) return null
          return (
            <motion.div
              key={w.guid}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5), ease: 'easeOut' }}
            >
              <div className="relative">
                <MoviePosterCard movie={movie} userRating={w.user_rating} showRating />
                {/* User rating badge overlay */}
                {w.user_rating != null && (
                  <div className="absolute bottom-8 left-2">
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold', getRatingClass(w.user_rating))}>
                      <Star className="w-3 h-3" fill="currentColor" />
                      {w.user_rating}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── WATCHLIST TAB ────────────────────────────────────────────────────────────
function WatchlistTab({
  watchlist,
  allWatchlist,
  movieMap,
  statusFilter,
  setStatusFilter,
  isLoading,
}: {
  watchlist: WatchlistRow[]
  allWatchlist: WatchlistRow[]
  movieMap: Record<string, MovieRow>
  statusFilter: string
  setStatusFilter: (s: string) => void
  isLoading: boolean
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true })

  const countForStatus = (key: string) =>
    key === 'all' ? allWatchlist.length : allWatchlist.filter(w => matchStatus(w.status, key)).length

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-16 h-24 rounded shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {WATCHLIST_STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
              statusFilter === s.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
            )}
          >
            {s.label}
            <span className="ml-1.5 opacity-60">{countForStatus(s.key)}</span>
          </button>
        ))}
      </div>

      {watchlist.length === 0 ? (
        <EmptyState
          icon={BookmarkPlus}
          title="Список пуст"
          description="Добавляйте фильмы в список, чтобы не потерять их"
          actionLabel="Найти фильмы"
          actionHref="/movies"
        />
      ) : (
        <div className="space-y-3">
          {watchlist.map((w, i) => {
            const movie = movieMap[w.movies_id ?? ''] ?? null
            const statusMeta = getStatusMeta(w.status)
            const StatusIcon = statusMeta.icon
            return (
              <motion.div
                key={w.guid}
                initial={{ opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: 'easeOut' }}
              >
                <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Poster */}
                      <div className="w-16 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                        {movie?.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie?.title ?? 'Movie'}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))' }}>
                            <Film className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              to={movie ? `/movies/${movie.guid}` : '#'}
                              className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {movie?.title ?? 'Неизвестный фильм'}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {movie?.year ?? '—'}
                              {movie?.content_type && ` · ${movie.content_type}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Status badge */}
                            <span className={cn('flex items-center gap-1 text-xs font-medium', statusMeta.color)}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">{statusMeta.label}</span>
                            </span>
                            {/* User rating */}
                            {w.user_rating != null && w.user_rating > 0 && (
                              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', getRatingClass(w.user_rating))}>
                                {w.user_rating}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        {w.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted/30 rounded p-2">
                            {w.notes}
                          </p>
                        )}

                        {/* Added date */}
                        {w.added_date && (
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Добавлено: {formatDate(w.added_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── REVIEWS TAB ──────────────────────────────────────────────────────────────
function ReviewsTab({
  reviews,
  movieMap,
  isLoading,
}: {
  reviews: ReviewRow[]
  movieMap: Record<string, MovieRow>
  isLoading: boolean
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true })
  const [expandedGuids, setExpandedGuids] = useState<Set<string>>(new Set())

  const toggleExpanded = (guid: string) => {
    setExpandedGuids(prev => {
      const next = new Set(prev)
      if (next.has(guid)) next.delete(guid)
      else next.add(guid)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Нет рецензий"
        description="Поделитесь своим мнением о просмотренных фильмах"
        actionLabel="Перейти к фильмам"
        actionHref="/movies"
      />
    )
  }

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Мои рецензии
          <span className="ml-2 text-sm font-normal text-muted-foreground">({reviews.length})</span>
        </h2>
      </div>
      <div className="space-y-4">
        {reviews.map((review, i) => {
          const movie = movieMap[review.movies_id ?? ''] ?? null
          const typeMeta = getReviewTypeLabel(review.review_type)
          const isExpanded = expandedGuids.has(review.guid)
          const bodyText = review.body ?? ''
          const needsExpand = bodyText.length > 300

          return (
            <motion.div
              key={review.guid}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.5), ease: 'easeOut' }}
            >
              <Card className="bg-card border-border hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-5">
                  {/* Movie ref */}
                  {movie && (
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                      <div className="w-10 h-14 rounded overflow-hidden bg-muted shrink-0">
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title ?? 'Movie'}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))' }}>
                            <Film className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/movies/${movie.guid}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {movie.title ?? '—'}
                        </Link>
                        <p className="text-xs text-muted-foreground">{movie.year ?? '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* Review header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {review.title ?? 'Рецензия'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Type badge */}
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeMeta.bg, typeMeta.color)}>
                        {typeMeta.label}
                      </span>
                      {/* Rating */}
                      {review.rating != null && (
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded', getRatingClass(review.rating))}>
                          {review.rating}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  {bodyText && (
                    <p className={cn('text-sm text-foreground/80 leading-relaxed', !isExpanded && needsExpand && 'line-clamp-4')}>
                      {bodyText}
                    </p>
                  )}
                  {needsExpand && (
                    <button
                      onClick={() => toggleExpanded(review.guid)}
                      className="text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
                    >
                      {isExpanded ? 'Свернуть' : 'Читать полностью'}
                    </button>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{review.likes_count ?? 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{review.dislikes_count ?? 0}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── COLLECTIONS TAB ──────────────────────────────────────────────────────────
function CollectionsTab({
  collections,
  movieMap,
  isLoading,
}: {
  collections: CollectionRow[]
  movieMap: Record<string, MovieRow>
  isLoading: boolean
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true })

  const FALLBACK_COVERS = [
    'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Нет коллекций"
        description="Создайте свою первую коллекцию фильмов"
        actionLabel="Перейти к подборкам"
        actionHref="/collections"
      />
    )
  }

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Мои коллекции
          <span className="ml-2 text-sm font-normal text-muted-foreground">({collections.length})</span>
        </h2>
        <Button size="sm" variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" />
          Создать
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col, i) => {
          const coverImg = col.cover_image ?? FALLBACK_COVERS[i % FALLBACK_COVERS.length]
          return (
            <motion.div
              key={col.guid}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: Math.min(i * 0.07, 0.5), ease: 'easeOut' }}
            >
              <Link to="/collections">
                <Card className="group overflow-hidden bg-card border-border hover:border-primary/30 card-hover cursor-pointer">
                  {/* Cover image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={col.name ?? 'Collection'}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                        }
                      }}
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 cinematic-overlay-bottom" />
                    {/* Public/Private badge */}
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background/70 text-muted-foreground backdrop-blur-sm">
                        {col.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {col.is_public ? 'Публичная' : 'Личная'}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3
                      className="font-bold text-foreground text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {col.name ?? 'Без названия'}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {col.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        Фильмы
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ElementType
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">{description}</p>
      <Link to={actionHref}>
        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 gap-2">
          {actionLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  )
}
