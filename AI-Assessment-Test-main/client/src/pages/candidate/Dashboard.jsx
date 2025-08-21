import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TestCard } from "@/components/tests/TestCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, Award, CalendarDays } from "lucide-react";
import { UserSettings } from "@/components/user/UserSettings";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { useEffect, useState, useMemo, useCallback } from "react";

// Helper function to transform API data to component format
const transformTestData = (apiTests, attempts = []) => {
  const attemptMap = new Map(attempts.map(attempt => [attempt.testId._id, attempt]));
  
  return apiTests.map(test => ({
    id: test._id,
    title: test.title,
    description: test.description,
    category: test.category || "General",
    status: attemptMap.has(test._id) ? "completed" : "active",
    createdDate: new Date(test.createdAt).toISOString().split('T')[0],
    respondents: attemptMap.has(test._id) ? 1 : 0,
    avgScore: attemptMap.get(test._id)?.score || 0,
    duration: test.duration || 30,
    questions: test.questions || [],
    attempt: attemptMap.get(test._id), // Include the attempt data
  }));
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    tests, testsLoading,
    attempts, attemptsLoading,
    refreshDashboard
  } = useDashboard();
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    pendingCount: 0,
    completedCount: 0,
    bestScore: 0,
    nextTest: "No upcoming tests"
  });

  // Memoize expensive computations
  const { pending, completed, stats } = useMemo(() => {
    if (!testsLoading && !attemptsLoading && tests.length >= 0) {
      const transformed = transformTestData(tests, attempts);
      const pendingTests = transformed.filter(test => test.status === "active");
      const completedTests = transformed.filter(test => test.status === "completed");
      
      const bestScore = completedTests.length > 0 
        ? Math.max(...completedTests.map(test => test.avgScore))
        : 0;
      
      const statsData = {
        pendingCount: pendingTests.length,
        completedCount: completedTests.length,
        bestScore,
        nextTest: pendingTests.length > 0 ? "Today" : "No upcoming tests"
      };
      
      return {
        pending: pendingTests,
        completed: completedTests,
        stats: statsData
      };
    }
    return {
      pending: [],
      completed: [],
      stats: {
        pendingCount: 0,
        completedCount: 0,
        bestScore: 0,
        nextTest: "No upcoming tests"
      }
    };
  }, [tests, attempts, testsLoading, attemptsLoading]);

  // Update state when computed values change
  useEffect(() => {
    setPendingTests(pending);
    setCompletedTests(completed);
    setDashboardStats(stats);
  }, [pending, completed, stats]);

  // 🚀 Performance: Check for test completion flag on mount
  useEffect(() => {
    if (localStorage.getItem('testCompleted')) {
      console.log("🎯 Found test completion flag, refreshing data...");
      refreshDashboard();
      localStorage.removeItem('testCompleted');
    }
  }, [refreshDashboard]);

  const handleTestAction = useCallback((action, id) => {
    if (action === "start-test") {
      navigate(`/candidate/take-test/${id}`);
    } else if (action === "retake-test") {
      navigate(`/candidate/take-test/${id}`);
    } else if (action === "view-results") {
      // Find the attempt for this test
      const attempt = attempts.find(attempt => attempt.testId._id === id);
      if (attempt) {
        navigate(`/candidate/results/${attempt._id}`);
      } else {
        navigate("/candidate/results");
      }
    } else if (action === "view-details") {
      navigate("/candidate/results");
    } else {
      toast({
        title: "Action triggered",
        description: `${action} action for test ID: ${id}`,
      });
    }
  }, [navigate, attempts, toast]);

  return (
    <DashboardLayout allowedRole="candidate">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Candidate Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <UserSettings />
            <Button
              onClick={() => navigate("/candidate/start-test")}
              className="bg-primary hover:bg-primary/90"
            >
              Find available tests
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dashboard-card flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Tests
              </p>
              <h3 className="text-2xl font-bold">{dashboardStats.pendingCount}</h3>
            </div>
          </div>

          <div className="dashboard-card flex items-center space-x-4">
            <div className="bg-success/10 p-3 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <h3 className="text-2xl font-bold">{dashboardStats.completedCount}</h3>
            </div>
          </div>

          <div className="dashboard-card flex items-center space-x-4">
            <div className="bg-accent p-3 rounded-full">
              <Award className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Best Score
              </p>
              <h3 className="text-2xl font-bold">{dashboardStats.bestScore}%</h3>
            </div>
          </div>

          <div className="dashboard-card flex items-center space-x-4">
            <div className="bg-secondary p-3 rounded-full">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Next Test
              </p>
              <h3 className="text-lg font-medium">{dashboardStats.nextTest}</h3>
            </div>
          </div>
        </div>

        {/* Pending tests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Tests</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {testsLoading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Loading tests...</p>
              </div>
            ) : pendingTests.length > 0 ? (
              pendingTests.map((test) => (
                <TestCard
                  key={test.id}
                  {...test}
                  onAction={handleTestAction}
                  viewType="candidate"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No pending tests available</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed tests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Completed Tests</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {attemptsLoading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Loading completed tests...</p>
              </div>
            ) : completedTests.length > 0 ? (
              completedTests.map((test) => (
                <TestCard
                  key={test.id}
                  {...test}
                  onAction={handleTestAction}
                  viewType="candidate"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No completed tests yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Wrap the component with DashboardProvider
const CandidateDashboardWithProvider = () => (
  <DashboardProvider>
    <CandidateDashboard />
  </DashboardProvider>
);

export default CandidateDashboardWithProvider;
