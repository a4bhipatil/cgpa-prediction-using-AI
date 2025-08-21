import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, FileText, AlertCircle, CheckCircle } from "lucide-react";

const TestAccess = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [test, setTest] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestByToken = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching test with token:", token);

      const response = await fetch(`http://localhost:3000/api/tests/by-token/${token}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTest(data.test);
        setAssignment(data.assignment);
        console.log("✅ Test loaded:", data.test.title);
      } else {
        setError(data.error || "Failed to load test");
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load test",
        });
      }
    } catch (error) {
      console.error("❌ Error fetching test:", error);
      setError("Network error occurred");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchTestByToken();
  }, [fetchTestByToken]);

  const handleStartTest = () => {
    if (test) {
      navigate(`/candidate/take-test/${test._id}`, {
        state: { fromInvitation: true, assignmentId: assignment.id }
      });
    }
  };

  const handleLogin = () => {
    navigate("/auth/login", {
      state: { returnTo: `/test/${token}` }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading test...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate("/auth/login")} 
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")} 
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  const isLoggedIn = localStorage.getItem("token");
  const expiresAt = new Date(assignment.expiresAt);
  const isExpired = expiresAt < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-3 h-6 w-6 text-primary" />
            {test.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {test.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{test.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Duration:</strong> {test.duration} minutes
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Questions:</strong> {test.questions?.length || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Passing Score:</strong> {test.passingScore}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Assigned to:</strong> {assignment.candidateEmail}
              </span>
            </div>
          </div>

          {test.enableProctoring && (
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Proctoring Enabled</h4>
                  <p className="text-sm text-yellow-700">
                    This test uses AI-powered proctoring. Your camera and screen will be monitored during the test.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Important Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure you have a stable internet connection</li>
              <li>• Do not refresh or close the browser during the test</li>
              <li>• You have only one attempt to complete this test</li>
              <li>• The test will auto-submit when time expires</li>
              {test.enableProctoring && (
                <li>• Grant camera and microphone permissions when prompted</li>
              )}
            </ul>
          </div>

          {isExpired ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">This test invitation has expired.</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Home
              </Button>
            </div>
          ) : !isLoggedIn ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please log in to start the test
              </p>
              <Button onClick={handleLogin} className="w-full">
                Login to Start Test
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Expires on: {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString()}
              </p>
              <Button onClick={handleStartTest} className="w-full" size="lg">
                Start Test
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAccess;