import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";

export const LocalStorageDebug = () => {
  const [localStorageData, setLocalStorageData] = useState({});
  const [showValues, setShowValues] = useState(false);

  const refreshData = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = localStorage.getItem(key);
        data[key] = {
          value: value,
          size: new Blob([value]).size,
          isJSON: (() => {
            try {
              JSON.parse(value);
              return true;
            } catch {
              return false;
            }
          })()
        };
      } catch (error) {
        data[key] = {
          value: "Error reading value",
          size: 0,
          isJSON: false,
          error: error.message
        };
      }
    }
    setLocalStorageData(data);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const clearLocalStorage = () => {
    if (window.confirm("Are you sure you want to clear all localStorage data? This action cannot be undone.")) {
      localStorage.clear();
      refreshData();
    }
  };

  const removeItem = (key) => {
    if (window.confirm(`Are you sure you want to remove "${key}" from localStorage?`)) {
      localStorage.removeItem(key);
      refreshData();
    }
  };

  const formatValue = (value, isJSON) => {
    if (!showValues) return "***";
    
    if (isJSON) {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              LocalStorage Debug
              <Badge variant="secondary">{Object.keys(localStorageData).length} items</Badge>
            </CardTitle>
            <CardDescription>
              View and manage localStorage data for debugging purposes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValues(!showValues)}
            >
              {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showValues ? "Hide" : "Show"} Values
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearLocalStorage}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(localStorageData).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No localStorage data found
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(localStorageData).map(([key, data]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key}</span>
                    {data.isJSON && <Badge variant="outline">JSON</Badge>}
                    <Badge variant="secondary">{formatSize(data.size)}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(key)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {data.error ? (
                  <div className="text-red-500 text-sm">Error: {data.error}</div>
                ) : (
                  <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">
                    {formatValue(data.value, data.isJSON)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};