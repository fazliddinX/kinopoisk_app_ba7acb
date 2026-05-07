# AI Frontend Template

Базовый template для AI-генерации React приложений. ИИ генерирует только бизнес-логику — конфиги, библиотеки и архитектура уже готовы.

## Стек

| Категория | Библиотека |
|-----------|-----------|
| UI Framework | React 18 + TypeScript + Vite |
| Стили | Tailwind CSS + shadcn/ui |
| HTTP | Axios (настроенный инстанс) |
| Server State | React Query v5 |
| Client State | Zustand |
| Формы | React Hook Form + Zod |
| Анимации | Framer Motion |
| Иконки | Lucide React |
| Уведомления | Sonner |
| Drag & Drop | dnd-kit |
| Карты | React Leaflet (OpenStreetMap, бесплатно) |

---

## Структура проекта

```
src/
├── config/
│   ├── axios.ts          # Axios инстанс с интерцепторами
│   ├── queryClient.ts    # React Query конфигурация
│   └── env.ts            # Типизированные env переменные
├── lib/
│   └── utils.ts          # cn(), formatDate(), formatCurrency() и др.
├── hooks/
│   ├── useApi.ts         # useApiQuery, useApiMutation, useApiInfiniteQuery
│   └── useAppForm.ts     # Обёртка react-hook-form + zod
├── store/
│   └── auth.store.ts     # Zustand auth стор
├── types/
│   └── common.ts         # Общие TypeScript типы
├── components/
│   ├── ui/               # shadcn/ui компоненты
│   └── shared/
│       ├── AppMap.tsx    # Leaflet карта
│       └── AppProviders.tsx  # Все провайдеры
│
│   # ↓ ИИ генерирует ↓
│
├── features/
│   └── {name}/
│       ├── types.ts      # Zod схемы + TS типы
│       ├── api.ts        # React Query хуки
│       └── components/   # UI компоненты
├── pages/
│   └── {Name}Page.tsx
└── App.tsx               # Роутинг
```

---

## Как работает система

### 1. Пользователь отправляет запрос
```
"Сгенерируй CRM систему, UI как Salesforce — тёмная тема, синие акценты"
```

### 2. Бэкенд формирует промпт
```javascript
const systemPrompt = fs.readFileSync('AI_SYSTEM_PROMPT.md', 'utf-8');
const userPrompt = `${systemPrompt}\n\nЗадание: ${userRequest}`;
```

### 3. ИИ возвращает JSON
```json
[
  { "path": "src/index.css", "content": "/* тёмная тема */" },
  { "path": "src/App.tsx", "content": "..." },
  { "path": "src/features/contacts/types.ts", "content": "..." },
  ...
]
```

### 4. Бэкенд делает merge
```javascript
const manifest = require('./template.manifest.json');

function mergeFiles(templateFiles, aiFiles) {
  const result = { ...templateFiles };
  
  for (const file of aiFiles) {
    const isStatic = manifest.static_files.includes(file.path);
    const hasOverride = file.__override_static__;
    
    if (!isStatic || hasOverride) {
      result[file.path] = file.content;
    }
  }
  
  return result;
}
```

---

## Theming

ИИ изменяет CSS переменные в `src/index.css` под нужный стиль.

### Примеры тем

**"UI как Stripe"**
```css
:root {
  --primary: 227 100% 55%;
  --radius: 0.375rem;
  --font-sans: 'Inter', sans-serif;
}
```

**"UI как Linear (тёмная)"**
```css
:root {
  --background: 240 6% 7%;
  --primary: 258 89% 66%;
  --radius: 0.25rem;
}
```

**Пользователь передаёт свои цвета:**
```
Primary: #6366f1  → --primary: 239 84% 67%
Background: #0f0f11 → --background: 240 6% 7%
Radius: 8px → --radius: 0.5rem
```

---

## Быстрый старт

```bash
cp .env.example .env
npm install
npm run dev
```

---

## template.manifest.json

Описывает:
- `static_files` — файлы template (ИИ не трогает)
- `ai_generated_files` — что ИИ может генерировать
- `merge_strategy` — логика объединения
- `theme_injection` — правила темизации
