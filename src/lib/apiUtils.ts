export function extractList<T>(data: unknown): T[] {
  const r = (data as any)?.data?.data?.response;
  if (Array.isArray(r)) return r;
  if (r && typeof r === 'object') return [r as T];
  return [];
}

export function extractCount(data: unknown): number {
  return (data as any)?.data?.data?.count ?? 0;
}

export function extractSingle<T>(data: unknown): T | null {
  const r = (data as any)?.data?.data?.response;
  if (Array.isArray(r)) return r[0] ?? null;
  return (r as T) ?? null;
}

export function getRelationLabel(value: unknown, labelKey = 'name'): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return String(obj[labelKey] ?? obj['id'] ?? '—');
  }
  return String(value);
}
