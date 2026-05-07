import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Ruler,
  ChevronDown,
  ChevronUp,
  Star,
  Film,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

const headers = {
  'Authorization': 'API-KEY',
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function calcAge(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const birth = new Date(dateStr)
    const now = new Date()
    const age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    const adjusted = m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? age - 1 : age
    return `${adjusted} лет`
  } catch {
    return ''
  }
}

function getRatingClass(r: number | null | undefined): string {
  if (!r) return 'rating-none'
  if (r >= 7) return 'rating-high'
  if (r >= 5) return 'rating-mid'
  return 'rating-low'
}

interface Actor {
  guid: string
  name: string
  original_name?: string
  photo?: string
  birth_date?: string
  birth_place?: string
  biography?: string
  height_cm?: number
}

interface CastRole {
  guid: string
  role_name?: string
  role_type?: string
  billing_order?: number
  movies_id?: string
}

interface Movie {
  guid: string
  title: string
  original_title?: string
  poster?: string
  year?: number
  rating?: number
  duration_min?: number
  content_type?: string
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=400&h=300&fit=crop&auto=format&q=80',
]

const HERO_BG = 'https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80'

async function fetchActor(id: string): Promise<Actor | null> {
  try {
    const res = await fetch(`${API_BASE}/v2/items/actors/${id}`, { headers })
    const json = await res.json()
    return json?.data?.data?.response ?? null
  } catch {
    return null
  }
}

async function fetchCastRoles(actorId: string): Promise<CastRole[]> {
  try {
    const res = await fetch(
      `${API_BASE}/v2/items/cast_roles?actors_id=${actorId}&limit=50`,
      { headers }
    )
    const json = await res.json()
    const rows = json?.data?.data?.response ?? []
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

async function fetchMoviesByIds(ids: string[]): Promise<Movie[]> {
  if (!ids.length) return []
  try {
    const res = await fetch(`${API_BASE}/v2/items/movies?limit=100`, { headers })
    const json = await res.json()
    const all: Movie[] = Array.isArray(json?.data?.data?.response) ? json.data.data.response : []
    const idSet = new Set(ids)
    return all.filter((m) => idSet.has(m.guid))
  } catch {
    return []
  }
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function ActorDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 md:h-80 w-full">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-48 h-64 md:w-64 md:h-80 rounded-xl shrink-0" />
          <div className="flex-1 pt-4 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="mt-12 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Filmography Item ────────────────────────────────────────────────────────
interface FilmoItemProps {
  movie: Movie
  role: CastRole
  index: number
}

function FilmoItem({ movie, role, index }: FilmoItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const posterFallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut', delay: Math.min(index * 0.07, 0.4) }}
    >
      <Link to={`/movies/${movie.guid}`}>
        <div
          className={cn(
            'flex gap-4 p-4 rounded-xl border border-border bg-card',
            'hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group card-hover'
          )}
        >
          {/* Year indicator */}
          <div className="hidden sm:flex flex-col items-center justify-center w-14 shrink-0">
            <span
              className="text-lg font-bold text-primary tabular-nums"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {movie.year ?? '—'}
            </span>
            <div className="w-px flex-1 bg-border mt-2" />
          </div>

          {/* Poster */}
          <div className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden">
            <img
              src={movie.poster ?? posterFallback}
              alt={movie.title ?? 'Movie poster'}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = posterFallback
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-1">
            <h3
              className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {movie.title ?? '—'}
            </h3>
            {movie.original_title && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {movie.original_title}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {role.role_name && (
                <Badge variant="secondary" className="text-xs">
                  {role.role_name}
                </Badge>
              )}
              {role.role_type && role.role_type !== role.role_name && (
                <Badge variant="outline" className="text-xs capitalize">
                  {role.role_type}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground sm:hidden">
                {movie.year ?? '—'}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="shrink-0 flex flex-col items-end justify-center gap-2">
            {movie.rating != null && (
              <span
                className={cn(
                  'text-xs font-bold px-2 py-1 rounded-full',
                  getRatingClass(movie.rating)
                )}
              >
                {movie.rating.toFixed(1)}
              </span>
            )}
            {movie.content_type && (
              <span className="text-xs text-muted-foreground hidden md:block">
                {movie.content_type}
              </span>
            )}
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ActorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [actor, setActor] = useState<Actor | null>(null)
  const [castRoles, setCastRoles] = useState<CastRole[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [bioExpanded, setBioExpanded] = useState(false)

  const filmoRef = useRef<HTMLDivElement>(null)
  const filmoInView = useInView(filmoRef, { once: true })

  useEffect(() => {
    if (!id) return
    setLoading(true)

    fetchActor(id).then(async (a) => {
      setActor(a)
      if (a) {
        const roles = await fetchCastRoles(a.guid)
        setCastRoles(roles)
        const movieIds = roles
          .map((r) => r.movies_id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
        if (movieIds.length) {
          const movs = await fetchMoviesByIds(movieIds)
          setMovies(movs)
        }
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return <ActorDetailSkeleton />

  if (!actor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Актёр не найден
          </h2>
          <p className="text-muted-foreground mb-6">Запрошенный актёр не существует или был удалён.</p>
          <Link to="/movies">
            <Button variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              В каталог
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Build filmography: join cast_roles with movies, sort by year desc
  const filmography = castRoles
    .map((role) => {
      const movie = movies.find((m) => m.guid === role.movies_id)
      return movie ? { role, movie } : null
    })
    .filter((v): v is { role: CastRole; movie: Movie } => v !== null)
    .sort((a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0))

  const bioText = actor.biography ?? ''
  const bioShort = bioText.slice(0, 500)
  const hasBioMore = bioText.length > 500

  const photoSrc = actor.photo
    ?? 'https://images.unsplash.com/photo-1516028529332-04b428b43a06?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80'

  const initials = (actor.name ?? 'A')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        <img
          src={HERO_BG}
          alt="Cinematic background"
          loading="lazy"
          className="w-full h-full object-cover scale-110"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.style.background =
              'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        {/* Grid texture overlay */}
        <div className="hero-texture absolute inset-0 pointer-events-none" />

        {/* Back button */}
        <div className="absolute top-20 left-4 sm:left-6 z-20">
          <Link to="/movies">
            <Button variant="ghost" size="sm" className="glass text-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Назад
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Profile Card ────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-32 md:-mt-48 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col md:flex-row gap-6 md:gap-10"
        >
          {/* Photo */}
          <div className="shrink-0 flex justify-center md:justify-start">
            <div
              className={cn(
                'relative w-44 h-60 md:w-56 md:h-72 rounded-xl overflow-hidden',
                'border-2 border-border shadow-2xl glow-primary'
              )}
            >
              <img
                src={photoSrc}
                alt={actor.name ?? 'Actor photo'}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.style.display = 'none'
                  const parent = e.currentTarget.parentElement!
                  parent.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                  parent.style.display = 'flex'
                  parent.style.alignItems = 'center'
                  parent.style.justifyContent = 'center'
                  const span = document.createElement('span')
                  span.style.fontFamily = 'var(--font-heading)'
                  span.style.fontSize = '3rem'
                  span.style.fontWeight = '800'
                  span.style.color = 'hsl(var(--muted-foreground))'
                  span.textContent = initials
                  parent.appendChild(span)
                }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 mt-2 md:mt-8">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            >
              <h1
                className="text-3xl md:text-5xl font-bold text-foreground leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {actor.name ?? '—'}
              </h1>
              {actor.original_name && (
                <p className="text-muted-foreground text-lg mt-1">
                  {actor.original_name}
                </p>
              )}

              {/* Meta badges */}
              <div className="flex flex-wrap gap-3 mt-5">
                {actor.birth_date && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">
                      {formatDate(actor.birth_date)}
                    </span>
                    {calcAge(actor.birth_date) && (
                      <span className="text-muted-foreground">· {calcAge(actor.birth_date)}</span>
                    )}
                  </div>
                )}
                {actor.birth_place && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{actor.birth_place}</span>
                  </div>
                )}
                {actor.height_cm != null && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm">
                    <Ruler className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{actor.height_cm} см</span>
                  </div>
                )}
                {filmography.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm">
                    <Film className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{filmography.length} фильмов</span>
                  </div>
                )}
              </div>

              {/* Biography */}
              {bioText && (
                <div className="mt-6">
                  <h2
                    className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Биография
                  </h2>
                  <div
                    className={cn(
                      'text-sm text-muted-foreground leading-relaxed',
                      !bioExpanded && 'line-clamp-4'
                    )}
                  >
                    {bioExpanded ? bioText : (hasBioMore ? bioShort + '…' : bioText)}
                  </div>
                  {hasBioMore && (
                    <button
                      onClick={() => setBioExpanded((v) => !v)}
                      className="flex items-center gap-1 mt-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      {bioExpanded ? (
                        <><ChevronUp className="w-4 h-4" /> Свернуть</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Читать полностью</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        <Separator className="mt-12 mb-8" />

        {/* ── Filmography ─────────────────────────────────────── */}
        <div ref={filmoRef}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={filmoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-1 h-8 rounded-full bg-primary" />
            <h2
              className="text-2xl md:text-3xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Фильмография
            </h2>
            {filmography.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filmography.length}
              </Badge>
            )}
          </motion.div>

          {filmography.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={filmoInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Film className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">
                Фильмография пока не заполнена
              </p>
              <p className="text-muted-foreground/60 text-sm mt-2">
                Роли этого актёра ещё не добавлены в базу данных
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3 pb-16">
              {filmography.map(({ role, movie }, index) => (
                <FilmoItem
                  key={role.guid}
                  movie={movie}
                  role={role}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Stats Section ────────────────────────────────────── */}
        {filmography.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-16"
          >
            <Separator className="mb-8" />
            <h2
              className="text-xl font-bold text-foreground mb-6"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Статистика
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Всего работ',
                  value: filmography.length,
                  icon: Film,
                },
                {
                  label: 'Средний рейтинг',
                  value:
                    filmography.filter((f) => f.movie.rating).length > 0
                      ? (
                          filmography.reduce((acc, f) => acc + (f.movie.rating ?? 0), 0) /
                          filmography.filter((f) => f.movie.rating).length
                        ).toFixed(1)
                      : '—',
                  icon: Star,
                },
                {
                  label: 'Первая роль',
                  value:
                    filmography.length > 0
                      ? (filmography[filmography.length - 1].movie.year ?? '—')
                      : '—',
                  icon: Calendar,
                },
                {
                  label: 'Последняя роль',
                  value:
                    filmography.length > 0
                      ? (filmography[0].movie.year ?? '—')
                      : '—',
                  icon: Star,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
                >
                  <Card className="bg-card border-border card-hover">
                    <CardContent className="p-5 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <stat.icon className="w-4 h-4 text-primary" />
                        <span className="text-xs">{stat.label}</span>
                      </div>
                      <span
                        className="text-2xl font-bold text-foreground"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {stat.value}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
