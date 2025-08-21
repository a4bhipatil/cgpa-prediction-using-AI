import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download, Eye, Search, Loader2 } from "lucide-react";
import { testsAPI } from "@/services/api";
//
export function CandidatePerformanceTable({ testId }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const fetchCandidateResults = async () => {
      if (!testId) {
        console.log("❌ CandidatePerformanceTable: No testId provided");
        return;
      }
      
      try {
        setLoading(true);
        console.log("🔄 CandidatePerformanceTable: Fetching test results for testId:", testId);
        const data = await testsAPI.getTestResults(testId);
        console.log("✅ CandidatePerformanceTable: Received data:", data);
        console.log("📊 CandidatePerformanceTable: Results array:", data.results);
        console.log("📊 CandidatePerformanceTable: Results length:", data.results?.length);
        
        // Check if results exist
        if (!data.results || !Array.isArray(data.results)) {
          console.error("❌ CandidatePerformanceTable: No results array found in data");
          setCandidates([]);
          setError("No candidate data found");
          return;
        }
        
        // Transform the API data to match our component structure
        const transformedCandidates = data.results.map(result => {
          console.log("🔄 Transforming result:", result);
          return {
            id: result.assignmentId,
            name: result.candidateName,
            email: result.candidateEmail,
            score: result.score,
            timeTaken: result.duration ? Math.round(result.duration / 60) : null, // Convert to minutes
            submittedAt: result.submittedAt,
            status: result.status,
            passed: result.passed
          };
        });
        
        console.log("✅ CandidatePerformanceTable: Transformed candidates:", transformedCandidates);
        setCandidates(transformedCandidates);
        setError(null);
        

      } catch (err) {
        console.error("Error fetching candidate results:", err);
        
        // Show a more helpful error message for timeouts
        let errorMessage = err.message || "Failed to fetch candidate results";
        if (err.message && err.message.includes("timeout")) {
          errorMessage = "The request is taking longer than expected. This might be due to a large amount of data. Please wait a moment and try refreshing the page.";
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateResults();
  }, [testId]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle special cases for sorting
    if (sortField === "name") {
      aValue = a.name;
      bValue = b.name;
    }
    
    // Handle null values
    if (aValue === null || aValue === undefined) aValue = "";
    if (bValue === null || bValue === undefined) bValue = "";
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Debug: Log the candidates being rendered
  console.log("🔍 CandidatePerformanceTable: Rendering with candidates:", candidates);
  console.log("🔍 CandidatePerformanceTable: Filtered candidates:", filteredCandidates);
  console.log("🔍 CandidatePerformanceTable: Sorted candidates:", sortedCandidates);

  const formatDate = (dateString) => {
    if (!dateString) return "Not submitted";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const getStatusBadge = (candidate) => {
    if (candidate.status === "completed") {
      return candidate.passed ? "passed" : "failed";
    }
    return candidate.status;
  };

  const getStatusColor = (candidate) => {
    const status = getStatusBadge(candidate);
    switch (status) {
      case "passed":
        return "bg-green-50 text-green-700 border-green-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "started":
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading candidate results...</span>
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button variant="outline" size="sm" disabled={candidates.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("candidateName")}
              >
                <div className="flex items-center gap-1">
                  Candidate
                  {sortField === "candidateName" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("score")}
              >
                <div className="flex items-center gap-1">
                  Score
                  {sortField === "score" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("timeTaken")}
              >
                <div className="flex items-center gap-1">
                  Time Taken
                  {sortField === "timeTaken" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("submittedAt")}
              >
                <div className="flex items-center gap-1">
                  Submitted
                  {sortField === "submittedAt" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === "status" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.length > 0 ? (
              sortedCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="font-medium">{candidate.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {candidate.score !== null ? `${candidate.score}%` : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {candidate.timeTaken ? `${candidate.timeTaken} mins` : "N/A"}
                  </TableCell>
                  <TableCell>{formatDate(candidate.submittedAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(candidate)}
                    >
                      {getStatusBadge(candidate).charAt(0).toUpperCase() + getStatusBadge(candidate).slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" disabled={candidate.status !== "completed"}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-muted-foreground"
                >
                  {searchQuery ? "No candidates found matching your search." : "No candidate results available yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
