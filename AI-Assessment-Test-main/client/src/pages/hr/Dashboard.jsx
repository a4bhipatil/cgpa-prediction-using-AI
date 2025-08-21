import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TestCard } from "@/components/tests/TestCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
import { UserSettings } from "@/components/user/UserSettings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/hr/my-tests", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Check if response is valid JSON
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) {
          const text = await res.text();
          console.error("Non-JSON response:", text);
          throw new Error("Unexpected server response. Check the API endpoint.");
        }

        const data = await res.json();
        console.log("📋 Received tests data:", data);
        console.log("📋 First test:", data[0] ? {
          title: data[0].title,
          description: data[0].description,
          category: data[0].category,
          questionsCount: data[0].questions?.length
        } : "No tests");
        setTests(data || []);
      } catch (error) {
        console.error("❌ Failed to fetch tests:", error);
        toast({
          title: "Failed to load tests",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [toast]);

  const handleTestAction = async (action, id) => {
    if (action === "view-results") {
      navigate(`/hr/test/${id}/results`);
    } else if (action === "edit") {
      navigate(`/hr/edit-test/${id}`);
    } else if (action === "publish") {
      try {
        const response = await fetch(`http://localhost:3000/api/hr/toggle-publish/${id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Update the test in the local state
          setTests(prevTests => 
            prevTests.map(test => 
              test._id === id 
                ? { ...test, published: data.test.published }
                : test
            )
          );

          toast({
            title: data.test.published ? "Test Published!" : "Test Unpublished",
            description: data.test.published 
              ? "Test is now visible to candidates" 
              : "Test is no longer visible to candidates",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error || "Failed to update test status",
          });
        }
      } catch (error) {
        console.error("❌ Error toggling publish status:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error occurred",
        });
      }
    } else {
      toast({
        title: "Action triggered",
        description: `${action} action for test ID: ${id}`,
      });
    }
  };

  const totalTests = tests.length;
  const publishedTests = tests.filter((t) => t.published === true).length;
  const draftTests = tests.filter((t) => t.published === false || !t.published).length;
  const violations = tests.filter((t) => t.hasViolation).length;


  return (
    <DashboardLayout allowedRole="hr">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">HR Dashboard</h1>
          <div className="flex items-center gap-2">
            <UserSettings />
            <Button
              onClick={() => navigate("/hr/create-test")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new test
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">My Tests</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardStatCard icon={<FileText className="h-6 w-6 text-primary" />} label="Total Tests" value={totalTests} bg="primary" />
              <DashboardStatCard icon={<CheckCircle className="h-6 w-6 text-success" />} label="Published" value={publishedTests} bg="success" />
              <DashboardStatCard icon={<Clock className="h-6 w-6 text-warning" />} label="Draft" value={draftTests} bg="warning" />
              <DashboardStatCard icon={<AlertCircle className="h-6 w-6 text-destructive" />} label="Violations" value={violations} bg="destructive" />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <ChartPlaceholder title="Recent Test Results" icon={<BarChart3 />} />
              <ChartPlaceholder title="Active Candidates" icon={<Users />} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Recent Tests</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("tests")}
                >
                  View all tests
                </Button>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {tests.slice(0, 2).map((test) => (
                  <TestCard
                    key={test._id}
                    test={test}
                    onAction={handleTestAction}
                    viewType="hr"
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tests">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading tests...</p>
            ) : tests.length === 0 ? (
              <p className="text-center text-muted-foreground">No tests available.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {tests.map((test) => (
                  <TestCard
                    key={test._id}
                    test={test}
                    onAction={handleTestAction}
                    viewType="hr"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="candidates">
            <div className="flex items-center justify-center h-48 border rounded-md bg-white">
              <div className="flex flex-col items-center justify-center text-center p-6">
                <Users className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Candidate management functionality coming soon
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const DashboardStatCard = ({ icon, label, value, bg }) => (
  <div className="dashboard-card flex items-center space-x-4">
    <div className={`bg-${bg}/10 p-3 rounded-full`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const ChartPlaceholder = ({ title, icon }) => (
  <div className="dashboard-card">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-medium">{title}</h3>
      <Button variant="ghost" size="sm">View all</Button>
    </div>
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center justify-center text-center p-6">
        {icon}
        <p className="text-muted-foreground mt-2">Visualization coming soon</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
