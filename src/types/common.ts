import type { ComponentType, ReactNode } from 'react';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface NavItem {
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker extends LatLng {
  id: string;
  title?: string;
  description?: string;
  color?: string;
}
