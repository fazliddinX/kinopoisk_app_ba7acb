import React from 'react';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import { Toaster } from 'sonner';
import { usePageTracking } from './hooks/usePageTracking';

// Lazy page imports
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ActorDetailPage from './pages/ActorDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import CollectionsPage from './pages/CollectionsPage';
import NewsPage from './pages/NewsPage';
import AuthPage from './pages/AuthPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppRoutes() {
  usePageTracking();

  return (
    <>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'hsl(220 30% 10%)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'hsl(214 40% 93%)',
          },
        }}
      />
      <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/movies"
            element={
              <Layout>
                <MoviesPage />
              </Layout>
            }
          />
          <Route
            path="/movies/:id"
            element={
              <Layout>
                <MovieDetailPage />
              </Layout>
            }
          />
          <Route
            path="/actors/:id"
            element={
              <Layout>
                <ActorDetailPage />
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout>
                <SearchPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfilePage />
              </Layout>
            }
          />
          <Route
            path="/collections"
            element={
              <Layout>
                <CollectionsPage />
              </Layout>
            }
          />
          <Route
            path="/news"
            element={
              <Layout>
                <NewsPage />
              </Layout>
            }
          />
          <Route
            path="/auth"
            element={
              <Layout>
                <AuthPage />
              </Layout>
            }
          />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
