import axios from 'axios';
import { env } from './env';
import { getApiKey } from './apiKey';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'API-KEY',
  },
});

// Request interceptor — attaches both required auth headers to every request
apiClient.interceptors.request.use(
  (config) => {
    // Literal string "API-KEY" as the Authorization value (required by backend)
    config.headers['Authorization'] = 'API-KEY';
    // Actual API key value from environment
    config.headers['X-API-KEY'] = getApiKey();
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;
