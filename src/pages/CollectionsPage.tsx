import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BookOpen, ChevronRight, Film, Layers, Lock, Globe } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

interface Collection {
  guid: string
  name?: string
  description?: string
  cover_image?: string
  is_public?: boolean
  users_id?: string
}

interface Movie {
  guid: string
  title?: string
  poster?: string
  year?: number
  rating?: number
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1766425597359-08c8f7585ba4?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1614115866447-c9a299154650?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1566944284128-0630ae1a2271?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxtb3ZpZSUyMHBvcGNvcm4lMjBhZXN0aGV0aWMlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODR8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1516028529332-04b428b43a06?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwzfHxmaWxtJTIwcHJlbWllcmUlMjByZWQlMjBjYXJwZXR8ZW58MXwwfHx8MTc3Nzk3Mjk4M3ww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80',
]

function getFallback(index: number) {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch(`${API_BASE}/v2/items/collections?limit=50`, {
    headers: { 'Authorization': 'API-KEY', 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error('Failed to fetch collections')
  const data = await res.json()
  return data?.data?.data?.response ?? []
}

async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch(`${API_BASE}/v2/items/movies?limit=30`, {
    headers: { 'Authorization': 'API-KEY', 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error('Failed to fetch movies')
  const data = await res.json()
  return data?.data?.data?.response ?? []
}

function CollectionCard({ collection, index, movies }: { collection: Collection; index: number; movies: Movie[] }) {
  const [expanded, setExpanded] = useState(false)
  const imgSrc = collection.cover_image ?? getFallback(index)

  // show first 5 movie posters as decoration
  const previewMovies = movies.slice(index * 3, index * 3 + 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (index % 3) * 0.1 }}
      className="group relative rounded-xl overflow-hidden border border-border bg-card card-hover cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Cover */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={imgSrc}
          alt={collection.name ?? 'Collection cover'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Privacy badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={cn(
              'text-xs font-semibold flex items-center gap-1 px-2 py-1',
              collection.is_public
                ? 'bg-emerald-600/90 text-white border-0'
                : 'bg-muted/90 text-muted-foreground border-0'
            )}
          >
            {collection.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {collection.is_public ? 'Публичная' : 'Приватная'}
          </Badge>
        </div>

        {/* Preview movies strip */}
        {previewMovies.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {previewMovies.slice(0, 3).map((m, i) => (
              <div key={m.guid} className="w-8 h-11 rounded overflow-hidden border border-white/20 shadow">
                <img
                  src={m.poster ?? getFallback(i)}
                  alt={m.title ?? ''}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.style.background = 'hsl(var(--muted))'
                  }}
                />
              </div>
            ))}
            {previewMovies.length === 4 && (
              <div className="w-8 h-11 rounded overflow-hidden border border-white/20 bg-muted/60 flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground font-bold">+</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-foreground font-semibold text-base leading-tight line-clamp-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {collection.name ?? 'Без названия'}
          </h3>
          <ChevronRight
            className={cn(
              'w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-300',
              expanded && 'rotate-90'
            )}
          />
        </div>

        <p className={cn('text-muted-foreground text-sm leading-relaxed', expanded ? '' : 'line-clamp-2')}>
          {collection.description ?? 'Описание отсутствует.'}
        </p>

        {/* Expanded movies */}
        {expanded && previewMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Фильмы в подборке</p>
            <div className="grid grid-cols-4 gap-2">
              {previewMovies.map((m, i) => (
                <Link
                  key={m.guid}
                  to={`/movies/${m.guid}`}
                  onClick={(e) => e.stopPropagation()}
                  className="group/movie"
                >
                  <div className="aspect-[2/3] rounded overflow-hidden bg-muted">
                    <img
                      src={m.poster ?? getFallback(i)}
                      alt={m.title ?? ''}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/movie:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.style.background = 'hsl(var(--muted))'
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.title ?? '—'}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      <Skeleton className="h-52 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export default function CollectionsPage() {
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')
  const [search, setSearch] = useState('')

  const { data: collections = [], isLoading: loadingCollections } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  })

  const { data: movies = [] } = useQuery<Movie[]>({
    queryKey: ['movies-for-collections'],
    queryFn: fetchMovies,
  })

  const filtered = collections.filter((c) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && c.is_public) ||
      (filter === 'private' && !c.is_public)
    const matchesSearch =
      !search || (c.name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden hero-texture" style={{ minHeight: 320 }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1760170437237-a3654545ab4c?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8MHx8fDE3Nzc5NzI5ODN8MA&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80"
            alt="Collections hero"
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
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold uppercase tracking-wider">
                Подборки
              </Badge>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Кинематографические{' '}
              <span className="gradient-text">подборки</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Тематические коллекции фильмов, отобранные редакцией и пользователями. Найдите идеальное кино для любого настроения.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-background/95 border-b border-border backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск подборок..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark pl-9 h-10 text-sm"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(['all', 'public', 'private'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    filter === f
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {f === 'all' ? 'Все' : f === 'public' ? 'Публичные' : 'Приватные'}
                </button>
              ))}
            </div>

            {/* Count */}
            <span className="text-muted-foreground text-sm ml-auto">
              {filtered.length} {filtered.length === 1 ? 'подборка' : filtered.length < 5 ? 'подборки' : 'подборок'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        {loadingCollections ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Подборки не найдены
            </h2>
            <p className="text-muted-foreground/60 text-sm">
              Попробуйте изменить фильтры или поисковый запрос
            </p>
          </motion.div>
        ) : (
          <>
            {/* Featured (first 3) */}
            {filtered.slice(0, 3).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                    Избранные подборки
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(0, 3).map((col, i) => (
                    <CollectionCard key={col.guid} collection={col} index={i} movies={movies} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rest */}
            {filtered.slice(3).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-accent rounded-full" />
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                    Все подборки
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(3).map((col, i) => (
                    <CollectionCard key={col.guid} collection={col} index={i + 3} movies={movies} />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16"
      >
        <div className="relative rounded-2xl overflow-hidden border border-primary/20">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80"
              alt="Create collection"
              loading="lazy"
              className="w-full h-full object-cover opacity-20"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />
          </div>
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold text-foreground mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Создайте свою подборку
              </h2>
              <p className="text-muted-foreground max-w-md">
                Соберите любимые фильмы в персональную коллекцию и поделитесь ею с друзьями.
              </p>
            </div>
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 h-auto text-base font-semibold shadow-lg animate-glow">
                <Film className="w-4 h-4 mr-2" />
                Войти и создать
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
