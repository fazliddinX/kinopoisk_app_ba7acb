import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Film,
  User,
  Mail,
  Lock,
  Phone,
  ChevronRight,
  Star,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_X_API_KEY

const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'API-KEY',
  'x-api-key': API_KEY,
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...apiHeaders, ...(options?.headers ?? {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

function extractList<T>(data: unknown): T[] {
  if (!data) return []
  const d = (data as any)?.data?.data?.response
  return Array.isArray(d) ? d : []
}

const BG_HERO =
  'https://images.unsplash.com/photo-1728771227328-7cc2a0dc253a?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=1600&h=900&fit=crop&auto=format&q=80'
const BG_CARD =
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixid=M3w5Mzk5NTF8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjBwcm9qZWN0b3IlMjBsaWdodCUyMGJlYW18ZW58MXwwfHx8MTc3Nzk3Mjk4NHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&auto=format&q=80'

type Mode = 'login' | 'register'

interface RoleOption { guid: string; name: string }
interface ClientTypeOption { guid: string; name: string }

interface LoginForm {
  login: string
  password: string
}

interface RegisterForm {
  login: string
  password: string
  email: string
  phone: string
  full_name: string
  role_id: string
  client_type_id: string
}

function InputField({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  rightElement,
}: {
  label: string
  icon: React.ReactNode
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  rightElement?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn(
            'input-dark pl-10',
            rightElement && 'pr-10',
            'h-11 text-sm'
          )}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>
        )}
      </div>
    </div>
  )
}

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={cn(
            'input-dark pl-10 h-11 text-sm appearance-none cursor-pointer',
            !value && 'text-muted-foreground'
          )}
        >
          <option value="" disabled>
            {placeholder ?? 'Выберите...'}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
      </div>
    </div>
  )
}

// --- Login form ---
function LoginFormPanel({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginForm>({ login: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return apiFetch('/v2/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: data.login, password: data.password }),
      })
    },
    onSuccess: (res) => {
      const token = res?.data?.token ?? res?.token
      if (token) {
        localStorage.setItem('kp_token', token)
      }
      toast.success('Добро пожаловать!')
      navigate('/')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Ошибка входа')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.login.trim() || !form.password) {
      toast.error('Заполните все обязательные поля')
      return
    }
    mutation.mutate(form)
  }

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mb-8">
        <h2
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Войти в аккаунт
        </h2>
        <p className="text-muted-foreground text-sm">
          Доступ к персональным рекомендациям, рецензиям и спискам просмотра
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Логин"
          icon={<User className="w-4 h-4" />}
          value={form.login}
          onChange={(v) => setForm((f) => ({ ...f, login: v }))}
          placeholder="Ваш логин"
          required
        />
        <InputField
          label="Пароль"
          icon={<Lock className="w-4 h-4" />}
          type={showPwd ? 'text' : 'password'}
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholder="••••••••"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="w-full h-12 text-base font-semibold mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300 hover:shadow-primary/40"
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Входим...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              Войти
            </span>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Нет аккаунта?{' '}
          <button
            onClick={onSwitch}
            className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-2 hover:underline"
          >
            Зарегистрироваться
          </button>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Входя в систему, вы соглашаетесь с{' '}
          <Link to="/terms" className="text-primary/80 hover:text-primary transition-colors">
            условиями использования
          </Link>{' '}
          и{' '}
          <Link to="/privacy" className="text-primary/80 hover:text-primary transition-colors">
            политикой конфиденциальности
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

// --- Register form ---
function RegisterFormPanel({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({
    login: '',
    password: '',
    email: '',
    phone: '',
    full_name: '',
    role_id: '',
    client_type_id: '',
  })
  const [showPwd, setShowPwd] = useState(false)

  const { data: rolesData } = useQuery<unknown>({
    queryKey: ['roles'],
    queryFn: () => apiFetch('/v2/items/role'),
  })
  const roles = extractList<RoleOption>(rolesData)

  const { data: ctData } = useQuery<unknown>({
    queryKey: ['client-types'],
    queryFn: () => apiFetch('/v2/items/client_type'),
  })
  const clientTypes = extractList<ClientTypeOption>(ctData)

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const body: Record<string, unknown> = {
        login: data.login,
        password: data.password,
        email: data.email,
        role_id: data.role_id,
        client_type_id: data.client_type_id,
        full_name: data.full_name,
      }
      if (data.phone) body.phone = data.phone
      return apiFetch('/v2/items/users', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    onSuccess: () => {
      toast.success('Аккаунт создан! Теперь войдите.')
      onSwitch()
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Ошибка регистрации')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.login.trim() || !form.password || !form.email.trim()) {
      toast.error('Заполните обязательные поля')
      return
    }
    if (!form.role_id) {
      toast.error('Выберите роль')
      return
    }
    if (!form.client_type_id) {
      toast.error('Выберите тип клиента')
      return
    }
    mutation.mutate(form)
  }

  const set = (key: keyof RegisterForm) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }))

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Создать аккаунт
        </h2>
        <p className="text-muted-foreground text-sm">
          Присоединяйтесь к миллионам любителей кино на КиноПортале
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <InputField
          label="Полное имя"
          icon={<User className="w-4 h-4" />}
          value={form.full_name}
          onChange={set('full_name')}
          placeholder="Иван Иванов"
        />
        <InputField
          label="Логин"
          icon={<User className="w-4 h-4" />}
          value={form.login}
          onChange={set('login')}
          placeholder="username"
          required
        />
        <InputField
          label="Пароль"
          icon={<Lock className="w-4 h-4" />}
          type={showPwd ? 'text' : 'password'}
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <InputField
          label="Email"
          icon={<Mail className="w-4 h-4" />}
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
          required
        />
        <InputField
          label="Телефон"
          icon={<Phone className="w-4 h-4" />}
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+7 900 000 00 00"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Роль"
            icon={<Star className="w-4 h-4" />}
            value={form.role_id}
            onChange={set('role_id')}
            options={roles.map((r) => ({ value: r.guid, label: r.name ?? '—' }))}
            placeholder="Выберите роль"
            required
          />
          <SelectField
            label="Тип клиента"
            icon={<Sparkles className="w-4 h-4" />}
            value={form.client_type_id}
            onChange={set('client_type_id')}
            options={clientTypes.map((c) => ({ value: c.guid, label: c.name ?? '—' }))}
            placeholder="Тип клиента"
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="w-full h-12 text-base font-semibold mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300 hover:shadow-primary/40"
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Создаём аккаунт...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              Зарегистрироваться
            </span>
          )}
        </Button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-muted-foreground text-sm">
          Уже есть аккаунт?{' '}
          <button
            onClick={onSwitch}
            className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-2 hover:underline"
          >
            Войти
          </button>
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Регистрируясь, вы соглашаетесь с{' '}
          <Link to="/terms" className="text-primary/80 hover:text-primary transition-colors">
            условиями
          </Link>{' '}
          и{' '}
          <Link to="/privacy" className="text-primary/80 hover:text-primary transition-colors">
            политикой конфиденциальности
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

// --- Feature bullet ---
function FeatureBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}

// --- Main export ---
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-4 hero-texture overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={BG_HERO}
          alt="Cinematic background"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.parentElement) {
              e.currentTarget.parentElement.style.background =
                'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
            }
          }}
        />
        {/* Deep dark overlay */}
        <div className="absolute inset-0 bg-background/90" />
        {/* Radial glow from center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, hsl(38 92% 50% / 0.06) 0%, transparent 70%)',
          }}
        />
        {/* Grid lines from CSS class hero-texture are applied on parent */}
      </div>

      {/* Floating ambient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(38 92% 50% / 0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(0 84% 60% / 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left: Branding panel */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="hidden lg:flex flex-col justify-center"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-glow shrink-0">
                <Film className="w-6 h-6 text-primary-foreground" />
              </div>
              <span
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="text-foreground">Кино</span>
                <span className="text-primary">Портал</span>
              </span>
            </div>

            <h1
              className="text-4xl xl:text-5xl font-extrabold leading-tight mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <span className="text-foreground">Мир кино</span>
              <br />
              <span className="gradient-text">в одном месте</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm">
              Открывайте новые фильмы, ведите список просмотра, пишите рецензии
              и делитесь впечатлениями с другими любителями кино.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-4 mb-10">
              <FeatureBullet
                icon={<Star className="w-4 h-4" />}
                text="Более 100 000 фильмов и сериалов с рейтингами"
              />
              <FeatureBullet
                icon={<Film className="w-4 h-4" />}
                text="Персональные рекомендации на основе ваших оценок"
              />
              <FeatureBullet
                icon={<User className="w-4 h-4" />}
                text="Списки просмотра, рецензии и коллекции"
              />
              <FeatureBullet
                icon={<Sparkles className="w-4 h-4" />}
                text="Трейлеры, биографии актёров и новости кино"
              />
            </div>

            {/* Preview image */}
            <div className="relative rounded-2xl overflow-hidden h-48 border border-border/60">
              <img
                src={BG_CARD}
                alt="Cinema preview"
                loading="lazy"
                className="w-full h-full object-cover opacity-70"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.style.display = 'none'
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.background =
                      'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)/0.2))'
                  }
                }}
              />
              <div className="absolute inset-0 cinematic-overlay-bottom" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Сейчас в кино</p>
                <p
                  className="text-foreground font-bold text-lg leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Откройте для себя шедевры кинематографа
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Auth card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-glow">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="text-foreground">Кино</span>
                <span className="text-primary">Портал</span>
              </span>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl overflow-hidden border border-border mb-6 bg-card p-1 gap-1">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 h-10 rounded-lg text-sm font-semibold transition-all duration-300',
                    mode === m
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  {m === 'login' ? 'Войти' : 'Регистрация'}
                </button>
              ))}
            </div>

            {/* Card */}
            <div className="glass rounded-2xl border border-border/60 p-6 md:p-8 shadow-2xl">
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  <LoginFormPanel key="login" onSwitch={() => setMode('register')} />
                ) : (
                  <RegisterFormPanel key="register" onSwitch={() => setMode('login')} />
                )}
              </AnimatePresence>
            </div>

            {/* Back to home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 text-center"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
                Вернуться на главную
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/40 text-xs text-muted-foreground"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span>Безопасное подключение · SSL защита · Ваши данные в безопасности</span>
      </motion.div>
    </div>
  )
}
