const counterId = Number(import.meta.env.VITE_YANDEX_METRICA_ID);

const isReady = () =>
  typeof window !== 'undefined' &&
  typeof window.ym === 'function' &&
  !Number.isNaN(counterId);

export function initMetrica() {
  if (typeof window === 'undefined' || Number.isNaN(counterId)) return;
  if (window.ym) return;

  (function (m: any, e, t, r, i: string, k?: any, a?: any) {
    m[i] =
      m[i] ||
      function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
    m[i].l = 1 * (new Date() as any);
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(
    window,
    document,
    'script',
    `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`,
    'ym',
  );

  window.ym!(counterId, 'init', {
    webvisor: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
  });
}

export function hit(
  url: string,
  options?: { referer?: string; title?: string; params?: Record<string, unknown> },
) {
  if (!isReady()) return;
  window.ym!(counterId, 'hit', url, options);
}

export function reachGoal(target: string, params?: Record<string, unknown>) {
  if (!isReady()) return;
  window.ym!(counterId, 'reachGoal', target, params);
}

export function setUserParams(params: Record<string, unknown>) {
  if (!isReady()) return;
  window.ym!(counterId, 'userParams', params);
}
