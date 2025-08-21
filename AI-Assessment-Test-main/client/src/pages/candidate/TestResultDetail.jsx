import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { attemptAPI } from "@/services/api";

const TestResultDetail = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttemptDetail = async () => {
      if (!attemptId) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log("🔍 Fetching attempt detail for:", attemptId);
        
        const response = await attemptAPI.getAttemptDetail(attemptId);
        console.log("📡 API Response:", response);
        const attempt = response.attempt;
        console.log("📋 Attempt data:", attempt);
        
        if (attempt) {
          console.log("✅ Received attempt data:", attempt);
          
          // Calculate answers statistics
          const answers = attempt.answers || [];
          const questions = attempt.testId?.questions || [];
          const totalQuestions = questions.length;
          
          let correctAnswers = 0;
          let incorrectAnswers = 0;
          
          // Count correct/incorrect answers
          answers.forEach(answer => {
            if (answer.correct === true) {
              correctAnswers++;
            } else if (answer.correct === false) {
              incorrectAnswers++;
            }
          });
          
          // If we don't have individual answer correctness, calculate from score
          if (correctAnswers === 0 && incorrectAnswers === 0 && totalQuestions > 0) {
            correctAnswers = Math.round((attempt.score / 100) * totalQuestions);
            incorrectAnswers = totalQuestions - correctAnswers;
          }
          
          // Transform the attempt data for detailed view
          const transformedAttempt = {
            id: attempt._id,
            title: attempt.testId?.title || "Unknown Test",
            category: attempt.testId?.category || "General",
            dateTaken: attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : new Date(attempt.startedAt).toLocaleDateString(),
            timeTaken: attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleTimeString() : new Date(attempt.startedAt).toLocaleTimeString(),
            score: attempt.score || 0,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            skippedAnswers: Math.max(0, totalQuestions - answers.length), // Questions not answered
            duration: attempt.testId?.duration || 30,
            answers: answers,
            questions: questions,
            feedback: generateFeedback(attempt.score || 0),
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
          };
          
          console.log("📊 Transformed attempt:", transformedAttempt);
          setAttemptDetail(transformedAttempt);
        }
      } catch (err) {
        console.error("❌ Error fetching attempt detail:", err);
        console.error("❌ Error details:", {
          message: err.message,
          status: err.status,
          stack: err.stack
        });
        setError(err.message || "Failed to load test results");
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetail();
  }, [attemptId]);

  const generateFeedback = (score) => {
    if (score >= 90) return "Excellent performance! You have mastered this topic.";
    if (score >= 80) return "Great job! You have a strong understanding of the material.";
    if (score >= 70) return "Good work! You have a solid grasp of most concepts.";
    if (score >= 60) return "Fair performance. Consider reviewing the areas where you struggled.";
    if (score >= 50) return "Below average. Significant improvement needed.";
    return "Poor performance. Strong revision recommended before retaking.";
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 70) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  // Prepare chart data
  const pieData = attemptDetail ? [
    { name: "Correct", value: attemptDetail.correctAnswers, color: "#22c55e" },
    { name: "Incorrect", value: attemptDetail.incorrectAnswers, color: "#ef4444" },
    { name: "Skipped", value: attemptDetail.skippedAnswers, color: "#6b7280" },
  ] : [];

  const handleDownload = () => {
    // Create a simple text report
    const report = `
Test Result Report
==================
Test: ${attemptDetail.title}
Category: ${attemptDetail.category}
Date Taken: ${attemptDetail.dateTaken} at ${attemptDetail.timeTaken}
Duration: ${attemptDetail.duration} minutes

RESULTS:
========
Score: ${attemptDetail.score}%
Total Questions: ${attemptDetail.totalQuestions}
Correct Answers: ${attemptDetail.correctAnswers}
Incorrect Answers: ${attemptDetail.incorrectAnswers}
Skipped Answers: ${attemptDetail.skippedAnswers}

FEEDBACK:
=========
${attemptDetail.feedback}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-result-${attemptDetail.title.replace(/\s+/g, '-')}-${attemptDetail.dateTaken}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="candidate">
        <div className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading test result...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout allowedRole="candidate">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/candidate/results")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
          </div>
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <p className="text-muted-foreground mt-2">Unable to load test results</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!attemptDetail) {
    return (
      <DashboardLayout allowedRole="candidate">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/candidate/results")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Test result not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRole="candidate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/candidate/results")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {attemptDetail.title}
              </h1>
              <p className="text-muted-foreground">
                {attemptDetail.category} • Taken on {attemptDetail.dateTaken}
              </p>
            </div>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>

        {/* Score Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Final Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(attemptDetail.score)}`}>
                {attemptDetail.score}%
              </div>
              <Badge variant={getScoreBadgeVariant(attemptDetail.score)} className="mt-2">
                {attemptDetail.score >= 70 ? "Passed" : "Failed"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {attemptDetail.correctAnswers}
              </div>
              <p className="text-xs text-muted-foreground">
                out of {attemptDetail.totalQuestions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incorrect Answers</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {attemptDetail.incorrectAnswers}
              </div>
              <p className="text-xs text-muted-foreground">
                out of {attemptDetail.totalQuestions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attemptDetail.duration}
              </div>
              <p className="text-xs text-muted-foreground">minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
              <CardDescription>Visual representation of your answers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Score Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Score Analysis</CardTitle>
              <CardDescription>Detailed performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Performance</span>
                    <span className="font-medium">{attemptDetail.score}%</span>
                  </div>
                  <Progress value={attemptDetail.score} className="h-2" />
                </div>
                
                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Accuracy Rate</span>
                    <span className="font-medium">
                      {Math.round((attemptDetail.correctAnswers / attemptDetail.totalQuestions) * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Questions Attempted</span>
                    <span className="font-medium">
                      {attemptDetail.totalQuestions - attemptDetail.skippedAnswers}/{attemptDetail.totalQuestions}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time per Question</span>
                    <span className="font-medium">
                      {Math.round((attemptDetail.duration * 60) / attemptDetail.totalQuestions)}s
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detailed Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{attemptDetail.feedback}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {attemptDetail.score < 70 && (
                    <>
                      <li>• Review the topics where you scored lower</li>
                      <li>• Practice similar questions to improve understanding</li>
                      <li>• Consider retaking the test after additional study</li>
                    </>
                  )}
                  {attemptDetail.score >= 70 && attemptDetail.score < 90 && (
                    <>
                      <li>• Good performance! Focus on areas for minor improvement</li>
                      <li>• Continue practicing to achieve mastery</li>
                    </>
                  )}
                  {attemptDetail.score >= 90 && (
                    <>
                      <li>• Excellent work! You've demonstrated strong mastery</li>
                      <li>• Consider taking advanced tests in this area</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TestResultDetail;