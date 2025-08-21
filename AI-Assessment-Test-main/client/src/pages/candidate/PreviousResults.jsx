import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Download, Eye, FileBarChart2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTestAttempts } from "@/hooks/useTests";

// Helper function to transform API attempts data
const transformAttemptData = (attempts) => {
  return attempts.map(attempt => ({
    id: attempt._id,
    title: attempt.testId?.title || "Unknown Test",
    category: attempt.testId?.category || "General",
    dateTaken: new Date(attempt.createdAt).toISOString().split('T')[0],
    score: attempt.score || 0,
    percentile: Math.floor(Math.random() * 100), // Mock percentile for now
    questions: attempt.testId?.questions?.length || 0,
    correct: Math.floor((attempt.score / 100) * (attempt.testId?.questions?.length || 0)),
    incorrect: Math.floor(((100 - attempt.score) / 100) * (attempt.testId?.questions?.length || 0)),
    skipped: 0, // Mock data
    breakdown: [
      { category: "General Knowledge", score: attempt.score },
    ],
    detailedFeedback: `You scored ${attempt.score}% on this test. ${
      attempt.score >= 70 ? "Great job!" : 
      attempt.score >= 50 ? "Good effort, keep improving!" : 
      "Consider reviewing the material and trying again."
    }`,
  }));
};

// Generate progress data from attempts
const generateProgressData = (attempts) => {
  const monthlyScores = {};
  attempts.forEach(attempt => {
    const date = new Date(attempt.createdAt);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    if (!monthlyScores[monthKey]) {
      monthlyScores[monthKey] = [];
    }
    monthlyScores[monthKey].push(attempt.score);
  });

  return Object.entries(monthlyScores).map(([month, scores]) => ({
    month,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }));
};

const PreviousResults = () => {
  const navigate = useNavigate();
  const [expandedTest, setExpandedTest] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [completedTests, setCompletedTests] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const { attempts, loading } = useTestAttempts();

  useEffect(() => {
    if (attempts.length > 0) {
      const transformedTests = transformAttemptData(attempts);
      setCompletedTests(transformedTests);
      setSelectedTest(transformedTests[0]);
      setProgressData(generateProgressData(attempts));
    }
  }, [attempts]);

  const handleViewFullReport = (testId) => {
    navigate(`/candidate/results/${testId}`);
  };

  const handleDownloadReport = (test) => {
    // Create a simple text report
    const report = `
Test Result Report
==================
Test: ${test.title}
Category: ${test.category}
Date Taken: ${test.dateTaken}

RESULTS:
========
Score: ${test.score}%
Total Questions: ${test.questions}
Correct Answers: ${test.correct}
Incorrect Answers: ${test.incorrect}

FEEDBACK:
=========
${test.detailedFeedback}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-result-${test.title.replace(/\s+/g, '-')}-${test.dateTaken}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout allowedRole="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Results</h1>
          <p className="text-muted-foreground">
            View and analyze your previous test results
          </p>
        </div>

        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="results">Results History</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-4 md:col-span-2">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading test results...</p>
                  </div>
                ) : completedTests.length > 0 ? (
                  completedTests.map((test) => (
                  <Collapsible
                    key={test.id}
                    open={expandedTest === test.id}
                    onOpenChange={() => {
                      setExpandedTest(
                        expandedTest === test.id ? null : test.id
                      );
                      setSelectedTest(test);
                    }}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{test.title}</CardTitle>
                            <CardDescription>
                              {test.category} • Taken on {test.dateTaken}
                            </CardDescription>
                          </div>
                          <div className="flex items-center">
                            <div className="text-right mr-4">
                              <p className="text-sm font-medium">Score</p>
                              <p
                                className={`text-lg font-bold ${
                                  test.score >= 70
                                    ? "text-green-600"
                                    : test.score >= 50
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {test.score}%
                              </p>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 border rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  Questions
                                </p>
                                <p className="font-medium">{test.questions}</p>
                              </div>
                              <div className="p-2 border rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  Correct
                                </p>
                                <p className="font-medium text-green-600">
                                  {test.correct}
                                </p>
                              </div>
                              <div className="p-2 border rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  Incorrect
                                </p>
                                <p className="font-medium text-red-600">
                                  {test.incorrect}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="font-medium mb-2">
                                Score Breakdown:
                              </p>
                              <div className="space-y-2">
                                {test.breakdown.map((item, index) => (
                                  <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{item.category}</span>
                                      <span className="font-medium">
                                        {item.score}%
                                      </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full">
                                      <div
                                        className={`h-full rounded-full ${
                                          item.score >= 70
                                            ? "bg-green-500"
                                            : item.score >= 50
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{ width: `${item.score}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="font-medium mb-1">Feedback:</p>
                              <p className="text-sm text-muted-foreground">
                                {test.detailedFeedback}
                              </p>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleViewFullReport(test.id)}
                              >
                                <Eye className="h-4 w-4" /> View Full Report
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleDownloadReport(test)}
                              >
                                <Download className="h-4 w-4" /> Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No completed tests found</p>
                  </div>
                )}
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Score</span>
                        <span className="font-medium">
                          {completedTests.length > 0 
                            ? Math.round(completedTests.reduce((sum, test) => sum + test.score, 0) / completedTests.length)
                            : 0}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tests Taken</span>
                        <span className="font-medium">
                          {completedTests.length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Best Performance</span>
                        <span className="font-medium">
                          {completedTests.length > 0 
                            ? `${Math.max(...completedTests.map(test => test.score))}%`
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Skill Gap Areas</span>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          {completedTests.length > 0 ? "Review needed" : "No data"}
                        </Badge>
                      </div>

                      <div className="pt-4">
                        <p className="text-sm font-medium mb-2">
                          Recent Progress
                        </p>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>View your progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedTest?.breakdown || []}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" name="Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Skills Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill Area</TableHead>
                        <TableHead>Proficiency</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Product Knowledge</TableCell>
                        <TableCell>90%</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Excellent
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Sales Techniques</TableCell>
                        <TableCell>60%</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-800 border-amber-200"
                          >
                            Average
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Abstract Reasoning</TableCell>
                        <TableCell>35%</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-800 border-red-200"
                          >
                            Needs Improvement
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                    <FileBarChart2 className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Practice Abstract Reasoning
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Focus on pattern recognition and logical thinking
                        exercises.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                    <FileBarChart2 className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Refine Sales Techniques
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Brush up on handling objections and closing strategies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PreviousResults;
