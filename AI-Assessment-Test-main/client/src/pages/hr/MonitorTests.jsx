import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  AlertCircle,
  UserCheck,
  UserX,
  Eye
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Programming", value: "programming" },
  { label: "Sales", value: "sales" },
  { label: "Customer Service", value: "customer-service" },
  { label: "Data Science", value: "data-science" },
  { label: "Design", value: "design" },
  { label: "Marketing", value: "marketing" },
  { label: "Other", value: "other" },
];

const MonitorTests = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [testName, setTestName] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [allTests, setAllTests] = useState([]); // <-- Store all tests
  const [selectedCategory, setSelectedCategory] = useState(""); // <-- Add category filter

  // Fetch all tests from backend
  const [groupedCandidates, setGroupedCandidates] = useState({
  pending: [],
  active: [],
  completed: [],
});

useEffect(() => {
  const fetchGroupedAssignments = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/tests/assignments/grouped-by-status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch grouped assignments");
      const data = await res.json();
      console.log("✅ Grouped candidates:", data);
      setGroupedCandidates(data);
    } catch (error) {
      console.error("❌ Error fetching grouped assignments:", error);
      toast({ title: "Failed to load candidates", variant: "destructive" });
    }
  };

  fetchGroupedAssignments();
}, [toast]);

  useEffect(() => {
    const fetchAllTests = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/hr/my-tests", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch tests");
        const data = await res.json();
        setAllTests(data || []);
      } catch (error) {
        console.error("❌ Error fetching tests:", error);
        toast({ title: "Failed to load tests", variant: "destructive" });
      }
    };
    fetchAllTests();
  }, [toast]);

  // ✅ Fetch candidates
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/hr/monitor-sessions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch test sessions");

        const data = await res.json();
        console.log("✅ Fetched sessions:", data.sessions);
        setCandidates(data.sessions || []);
      } catch (error) {
        console.error("❌ Error fetching sessions:", error);
        toast({ title: "Failed to load test sessions", variant: "destructive" });
      }
    };

    fetchSessions();
  }, [toast]);

  // Filter tests for active and pending tabs
  const publishedTests = allTests.filter(test => test.published);
  const draftTests = allTests.filter(test => !test.published);

  // Category filter for tests
  const filterByCategory = (test) => {
    if (!selectedCategory) return true;
    return (test.category || "").toLowerCase() === selectedCategory;
  };

  // ✅ Filter candidates
  const filteredCandidates = candidates.filter((candidate) => {
    const searchLower = search.toLowerCase();
    const categoryMatch = !selectedCategory || (candidate.testName && candidate.testName.toLowerCase().includes(selectedCategory));
    return (
      (candidate.name.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower) ||
      (candidate.testName && candidate.testName.toLowerCase().includes(searchLower)))
      && categoryMatch
    );
  });

const filterCandidates = (list) =>
  list.filter(
    (c) =>
      (c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
       c.candidateEmail.toLowerCase().includes(search.toLowerCase()) ||
       c.testTitle.toLowerCase().includes(search.toLowerCase())) &&
      (!selectedCategory || c.testCategory?.toLowerCase() === selectedCategory)
  );

const activeCandidates = filterCandidates(groupedCandidates.active);
const pendingCandidates = filterCandidates(groupedCandidates.pending);
const completedCandidates = filterCandidates(groupedCandidates.completed);


  const handleViewSession = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleFlagViolation = () => {
    toast({
      title: "Violation flagged",
      description:
        "The candidate has been notified about the suspicious behavior.",
    });
  };

  const handleInterveneToChatWithCandidate = () => {
    toast({
      title: "Chat initiated",
      description: "Opening chat with the candidate...",
    });
  };

  const handleSaveTest = () => {
    if (!testName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a test name.",
      });
      return;
    }
    
    toast({
      title: "Test saved",
      description: `Test "${testName}" has been saved successfully.`,
    });
    setTestName("");
  };
  return (
  <DashboardLayout allowedRole="hr">
    <div className="space-y-8">
      {/* 🔥 ADDED: Save Test input and button */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Enter test name"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
        />
        <Button onClick={handleSaveTest}>Save Test</Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Monitor Live Tests
          </h1>
          <p className="text-muted-foreground">
            Track progress and monitor candidate behavior during assessments
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates or tests..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              className={
                selectedCategory === cat.value
                  ? "bg-primary text-white"
                  : "hover:bg-muted/50"
              }
              onClick={() => setSelectedCategory(cat.value)}
              style={{ cursor: "pointer" }}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Tests list (Tabs) */}
        <div className="md:col-span-1 space-y-4">
          <Tabs defaultValue="active">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="active">
                Active ({activeCandidates.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingCandidates.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedCandidates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-4">
              {activeCandidates.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">No active tests</p>
                </div>
              ) : (
                activeCandidates.map((candidate) => (
                  <Card
                    key={candidate._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="font-medium">{candidate.candidateName}</div>
                        <div className="text-sm text-muted-foreground">{candidate.testTitle}</div>
                        <div className="flex items-center mt-1 gap-2">
                          <Badge variant="outline" className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full">
                            Active
                          </Badge>
                          <span className="text-xs ml-2">{candidate.testDuration} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">
                          {candidate.totalQuestions || 0} questions
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingCandidates.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">No pending tests</p>
                </div>
              ) : (
                pendingCandidates.map((candidate) => (
                  <Card key={candidate._id}>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium">{candidate.candidateName}</div>
                        <div className="text-sm text-muted-foreground">{candidate.testTitle}</div>
                        <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          Pending
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {completedCandidates.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">No completed tests</p>
                </div>
              ) : (
                completedCandidates.map((candidate) => (
                  <Card key={candidate._id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="font-medium">{candidate.candidateName}</div>
                        <div className="text-sm text-muted-foreground">{candidate.testTitle}</div>
                        <Badge variant="outline" className="bg-success/10 text-success mt-1">
                          Completed
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Monitoring view */}
        <div className="md:col-span-2">
          {selectedCandidate ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {selectedCandidate.title || selectedCandidate.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.category || selectedCandidate.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedCandidate.violations > 0
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {selectedCandidate.violations} Alert
                      {selectedCandidate.violations !== 1 ? "s" : ""}
                    </Badge>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Full Screen</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Live monitoring preview */}
                <div className="relative rounded-lg bg-black aspect-video overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white text-lg">
                      Live monitoring feed would be displayed here
                    </p>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {selectedCandidate.timeRemaining} remaining
                  </div>
                </div>

                {/* Monitoring controls */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleFlagViolation(selectedCandidate.id)}
                  >
                    Flag Violation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleInterveneToChatWithCandidate(selectedCandidate.id)
                    }
                  >
                    Chat with Candidate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-4 border rounded-md">
              <p className="text-muted-foreground">
                Select a test to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </DashboardLayout>
);
}
export default MonitorTests;
