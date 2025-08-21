const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
//
// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Test API functions
export const testAPI = {
  // Get all available tests for candidates
  getAvailableTests: async () => {
    const response = await fetch(`${API_BASE_URL}/tests/available`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get all published tests (for dashboard - includes completed tests)
  getAllPublishedTests: async () => {
    const response = await fetch(`${API_BASE_URL}/tests/published`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get specific test by ID
  getTestById: async (testId) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Submit test attempt
  submitAttempt: async (testId, answers, score) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers, score }),
    });
    return handleResponse(response);
  },

  // Get candidate's attempts
  getCandidateAttempts: async (candidateId) => {
    const response = await fetch(`${API_BASE_URL}/tests/candidate/${candidateId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Attempt API functions
export const attemptAPI = {
  // Get all attempts for current user
  getMyAttempts: async () => {
    const response = await fetch(`${API_BASE_URL}/tests/my-attempts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get detailed attempt data for results page
  getAttemptDetail: async (attemptId) => {
    const response = await fetch(`${API_BASE_URL}/tests/attempt/${attemptId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// HR-specific API functions
export const testsAPI = {
  // Get tests created by HR
  getHRTests: async () => {
    const response = await fetch(`${API_BASE_URL}/hr/my-tests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get HR dashboard stats
  getHRStats: async () => {
    const response = await fetch(`${API_BASE_URL}/hr/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get recent test results
  getRecentResults: async () => {
    const response = await fetch(`${API_BASE_URL}/hr/recent-results`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get active candidates
  getActiveCandidates: async () => {
    const response = await fetch(`${API_BASE_URL}/hr/active-candidates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get active test sessions for monitoring
  getActiveTestSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/hr/monitor`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new test
  createTest: async (testData) => {
    const response = await fetch(`${API_BASE_URL}/hr/create-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(response);
  },

  // Get test by ID (for HR)
  getTestById: async (testId) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Complete test submission
  completeTest: async (testId, score, completionData) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ score, ...completionData }),
    });
    return handleResponse(response);
  },

  // Move test to completed status
  moveToCompleted: async (testId) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/move-completed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Publish a test
  publishTest: async (testId) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Delete a test
  deleteTest: async (testId) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Flag a violation during monitoring
  flagViolation: async (candidateId, violation) => {
    const response = await fetch(`${API_BASE_URL}/hr/flag-violation`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ candidateId, violation }),
    });
    return handleResponse(response);
  },

  // Open chat session with candidate
  openChatSession: async (candidateId) => {
    const response = await fetch(`${API_BASE_URL}/hr/chat/${candidateId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get test reports with completion data
  getTestReports: async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/hr/test-reports`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  // Get detailed results for a specific test
  getTestResults: async (testId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/hr/test-results/${testId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  // Get live test sessions for monitoring (NEW)
  getMonitorSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/hr/monitor-sessions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export default { testAPI, attemptAPI, testsAPI };