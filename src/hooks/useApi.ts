import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/config/axios';
import type { AxiosRequestConfig } from 'axios';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Base fetch helper — routes all requests through the configured apiClient
 * which automatically attaches Authorization: API-KEY and X-API-KEY headers.
 */
export async function apiFetch<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.request<T>({
    url,
    ...config,
    headers: {
      'Authorization': 'API-KEY',
      ...config?.headers,
    },
  });
  return res.data;
}

export function useApiQuery<T>(
  queryKey: unknown[],
  url: string,
  config?: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey,
    queryFn: () => apiFetch<T>(url, config),
    ...options,
  });
}

interface MutationConfig<TData, TVariables> {
  url: string | ((variables: TVariables) => string);
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successMessage?: string;
  invalidateKeys?: unknown[][];
  options?: UseMutationOptions<TData, Error, TVariables>;
}

export function useApiMutation<TData = unknown, TVariables = void>({
  url,
  method = 'POST',
  successMessage,
  invalidateKeys = [],
  options,
}: MutationConfig<TData, TVariables>) {
  const qc = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const resolvedUrl = typeof url === 'function' ? url(variables) : url;
      const res = await apiClient.request<TData>({
        url: resolvedUrl,
        method,
        data: method === 'DELETE' ? { data: {} } : { data: variables },
        headers: {
          'Authorization': 'API-KEY',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      if (successMessage) toast.success(successMessage);
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
    ...options,
  });
}

export function useApiInfiniteQuery<T>(
  queryKey: unknown[],
  getUrl: (page: number) => string,
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<T>, Error, InfiniteData<PaginatedResponse<T>>, unknown[], number>,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfiniteQuery<
    PaginatedResponse<T>,
    Error,
    InfiniteData<PaginatedResponse<T>>,
    unknown[],
    number
  >({
    queryKey,
    queryFn: ({ pageParam }) => apiFetch<PaginatedResponse<T>>(getUrl(pageParam), {
      headers: { 'Authorization': 'API-KEY' },
    }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    ...options,
  });
}
