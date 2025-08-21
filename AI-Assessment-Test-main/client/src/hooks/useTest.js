import { useState, useEffect } from 'react';
import { testAPI, attemptAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useTest = () => {
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailableTests = async () => {
      try {
        setLoading(true);
        const response = await testAPI.getAvailableTests();
        setAvailableTests(response.tests || []);
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

  const refetchTests = async () => {
    try {
      setLoading(true);
      const response = await testAPI.getAvailableTests();
      setAvailableTests(response.tests || []);
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

  return {
    availableTests,
    loading,
    error,
    refetch: refetchTests,
  };
};

export const useTestById = (testId) => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!testId) return;

    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await testAPI.getTestById(testId);
        setTest(response.test || response);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch test details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId, toast]);

  return {
    test,
    loading,
    error,
  };
};

export const useTestSubmission = () => {
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

  const refetchAttempts = async () => {
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

  return {
    attempts,
    loading,
    error,
    refetch: refetchAttempts,
  };
};