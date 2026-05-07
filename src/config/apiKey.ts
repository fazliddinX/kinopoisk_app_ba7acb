import { env } from './env';

/**
 * Returns the API key to be used in the Authorization header.
 * Falls back to X_API_KEY if API_KEY is not set.
 */
export function getApiKey(): string {
  return env.API_KEY || env.X_API_KEY || '';
}
