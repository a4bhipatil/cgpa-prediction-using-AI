import { useState, useEffect, useCallback, useMemo } from 'react';
import { testAPI, attemptAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailableTests = async () => {
      try {
        setLoading(true);
        const response = await testAPI.getAvailableTests();
        setTests(response.tests || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch available tests",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTests();
  }, [toast]);

  const refetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await testAPI.getAvailableTests();
      setTests(response.tests || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch available tests",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return useMemo(() => ({
    tests,
    loading,
    error,
    refetch: refetchTests,
  }), [tests, loading, error, refetchTests]);
};

// Hook for dashboard that gets ALL published tests (including completed ones)
export const useDashboardTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllTests = async () => {
      try {
        setLoading(true);
        const response = await testAPI.getAllPublishedTests();
        setTests(response.tests || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch tests",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllTests();
  }, [toast]);

  const refetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await testAPI.getAllPublishedTests();
      setTests(response.tests || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch tests",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return useMemo(() => ({
    tests,
    loading,
    error,
    refetch: refetchTests,
  }), [tests, loading, error, refetchTests]);
};

export const useTestAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const response = await attemptAPI.getMyAttempts();
        setAttempts(response.attempts || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch test attempts",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [toast]);

  const refetchAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await attemptAPI.getMyAttempts();
      setAttempts(response.attempts || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch test attempts",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return useMemo(() => ({
    attempts,
    loading,
    error,
    refetch: refetchAttempts,
  }), [attempts, loading, error, refetchAttempts]);
};

export const useTestSubmission = (onSuccess) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submitTest = async (testId, answers, score) => {
    try {
      setSubmitting(true);
      const response = await testAPI.submitAttempt(testId, answers, score);
      toast({
        title: "Success",
        description: "Test submitted successfully",
      });
      
      // 🚀 Performance: Set flag to refresh dashboard
      if (response.refreshDashboard) {
        localStorage.setItem('testCompleted', 'true');
      }
      
      // 🚀 Performance: Call onSuccess callback to refresh data
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(response);
      }
      
      return { success: true, data: response };
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit test",
      });
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitTest,
    submitting,
  };
};