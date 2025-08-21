import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  BarChart3,
  Clock,
  FileQuestion,
  PieChart as PieChartIcon,
  Users,
  Loader2,
} from "lucide-react";
import { testsAPI } from "@/services/api";
// import { formatDuration } from "@/utils/format";
export function TestAnalytics({ testId }) {
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestResults = async () => {
      if (!testId) {
        console.log("❌ TestAnalytics: No testId provided");
        return;
      }
      
      try {
        setLoading(true);
        console.log("🔄 TestAnalytics: Fetching test results for testId:", testId);
        const data = await testsAPI.getTestResults(testId);
        console.log("✅ TestAnalytics: Received data:", data);
        
        // Transform the API data to match our component structure
        const transformedData = {
          title: data.summary.testTitle,
          totalCandidates: data.summary.totalAssigned,
          completedTests: data.summary.completed,
          averageScore: data.summary.avgScore,
          passingScore: data.summary.passingScore,
          passRate: data.summary.passRate,
          averageCompletionTime: calculateAverageTime(data.results),
          questions: data.summary.questionCount || 0,
          difficulty: getDifficultyLevel(data.summary.questionCount, data.summary.duration),
          category: data.summary.testCategory,
          duration: data.summary.duration || 0,
          // Generate score distribution from results
          scoreDistribution: generateScoreDistribution(data.results),
          // For now, we'll use placeholder data for charts that need detailed question analysis
          topicBreakdown: [
            { name: data.summary.testCategory || "General", value: 100 }
          ],
          questionDifficulty: [],
          timePerformance: generateTimePerformance(data.results),
        };
        
        setTestData(transformedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching test results:", err);
        setError(err.message || "Failed to fetch test results");
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [testId]);

  const calculateAverageTime = (results) => {
    const completedResults = results.filter(r => r.duration);
    if (completedResults.length === 0) return 0;
    
    const totalTime = completedResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    return Math.round(totalTime / completedResults.length / 60); // Convert to minutes
  };

  const getDifficultyLevel = (questionCount, duration) => {
    if (!questionCount || !duration) return "Medium";
    
    const timePerQuestion = duration / questionCount; // minutes per question
    
    if (timePerQuestion < 1) return "Easy";
    else if (timePerQuestion < 2) return "Medium";
    else return "Hard";
  };

  const generateScoreDistribution = (results) => {
    const completedResults = results.filter(r => r.score !== null);
    const distribution = [
      { range: "0-20%", count: 0 },
      { range: "21-40%", count: 0 },
      { range: "41-60%", count: 0 },
      { range: "61-80%", count: 0 },
      { range: "81-100%", count: 0 },
    ];

    completedResults.forEach(result => {
      const score = result.score;
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  };

  const generateTimePerformance = (results) => {
    const completedResults = results.filter(r => r.duration);
    if (completedResults.length === 0) return [];

    // Sort by completion time and create cumulative data
    const sortedByTime = completedResults
      .map(result => Math.floor((result.duration || 0) / 60))
      .sort((a, b) => a - b);

    const timePerformance = [];
    
    // Create data points every 5 minutes
    const maxTime = Math.max(...sortedByTime);
    for (let minute = 0; minute <= maxTime + 5; minute += 5) {
      // Count how many completed by this time
      const completedByThisTime = sortedByTime.filter(time => time <= minute).length;
      timePerformance.push({
        minute,
        candidates: completedByThisTime
      });
    }

    return timePerformance;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading test analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No test data available.
      </div>
    );
  }
//
  const COLORS = [
    "#4f46e5",
    "#06b6d4",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">{testData.title} - Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of test performance and candidate results
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2 items-center text-center">
              <Users className="h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">
                {testData.completedTests}/{testData.totalCandidates}
              </h3>
              <p className="text-sm text-muted-foreground">Tests Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2 items-center text-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">{testData.averageScore}%</h3>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Pass: {testData.passingScore}%</span>
                  <span>Pass Rate: {testData.passRate}%</span>
                </div>
                <Progress value={testData.averageScore} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2 items-center text-center">
              <FileQuestion className="h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">{testData.questions}</h3>
              <p className="text-sm text-muted-foreground">Questions</p>
              <Badge>{testData.difficulty} Difficulty</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2 items-center text-center">
              <Clock className="h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">
                {testData.averageCompletionTime} min
              </h3>
              <p className="text-sm text-muted-foreground">
                Avg. Completion Time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={testData.scoreDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Candidates" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Topic Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Topic Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={testData.topicBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {testData.topicBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              {testData.topicBreakdown.map((topic, index) => (
                <div key={topic.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs">{topic.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Difficulty Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Question Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={testData.questionDifficulty}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="id" type="category" name="Question" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="correct"
                  name="Correct"
                  stackId="a"
                  fill="#10b981"
                />
                <Bar
                  dataKey="incorrect"
                  name="Incorrect"
                  stackId="a"
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={testData.timePerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="minute" name="Time (minutes)" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="candidates"
                  name="Candidates Completed"
                  stroke="#4f46e5"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual Candidate Performance Table would go here */}
    </div>
  );
}
