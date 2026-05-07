const getEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key] ?? fallback;
  if (value === undefined) {
    console.warn(`[env] Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

export const env = {
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://admin-api.ucode.run'),
  X_API_KEY: getEnvVar('VITE_X_API_KEY', ''),
  API_KEY: getEnvVar('VITE_API_KEY', ''),
  MAP_TILE_URL: getEnvVar(
    'VITE_MAP_TILE_URL',
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  ),
  APP_NAME: getEnvVar('VITE_APP_NAME', 'App'),
  IS_DEV: import.meta.env.DEV,
} as const;
