import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  SendHorizonal,
  Clock,
  Sparkles,
  Pencil,
} from "lucide-react";
import { AIQuizGenerator } from "@/components/quiz/AIQuizGenerator";

const CreateTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [creationMethod, setCreationMethod] = useState(null);
  const [testDetails, setTestDetails] = useState({
    title: "",
    description: "",
    category: "",
    duration: 30,
    passingScore: 70,
    questionCount: 20,
    accessType: "invited",
    enableProctoring: true,
  });
  const [titleError, setTitleError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [candidateEmails, setCandidateEmails] = useState("");
  const [savedTestId, setSavedTestId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestDetails((prev) => ({ ...prev, [name]: value }));
    if (name === "title") {
      setTitleError(null);
    }
  };

  const handleSelectChange = (name, value) => {
    setTestDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (name, value) => {
    setTestDetails((prev) => ({ ...prev, [name]: value[0] }));
  };

  const handleToggleChange = (name, value) => {
    setTestDetails((prev) => ({ ...prev, [name]: value }));
  };

  const generateUniqueId = (() => {
    let counter = 0;
    return () => {
      counter++;
      return Date.now() + counter;
    };
  })();

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateUniqueId(),
        text: "",
        type: "multiple-choice",
        options: [
          { id: 1, text: "", isCorrect: false },
          { id: 2, text: "", isCorrect: false },
          { id: 3, text: "", isCorrect: false },
          { id: 4, text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id, data) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data } : q))
    );
  };

  const addOption = (questionId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [
              ...q.options,
              { id: q.options.length + 1, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      })
    );
  };

  const removeOption = (questionId, optionId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter((o) => o.id !== optionId),
          };
        }
        return q;
      })
    );
  };

  const updateOption = (questionId, optionId, data) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((o) =>
              o.id === optionId ? { ...o, ...data } : o
            ),
          };
        }
        return q;
      })
    );
  };

  const handleNextStep = () => {
    if (step === 0) {
      if (!creationMethod) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please select a creation method.",
        });
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!testDetails.title.trim()) {
        setTitleError("Please provide a test title.");
        return;
      }
    }

    if (step < (creationMethod === "ai" ? 4 : 3)) {
      setStep(step + 1);
    } else {
      handleSaveTest();
    }
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

const handleSaveTest = async () => {
  try {
    setIsSaving(true); // 🚀 Performance: Show loading state
    const startTime = Date.now();
    console.log("💾 Saving test with details:", testDetails);
    console.log("💾 Questions count:", questions.length);
    console.log("🔑 Token:", localStorage.getItem("token") ? "Token exists" : "No token found");

    // 🚀 Performance: Optimize data structure and remove unnecessary fields
    const cleanedQuestions = questions
      .filter((q) => q.text && q.text.trim() !== "")
      .map((q, index) => ({
        id: q.id || `q_${index}`,
        text: q.text.trim(),
        type: q.type || "multiple-choice",
        options: q.options
          .filter((o) => o.text && o.text.trim() !== "")
          .map((o, optIndex) => ({
            id: o.id || optIndex + 1,
            text: o.text.trim(),
            isCorrect: Boolean(o.isCorrect)
          })),
        explanation: q.explanation?.trim() || ""
      }));

    // 🚀 Performance: Send only essential data
    const testData = {
      title: testDetails.title?.trim(),
      description: testDetails.description?.trim() || "",
      category: testDetails.category?.trim() || "General",
      duration: testDetails.duration || 30,
      passingScore: testDetails.passingScore || 70,
      questionCount: cleanedQuestions.length,
      accessType: testDetails.accessType || "invited",
      enableProctoring: Boolean(testDetails.enableProctoring),
      questions: cleanedQuestions,
    };
    
    // 🚀 Performance: Log payload size
    const payloadSize = JSON.stringify(testData).length;
    console.log(`💾 Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);
    console.log("🌐 Making request to: http://localhost:3000/api/hr/create-test");

    // 🚀 Performance: Add timeout and optimized request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("http://localhost:3000/api/hr/create-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(testData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Request completed in ${responseTime}ms`);

    let data = {};
    if (response.ok) {
      data = await response.json();
      setSavedTestId(data.test._id); // Store the test ID for assignment
      
      // 🚀 Performance: Show success with timing info
      const message = data.processingTime 
        ? `Test created in ${data.processingTime}` 
        : "Test created successfully";
      
      toast({
        title: "Test saved",
        description: message,
      });
      
      console.log(`✅ Test saved successfully: ${data.test._id}`);
      
      // Don't navigate immediately if we're in the final step and need to assign
      if (step < (creationMethod === "ai" ? 4 : 3)) {
        navigate("/hr/dashboard");
      }
    } else {
      try {
        data = await response.json();
      } catch {
        data = { error: "Unexpected server response. Check the API endpoint." };
      }
      toast({
        variant: "destructive",
        title: "Failed to save test",
        description: data.error || "Something went wrong",
      });
    }
  } catch (error) {
    console.error("❌ Error creating test:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    let errorMessage = "Network or server error occurred";
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out after 30 seconds. Try reducing the number of questions or simplifying the test content.";
    } else if (error.message.includes("Failed to fetch")) {
      errorMessage = "Cannot connect to server. Please check if the server is running on http://localhost:3000";
    } else if (error.message.includes("413")) {
      errorMessage = "Test data is too large. Try reducing the number of questions or shortening question text.";
    }
    
    toast({
      variant: "destructive",
      title: "Error",
      description: errorMessage,
    });
  } finally {
    setIsSaving(false); // 🚀 Performance: Hide loading state
  }
};


  const handleSendInvitations = async () => {
    if (!candidateEmails.trim()) {
      toast({
        variant: "destructive",
        title: "Missing emails",
        description: "Please enter at least one candidate email address.",
      });
      return;
    }

    if (!savedTestId) {
      toast({
        variant: "destructive",
        title: "Test not saved",
        description: "Please save the test first before sending invitations.",
      });
      return;
    }

    try {
      // Parse emails from textarea
      const emailList = candidateEmails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      console.log("📧 Sending invitations to:", emailList);

      const response = await fetch("http://localhost:3000/api/hr/assign-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          testId: savedTestId,
          candidateEmails: emailList,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Invitations sent successfully!",
          description: `Test "${data.testTitle}" has been assigned to ${data.assignments.length} candidate(s).`,
        });

        // Show assignment details
        if (data.assignments.length > 0) {
          console.log("✅ Assignment details:", data.assignments);
          // You could show a modal with access links here
        }

        if (data.errors && data.errors.length > 0) {
          console.warn("⚠️ Some assignments failed:", data.errors);
          toast({
            variant: "destructive",
            title: "Some invitations failed",
            description: `${data.errors.length} email(s) could not be processed. Check console for details.`,
          });
        }

        // Navigate to dashboard after successful assignment
        setTimeout(() => navigate("/hr/dashboard"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send invitations",
          description: data.error || "Something went wrong",
        });
      }
    } catch (error) {
      console.error("❌ Error sending invitations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error occurred while sending invitations",
      });
    }
  };

  const handleAddAIQuestions = (aiQuestions) => {
    setQuestions(aiQuestions);
    setStep(3); // Move to review step for AI method
    toast({
      title: "Questions generated",
      description:
        "AI has generated questions based on your specifications. Please review them.",
    });
  };

  const handleSettingsUpdated = (updatedSettings) => {
    console.log("📝 Settings updated from AI:", updatedSettings);
    setTestDetails((prev) => {
      const newDetails = { ...prev, ...updatedSettings };
      console.log("📝 New test details:", newDetails);
      return newDetails;
    });
  };
  
return (
    <DashboardLayout allowedRole="hr">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Test
            </h1>
            <p className="text-muted-foreground">
              Design your custom assessment in{" "}
              {creationMethod === "ai" ? "4" : "3"} easy steps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/hr/dashboard")}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSaveTest}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between mb-2">
            {step === 0 && (
              <>
                <span className="text-sm font-medium text-primary">
                  Choose Method
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Test Details
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Questions
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Review & Assign
                </span>
              </>
            )}
            {step > 0 && (
              <>
                <span
                  className={`text-sm font-medium ${
                    step >= 1 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Test Details
                </span>
                {creationMethod === "ai" && (
                  <span
                    className={`text-sm font-medium ${
                      step >= 2 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    AI Generation
                  </span>
                )}
                <span
                  className={`text-sm font-medium ${
                    step >= (creationMethod === "ai" ? 3 : 2)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {creationMethod === "ai"
                    ? "Review Questions"
                    : "Add Questions"}
                </span>
                <span
                  className={`text-sm font-medium ${
                    step >= (creationMethod === "ai" ? 4 : 3)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Review & Assign
                </span>
              </>
            )}
          </div>
          <div className="overflow-hidden rounded-full bg-secondary h-2">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(step / (creationMethod === "ai" ? 4 : 3)) * 100}%`,
              }}
            />
          </div>
        </div>


        {/* Step 0: Choose Creation Method */}
         {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className={`cursor-pointer transition-all hover:border-primary ${
                creationMethod === "ai" ? "border-primary border-2" : ""
              }`}
              onClick={() => setCreationMethod("ai")}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  AI-Generated Quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Let AI create quiz questions based on your specifications.
                  Simply provide the topic, difficulty level, and number of
                  questions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Fast quiz creation with AI assistance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Diverse question types automatically generated</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Review and edit questions before finalizing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:border-primary ${
                creationMethod === "manual" ? "border-primary border-2" : ""
              }`}
              onClick={() => setCreationMethod("manual")}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pencil className="h-5 w-5 mr-2 text-primary" />
                  Manual Quiz Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Create quiz questions manually with complete control over each
                  question and answer option.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>
                      Full control over question content and structure
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Create custom question formats</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>
                      Perfect for specialized or technical assessments
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}



        {/* Step 1: Test Details */}
    {step === 1 && (
  <div className="space-y-6">
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Test Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Test Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            value={testDetails.title}
            onChange={handleInputChange}
            placeholder="e.g., Programming Skills Assessment"
            className={titleError ? "border-red-500" : ""}
          />
          {titleError && (
            <p className="text-red-500 text-sm">{titleError}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={testDetails.description}
            onChange={handleInputChange}
            placeholder="Describe what this test measures and who it's for"
            rows={3}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={testDetails.category}
            onValueChange={(value) => handleSelectChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programming">Programming</SelectItem>
              <SelectItem value="customer-service">Customer Service</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="data-science">Data Science</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-4">
          <Label>Test Duration (minutes)</Label>
          <div className="space-y-2">
            <Slider
              defaultValue={[testDetails.duration]}
              min={5}
              max={120}
              step={5}
              onValueChange={(value) =>
                handleSliderChange("duration", value)
              }
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>5 min</span>
              <span className="font-medium text-foreground">
                {testDetails.duration} min
              </span>
              <span>120 min</span>
            </div>
          </div>
        </div>

        {/* Passing Score */}
        <div className="space-y-4">
          <Label>Passing Score (%)</Label>
          <div className="space-y-2">
            <Slider
              defaultValue={[testDetails.passingScore]}
              min={50}
              max={100}
              step={5}
              onValueChange={(value) =>
                handleSliderChange("passingScore", value)
              }
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>50%</span>
              <span className="font-medium text-foreground">
                {testDetails.passingScore}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-4">
          <Label>Number of Questions</Label>
          <div className="space-y-2">
            <Slider
              defaultValue={[testDetails.questionCount]}
              min={5}
              max={50}
              step={5}
              onValueChange={(value) =>
                handleSliderChange("questionCount", value)
              }
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>5</span>
              <span className="font-medium text-foreground">
                {testDetails.questionCount}
              </span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Access Type */}
        <div className="space-y-4">
          <Label>Access Type</Label>
          <RadioGroup
            defaultValue={testDetails.accessType}
            onValueChange={(value) =>
              handleSelectChange("accessType", value)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="invited" id="invited" />
              <Label htmlFor="invited">
                Invitation only (send email invitations)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">
                Public link (anyone with the link can access)
              </Label>
            </div>
          </RadioGroup>
        </div>



                {/* New proctoring option */}
             <div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox
      id="enableProctoring"
      checked={testDetails.enableProctoring}
      onCheckedChange={(checked) =>
        handleToggleChange("enableProctoring", checked === true)
      }
    />
    <div className="grid gap-1.5">
      <Label htmlFor="enableProctoring">
        Enable AI-powered proctoring
      </Label>
      <p className="text-sm text-muted-foreground">
        Monitor candidates during the test with camera and
        screen tracking to prevent cheating
      </p>
    </div>
  </div>
</div>
</CardContent>
</Card>
</div>
)}
  {/* Step 2: AI Question Generation (for AI method only) */}
        {step === 2 && creationMethod === "ai" && (
          <div className="space-y-6">
            <AIQuizGenerator
              testDetails={testDetails}
              onQuestionsGenerated={handleAddAIQuestions}
              onSettingsUpdated={handleSettingsUpdated}
            />
          </div>
        )}
       {/* Step 2/3: Add/Review Questions */}
{((step === 2 && creationMethod === "manual") ||
  (step === 3 && creationMethod === "ai")) && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">
        {creationMethod === "ai" ? "Review Questions" : "Questions"} (
        {questions.length}/{questions.length})
      </h2>
      <Button onClick={addQuestion}>
        <Plus className="mr-2 h-4 w-4" />
        {creationMethod === "ai" ? "Add Question" : "Add Question"}
      </Button>
    </div>

    {questions.length === 0 ? (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <div className="bg-muted rounded-full p-3 mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            No questions added yet
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {creationMethod === "ai"
              ? "Generate questions using AI or add them manually."
              : "Start adding questions to create your test."}
            You can add many questions.
          </p>
          <Button onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first question
          </Button>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id || index} className="relative">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  Question {index + 1}: {question.text}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Remove question</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`question-${question.id}`}>
                  Question Text
                </Label>
                <Textarea
                  id={`question-${question.id}`}
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      text: e.target.value,
                    })
                  }
                  placeholder="Enter your question here"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) =>
                    updateQuestion(question.id, { type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">
                      Multiple Choice
                    </SelectItem>
                    <SelectItem value="single-choice">
                      Single Choice
                    </SelectItem>
                    <SelectItem value="text">Text Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(question.type === "multiple-choice" ||
                question.type === "single-choice") && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Answer Options</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      disabled={question.options.length >= 6}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={`${question.id}-option-${optionIndex}`}
                        className="flex items-center gap-2"
                      >
                        {question.type === "multiple-choice" ? (
                          <Checkbox
                            checked={option.isCorrect}
                            onCheckedChange={(checked) =>
                              updateOption(question.id, option.id, {
                                isCorrect: !!checked,
                              })
                            }
                            id={`option-${question.id}-${option.id}`}
                          />
                        ) : (
                          <RadioGroup
                            value={
                              (
                                question?.options?.find((o) => o?.isCorrect)
                                  ?.id ?? ""
                              ).toString()
                            }
                            onValueChange={(value) => {
                              question?.options?.forEach((o) => {
                                updateOption(question.id, o.id, {
                                  isCorrect: o.id?.toString() === value,
                                });
                              });
                            }}
                          >
                            <RadioGroupItem
                              value={option.id.toString()}
                              id={`option-${index}`}
                            />
                          </RadioGroup>
                        )}

                        <div className="flex-1">
                          <Input
                            value={option.text}
                            onChange={(e) =>
                              updateOption(question.id, option.id, {
                                text: e.target.value,
                              })
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeOption(question.id, option.id)
                          }
                          disabled={question.options.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.type === "text" && (
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Text answer questions will need to be manually
                    reviewed after submission.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
                ))}
              </div>
            )}






  {questions.length > 0 && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add another question
                </Button>
              </div>
            )}
          </div>
        )}
       
    {/* Step 3/4: Summary & Assignment */}
    {((step === 3 && creationMethod === "manual") ||
      (step === 4 && creationMethod === "ai")) && (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Test Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium">
                    {testDetails.title || "Untitled Test"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {testDetails.category || "Uncategorized"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {testDetails.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Passing Score</p>
                  <p className="font-medium">
                    {testDetails.passingScore}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Questions</p>
                  <p className="font-medium">{questions.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Access Type</p>
                  <p className="font-medium">
                    {testDetails.accessType === "invited"
                      ? "Invitation only"
                      : "Public link"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proctoring</p>
                  <p className="font-medium">
                    {testDetails.enableProctoring
                      ? "AI-Powered Proctoring Enabled"
                      : "No Proctoring"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Creation Method</p>
                  <p className="font-medium">
                    {creationMethod === "ai"
                      ? "AI-Generated"
                      : "Manual Creation"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Assign Test</h2>
              {testDetails.accessType === "invited" ? (
                <div className="space-y-4">
                  <Label htmlFor="emails">Candidate Emails</Label>
                  <Textarea
                    id="emails"
                    placeholder="Enter email addresses separated by commas or new lines&#10;Example:&#10;john@example.com&#10;jane@example.com, bob@example.com"
                    rows={4}
                    value={candidateEmails}
                    onChange={(e) => setCandidateEmails(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendInvitations}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <SendHorizonal className="mr-2 h-4 w-4" />
                      Send Invitations
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Anyone with the link below can access this test.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value="https://skillprove.com/t/abc123"
                    />
                    <Button variant="outline">Copy</Button>
                  </div>
                </div>
              )}
            </div>

            {testDetails.enableProctoring && (
              <div className="border rounded-lg p-4 bg-primary/5">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">
                      AI-Powered Proctoring Enabled
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Candidates will be monitored via camera and screen
                      tracking during the test. AI will detect suspicious
                      activities and flag them for review.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )}

    {/* Navigation buttons */}
    <div className="flex justify-between pt-4">
      <Button
        variant="outline"
        onClick={handlePreviousStep}
        disabled={step === 0}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>

      <Button
        onClick={handleNextStep}
        disabled={
          (step === (creationMethod === "ai" ? 3 : 2) && questions.length === 0) || isSaving
        }
      >
        {step < (creationMethod === "ai" ? 4 : 3) ? (
          <>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </>
        ) : isSaving ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
            Saving Test...
          </>
        ) : (
          "Finish & Save Test"
        )}
      </Button>
    </div>
  </div>
    </DashboardLayout>
  );
};


export default CreateTest;
