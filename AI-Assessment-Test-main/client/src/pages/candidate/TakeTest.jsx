import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Adjusted to named import
import { Progress } from "@/components/ui/progress"; // Adjusted to named import
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Adjusted to named import
import { Checkbox } from "@/components/ui/checkbox"; // Adjusted to named import
import { Textarea } from "@/components/ui/textarea"; // Adjusted to named import
import { Card, CardContent } from "@/components/ui/card"; // Adjusted to named import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Adjusted to named import
import { useToast } from "@/hooks/use-toast";
import {
  Timer,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProctoringScreen } from "@/components/proctoring/ProctoringScreen"; // This one is already correct if it's a default export
import { testAPI } from "@/services/api";
import { useTestSubmission } from "@/hooks/useTests";

// Default test structure for fallback
const defaultTest = {
  id: "default",
  title: "Sample Test",
  questions: [
    {
      id: 1,
      text: "This is a sample question.",
      type: "single-choice",
      options: [
        { id: 1, text: "Option A" },
        { id: 2, text: "Option B" },
        { id: 3, text: "Option C" },
        { id: 4, text: "Option D" },
      ],
      correctAnswer: 1,
    },
  ],
  duration: 30, // minutes
};

const TakeTest = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams();
  const authCheckedRef = useRef(false);
  const { submitTest, submitting } = useTestSubmission();

  const [currentTest, setCurrentTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // default 30 minutes
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showFaceScanInfo, setShowFaceScanInfo] = useState(true);
  const [violations, setViolations] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch test data
  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No test ID provided",
        });
        navigate("/candidate/start-test");
        return;
      }

      try {
        setLoading(true);
        const response = await testAPI.getTestById(testId);
        console.log("🔍 Test response:", response);
        console.log("🔍 Test data:", response.test);
        console.log("🔍 Questions:", response.test.questions);
        
        if (response.test.questions && response.test.questions.length > 0) {
          console.log("🔍 First question:", response.test.questions[0]);
          console.log("🔍 First question options:", response.test.questions[0].options);
        }
        
        // Transform the test data to ensure compatibility
        const transformedTest = {
          ...response.test,
          questions: response.test.questions?.map((question, qIndex) => {
            // Transform options to ensure they have the correct structure
            const transformedOptions = question.options?.map((option, oIndex) => {
              // Handle different option structures
              if (typeof option === 'string') {
                return { id: oIndex + 1, text: option };
              } else if (option && typeof option === 'object') {
                return {
                  id: option.id || oIndex + 1,
                  text: option.text || option.label || `Option ${oIndex + 1}`,
                  isCorrect: option.isCorrect
                };
              }
              return { id: oIndex + 1, text: `Option ${oIndex + 1}` };
            }) || [];
            
            // Normalize question type
            let questionType = question.type;
            if (questionType === 'multiple-choice' || questionType === 'MCQ') {
              questionType = 'single-choice'; // Convert to single-choice for now
            }
            
            return {
              ...question,
              id: question.id || question._id || `q_${qIndex}`,
              type: questionType || 'single-choice',
              options: transformedOptions,
              text: question.text || question.question || `Question ${qIndex + 1}`
            };
          }) || []
        };
        
        console.log("🔧 Transformed test:", transformedTest);
        console.log("🔧 Transformed questions:", transformedTest.questions);
        if (transformedTest.questions.length > 0) {
          console.log("🔧 Transformed first question:", transformedTest.questions[0]);
        }
        
        setCurrentTest(transformedTest);
        setTimeRemaining((response.test.duration || 30) * 60);
      } catch (error) {
        console.error("❌ Error loading test:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load test: ${error.message}`,
        });
        setCurrentTest(defaultTest);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId, navigate, toast]);

  useEffect(() => {
    if (!authCheckedRef.current) {
      const checkAuth = () => {
        setAuthChecked(true);
        authCheckedRef.current = true;
      };

      const timer = setTimeout(checkAuth, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authChecked && !isAuthenticated && !showFaceScanInfo) {
      navigate("/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, navigate, showFaceScanInfo]);

  const currentQuestion = currentTest?.questions?.[currentQuestionIndex];
  
  // Debug logging
  React.useEffect(() => {
    if (currentQuestion) {
      console.log("🎯 Current question:", currentQuestion);
      console.log("🎯 Question type:", currentQuestion.type);
      console.log("🎯 Question options:", currentQuestion.options);
      console.log("🎯 Question text:", currentQuestion.text);
    }
  }, [currentQuestion]);
  
  const progress = currentTest?.questions?.length 
    ? ((currentQuestionIndex + 1) / currentTest.questions.length) * 100 
    : 0;

  const handleSubmitTest = useCallback(async () => {
    if (!currentTest) return;
    
    // Calculate score (basic implementation)
    let score = 0;
    const totalQuestions = currentTest.questions.length;
    
    currentTest.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (question.type === 'single-choice' && userAnswer === question.correctAnswer) {
        score++;
      } else if (question.type === 'multiple-choice' && question.correctAnswers) {
        const userAnswers = userAnswer || [];
        const correctAnswers = question.correctAnswers;
        if (userAnswers.length === correctAnswers.length && 
            userAnswers.every(ans => correctAnswers.includes(ans))) {
          score++;
        }
      }
    });
    
    const finalScore = Math.round((score / totalQuestions) * 100);
    
    const result = await submitTest(currentTest._id || currentTest.id, answers, finalScore);
    
    if (result.success) {
      setIsTestCompleted(true);
    }
  }, [currentTest, answers, submitTest]);

  const handleTimeUp = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Time's up!",
      description: "Your test has been submitted automatically.",
    });
    handleSubmitTest();
  }, [toast, handleSubmitTest]);

  useEffect(() => {
    if (!isTestStarted || isTestCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTestStarted, isTestCompleted, handleTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // client/src/pages/candidate/TakeTest.jsx

const handleStartTest = async () => {
  
  try {
    const response = await fetch(
      `http://localhost:3000/api/tests/${testId}/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      setIsTestStarted(true);
      setShowFaceScanInfo(false);
      toast({
        title: "Test started!",
        description: "Good luck!",
      });
    } else {
      toast({
        title: "Error",
        description: "Could not start the test.",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Failed to start test:", error);
    toast({
      title: "Error",
      description: "An error occurred while starting the test.",
      variant: "destructive",
    });
  }
};

  const handleSingleChoiceAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: parseInt(value),
    }));
  };

  const handleMultipleChoiceAnswer = (optionId, checked) => {
    setAnswers((prev) => {
      const currentAnswers = prev[currentQuestion.id] || [];
      if (checked) {
        return {
          ...prev,
          [currentQuestion.id]: [...currentAnswers, optionId],
        };
      } else {
        return {
          ...prev,
          [currentQuestion.id]: currentAnswers.filter((id) => id !== optionId),
        };
      }
    });
  };

  const handleTextAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNextQuestion = () => {
    if (currentTest && currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowSubmitDialog(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleViolation = (type) => {
    const newViolations = [...violations, type];
    setViolations(newViolations);

    toast({
      variant: "destructive",
      title: "Proctoring Alert",
      description: `A potential violation has been detected: ${type}`,
    });
  };

  if (authChecked && !isAuthenticated && !showFaceScanInfo) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading test...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentTest) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Test not found</p>
            <Button onClick={() => navigate("/candidate/start-test")} className="mt-4">
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTestCompleted) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="bg-success/10 p-4 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Test Completed</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for completing the {currentTest?.title}. Your responses have
              been submitted.
            </p>
            <div className="space-y-4 w-full">
              <Button
                className="w-full"
                onClick={() => {
                  // 🚀 Performance: Set flag for dashboard refresh and navigate
                  localStorage.setItem('testCompleted', 'true');
                  navigate("/candidate/dashboard", { replace: true });
                }}
              >
                Return to Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/candidate/results")}
              >
                View My Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showFaceScanInfo) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h1 className="text-2xl font-bold">{currentTest?.title}</h1>
                <p className="text-muted-foreground">
                  Duration: {currentTest?.duration || 30} minutes | Questions:{" "}
                  {currentTest?.questions?.length || 0}
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-accent rounded-md flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Environment Check Required</p>
                    <p className="text-sm text-muted-foreground">
                      We need to verify your identity and scan your environment
                      before starting the test.
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-md bg-white text-center">
                  <div className="bg-muted w-full h-40 flex items-center justify-center mb-4 rounded-md">
                    <p className="text-muted-foreground">
                      Camera preview would appear here
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please ensure good lighting and that your face is clearly
                    visible.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Before you begin:</p>
                  <ul className="text-sm space-y-1">
                    <li>
                      • Ensure you're in a quiet environment with good lighting
                    </li>
                    <li>• Close all other applications and browsers</li>
                    <li>• Have your ID ready for verification</li>
                    <li>• Ensure your webcam and microphone are working</li>
                    <li>• You will be monitored throughout the test</li>
                  </ul>
                </div>

                <Button className="w-full" onClick={handleStartTest}>
                  Start Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="bg-white border-b py-3 px-4 sticky top-0 z-10">
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="font-semibold">{currentTest?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {currentTest?.questions?.length || 0}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <span
              className={`font-medium ${
                timeRemaining < 300 ? "text-destructive" : ""
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </header>

      <div className="container py-2">
        <Progress value={progress} />
      </div>

      <div className="container flex-1 py-4 md:py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1}
                </p>
                <h2 className="text-xl font-medium">{currentQuestion?.text}</h2>
              </div>

              {currentQuestion?.type === "single-choice" && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString() || ""}
                  onValueChange={handleSingleChoiceAnswer}
                  className="space-y-3"
                >
                  {(() => {
                    console.log("🎯 Rendering single-choice options:", currentQuestion.options);
                    return currentQuestion.options?.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option.id.toString()}
                        id={`option-${option.id}`}
                      />
                      <label
                        htmlFor={`option-${option.id}`}
                        className="text-base cursor-pointer w-full"
                      >
                        {option.text}
                      </label>
                    </div>
                  ));
                  })()}
                </RadioGroup>
              )}

              {currentQuestion?.type === "multiple-choice" && (
                <div className="space-y-3">
                  {(() => {
                    console.log("🎯 Rendering multiple-choice options:", currentQuestion.options);
                    return currentQuestion.options?.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`option-${option.id}`}
                        checked={(answers[currentQuestion.id] || []).includes(
                          option.id
                        )}
                        onCheckedChange={(checked) =>
                          handleMultipleChoiceAnswer(option.id, !!checked)
                        }
                      />
                      <label
                        htmlFor={`option-${option.id}`}
                        className="text-base cursor-pointer w-full"
                      >
                        {option.text}
                      </label>
                    </div>
                  ));
                  })()}
                </div>
              )}

              {currentQuestion?.type === "text" && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleTextAnswer(e.target.value)}
                  rows={6}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="bg-white border-t py-4 sticky bottom-0">
        <div className="container flex justify-between">
          <Button variant="outline" onClick={() => setShowExitDialog(true)}>
            Exit Test
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleNextQuestion} disabled={submitting}>
              {currentTest && currentQuestionIndex < currentTest.questions.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                submitting ? "Submitting..." : "Submit Test"
              )}
            </Button>
          </div>
        </div>
      </footer>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit this test? Your progress will be
              lost and you may not be able to retake the test.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/candidate/dashboard")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your test? Once submitted, you
              cannot modify your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitTest} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isTestStarted && !isTestCompleted && (
        <ProctoringScreen
          onViolation={handleViolation}
          testTimeMinutes={currentTest?.duration || 30}
        />
      )}
    </div>
  );
};

export default TakeTest;
