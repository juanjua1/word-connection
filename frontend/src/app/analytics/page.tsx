'use client';

import React from 'react';
import useAuthGuard from '../../hooks/useAuthGuard';
import AuthRequired from '../../components/ui/AuthRequired';
import { Navbar } from '../../components/layout/Navbar';
import { EnhancedAnalyticsDashboard } from '../../components/analytics/EnhancedAnalyticsDashboard';

export default function AnalyticsPage() {
  const { shouldShowProtectedContent, needsLogin, isLoading: authLoading } = useAuthGuard();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (needsLogin) {
    return <AuthRequired />;
  }

  if (!shouldShowProtectedContent) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1629] to-[#1e2a4a]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <EnhancedAnalyticsDashboard />
      </div>
    </div>
  );
}

