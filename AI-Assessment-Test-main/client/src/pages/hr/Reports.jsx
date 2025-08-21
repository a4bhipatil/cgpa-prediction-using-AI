import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileBarChart,
  Search,
  Users,
  Loader2,
} from "lucide-react";
import { testsAPI } from "@/services/api";
// import { useAuthContext } from "@/context/AuthContext";
const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [testReports, setTestReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch test reports on component mount
  useEffect(() => {
    const fetchTestReports = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔄 Fetching test reports...");
        const startTime = Date.now();
        
        const reports = await testsAPI.getTestReports();
        
        const endTime = Date.now();
        console.log(`✅ Test reports fetched in ${endTime - startTime}ms`);
        console.log(`📊 Received ${reports.length} test reports`);
        
        setTestReports(reports);
      } catch (err) {
        console.error("❌ Error fetching test reports:", err);
        
        // Provide more specific error messages
        let errorMessage = "Failed to fetch test reports";
        if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else if (err.message.includes("fetch")) {
          errorMessage = "Unable to connect to server. Please check if the server is running.";
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTestReports();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTests = testReports.filter((test) =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTests = [...filteredTests].sort((a, b) => {
    if (sortDirection === "asc") {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Refreshing test reports...");
      const startTime = Date.now();
      
      const reports = await testsAPI.getTestReports();
      
      const endTime = Date.now();
      console.log(`✅ Test reports refreshed in ${endTime - startTime}ms`);
      console.log(`📊 Received ${reports.length} test reports`);
      
      setTestReports(reports);
    } catch (err) {
      console.error("❌ Error refreshing test reports:", err);
      
      let errorMessage = "Failed to refresh test reports";
      if (err.message.includes("timeout")) {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (err.message.includes("fetch")) {
        errorMessage = "Unable to connect to server. Please check if the server is running.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRole="hr">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Test Reports</h1>
            <p className="text-muted-foreground">
              View and analyze performance metrics for all your tests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex">
                <div className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Test Name
                      {sortField === "title" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("candidates")}
                  >
                    <div className="flex items-center gap-1">
                      Candidates
                      {sortField === "candidates" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("avgScore")}
                  >
                    <div className="flex items-center gap-1">
                      Avg. Score
                      {sortField === "avgScore" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("passRate")}
                  >
                    <div className="flex items-center gap-1">
                      Pass Rate
                      {sortField === "passRate" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {sortField === "createdAt" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? "No tests found matching your search." : "No test reports available yet."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{test.title}</div>
                          {test.category && (
                            <div className="text-xs text-muted-foreground">{test.category}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {test.completed}/{test.candidates}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            test.avgScore >= 80
                              ? "bg-green-50 text-green-700 border-green-200"
                              : test.avgScore >= 60
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {test.completed > 0 ? `${test.avgScore}%` : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            test.passRate >= 80
                              ? "bg-green-50 text-green-700 border-green-200"
                              : test.passRate >= 60
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {test.completed > 0 ? `${test.passRate}%` : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{test.createdAt}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/hr/test-results/${test.id}`}>
                            <FileBarChart className="mr-2 h-4 w-4" />
                            View Report
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
