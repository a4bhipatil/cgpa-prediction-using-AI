import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useDashboardTests, useTestAttempts } from '@/hooks/useTests';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const testsHook = useDashboardTests(); // ✅ Now uses ALL published tests
  const attemptsHook = useTestAttempts();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // 🚀 Performance: Function to refresh all dashboard data  
  const refreshDashboard = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log("🔄 Refreshing dashboard data...");
      await Promise.all([
        testsHook.refetch(),
        attemptsHook.refetch()
      ]);
      console.log("✅ Dashboard data refreshed");
    } finally {
      setIsRefreshing(false);
    }
  }, [testsHook, attemptsHook]);

  // 🚀 Performance: Listen for test completion events
  useEffect(() => {
    const handleTestCompleted = (event) => {
      if (event.key === 'testCompleted') {
        console.log("🎯 Test completion detected, refreshing dashboard...");
        refreshDashboard();
        // Remove the flag
        localStorage.removeItem('testCompleted');
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleTestCompleted);
    
    // Also check for flag on focus (same-tab refresh)
    const handleFocus = () => {
      if (localStorage.getItem('testCompleted')) {
        console.log("🎯 Test completion flag found, refreshing dashboard...");
        refreshDashboard();
        localStorage.removeItem('testCompleted');
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleTestCompleted);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshDashboard]);

  const value = {
    // Tests data
    tests: testsHook.tests,
    testsLoading: testsHook.loading || isRefreshing,
    testsError: testsHook.error,
    refetchTests: testsHook.refetch,

    // Attempts data
    attempts: attemptsHook.attempts,
    attemptsLoading: attemptsHook.loading || isRefreshing,
    attemptsError: attemptsHook.error,
    refetchAttempts: attemptsHook.refetch,

    // Combined refresh
    refreshDashboard,
    isRefreshing,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};