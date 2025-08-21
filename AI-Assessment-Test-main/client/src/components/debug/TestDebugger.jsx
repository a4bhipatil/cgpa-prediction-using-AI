import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Database, Server, AlertTriangle, CheckCircle } from "lucide-react";
import { testsAPI } from "@/services/api";

const TestDebugger = () => {
  const [debugData, setDebugData] = useState({
    apiTests: [],
    localTests: [],
    apiError: null,
    localError: null,
    lastRefresh: null,
    apiStats: null,
    connectionStatus: "unknown"
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshDebugData = async () => {
    setIsLoading(true);
    const newDebugData = {
      apiTests: [],
      localTests: [],
      apiError: null,
      localError: null,
      lastRefresh: new Date(),
      apiStats: null,
      connectionStatus: "unknown"
    };

    // Test API connection and fetch data
    try {
      const response = await testsAPI.getHRTests();
      newDebugData.apiTests = response.tests || [];
      newDebugData.connectionStatus = "connected";
      
      // Try to get stats as well
      try {
        const statsResponse = await testsAPI.getHRStats();
        newDebugData.apiStats = statsResponse.stats || null;
      } catch (statsError) {
        console.warn("Failed to fetch stats:", statsError);
      }
    } catch (error) {
      newDebugData.apiError = error.message;
      newDebugData.connectionStatus = "error";
    }

    // Get localStorage data
    try {
      const localTests = JSON.parse(localStorage.getItem('hrTests') || '[]');
      newDebugData.localTests = Array.isArray(localTests) ? localTests : [];
    } catch (error) {
      newDebugData.localError = error.message;
    }

    setDebugData(newDebugData);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshDebugData();
  }, []);

  const clearLocalTests = () => {
    if (window.confirm("Are you sure you want to clear all local test data?")) {
      localStorage.removeItem('hrTests');
      refreshDebugData();
    }
  };

  const addSampleTest = () => {
    const sampleTest = {
      id: `sample-${Date.now()}`,
      title: "Sample Debug Test",
      description: "This is a test created by the debugger",
      category: "Debug",
      status: "setup",
      createdDate: new Date().toISOString().split('T')[0],
      respondents: 0,
      questions: []
    };

    const existingTests = JSON.parse(localStorage.getItem('hrTests') || '[]');
    existingTests.push(sampleTest);
    localStorage.setItem('hrTests', JSON.stringify(existingTests));
    refreshDebugData();
  };

  const ConnectionStatus = () => {
    const getStatusColor = () => {
      switch (debugData.connectionStatus) {
        case "connected": return "text-green-600";
        case "error": return "text-red-600";
        default: return "text-yellow-600";
      }
    };

    const getStatusIcon = () => {
      switch (debugData.connectionStatus) {
        case "connected": return <CheckCircle className="h-4 w-4" />;
        case "error": return <AlertTriangle className="h-4 w-4" />;
        default: return <RefreshCw className="h-4 w-4" />;
      }
    };

    return (
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="capitalize">{debugData.connectionStatus}</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Test Debugger
              <Badge variant="outline">
                API: {debugData.apiTests.length} | Local: {debugData.localTests.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Debug test data from API and localStorage
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDebugData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api">API Data</TabsTrigger>
            <TabsTrigger value="local">Local Data</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4" />
                  <span className="font-medium">API Status</span>
                </div>
                <div className="text-2xl font-bold">
                  {debugData.connectionStatus === "connected" ? "Connected" : "Error"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {debugData.apiTests.length} tests from API
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Local Storage</span>
                </div>
                <div className="text-2xl font-bold">{debugData.localTests.length}</div>
                <div className="text-sm text-muted-foreground">
                  tests in localStorage
                </div>
              </div>
            </div>

            {debugData.lastRefresh && (
              <div className="text-xs text-muted-foreground">
                Last refreshed: {debugData.lastRefresh.toLocaleTimeString()}
              </div>
            )}

            {(debugData.apiError || debugData.localError) && (
              <div className="space-y-2">
                {debugData.apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-800">API Error:</div>
                    <div className="text-red-600 text-sm">{debugData.apiError}</div>
                  </div>
                )}
                {debugData.localError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="font-medium text-yellow-800">LocalStorage Error:</div>
                    <div className="text-yellow-600 text-sm">{debugData.localError}</div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">API Tests ({debugData.apiTests.length})</h3>
              {debugData.apiStats && (
                <Badge variant="outline">
                  Stats: {JSON.stringify(debugData.apiStats)}
                </Badge>
              )}
            </div>
            {debugData.apiTests.length > 0 ? (
              <div className="space-y-2">
                {debugData.apiTests.map((test, index) => (
                  <div key={test.id || index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{test.title || "Untitled"}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {test.id} | Status: {test.status}
                        </div>
                      </div>
                      <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No API tests found
              </div>
            )}
          </TabsContent>

          <TabsContent value="local" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Local Tests ({debugData.localTests.length})</h3>
              <Button variant="outline" size="sm" onClick={clearLocalTests}>
                Clear Local Data
              </Button>
            </div>
            {debugData.localTests.length > 0 ? (
              <div className="space-y-2">
                {debugData.localTests.map((test, index) => (
                  <div key={test.id || index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{test.title || "Untitled"}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {test.id} | Status: {test.status}
                        </div>
                      </div>
                      <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No local tests found
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Test Actions</h4>
                <div className="space-y-2">
                  <Button onClick={addSampleTest} className="w-full">
                    Add Sample Test to LocalStorage
                  </Button>
                  <Button variant="outline" onClick={clearLocalTests} className="w-full">
                    Clear All Local Tests
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Debug Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" onClick={refreshDebugData} className="w-full">
                    Force Refresh All Data
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => console.log("Debug Data:", debugData)} 
                    className="w-full"
                  >
                    Log Debug Data to Console
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TestDebugger;