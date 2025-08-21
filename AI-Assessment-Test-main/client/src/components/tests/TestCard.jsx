import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  BarChart3,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TestCard({
  id,
  title,
  description,
  category = "Uncategorized",
  status,
  createdDate,
  respondents = 0,
  avgScore,
  onAction,
  viewType = "hr",
  test, // Add test prop to handle test object
}) {
  // If test object is provided, use its properties
  const testData = test || {
    _id: id,
    title,
    description,
    category,
    status,
    createdDate,
    respondents,
    avgScore,
  };

  const testId = testData._id || id;
  const testTitle = testData.title || title;
  const testDescription = testData.description || description;
  const testCategory = testData.category || category || "Uncategorized";
  const testStatus = testData.status || status || "setup";
  const testCreatedDate = testData.createdDate || createdDate || (testData.createdAt ? new Date(testData.createdAt).toLocaleDateString() : "");
  const testRespondents = testData.respondents || respondents;
  const testAvgScore = testData.avgScore || avgScore;
  const questionCount = testData.questions ? testData.questions.length : 20;
  const isPublished = testData.published || false;
  const statusColors = {
    setup: "bg-orange-100 text-orange-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    setup: "SETUP IN PROGRESS",
    active: "ACTIVE",
    completed: "COMPLETED",
    archived: "ARCHIVED",
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(action, testId);
    }
  };

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="p-4 pb-0 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium rounded-md",
              statusColors[testStatus]
            )}
          >
            {statusLabels[testStatus]}
          </Badge>
          <p className="text-xs text-muted-foreground">
            CREATED: {testCreatedDate}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {viewType === "hr" ? (
              <>
                <DropdownMenuItem onClick={() => handleAction("edit")}>
                  Edit test
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("archive")}>
                  Archive
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => handleAction("view-details")}>
                View details
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{testTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {testDescription || "(no description)"}
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs rounded-md">
            {testCategory}
          </Badge>
          {viewType === "hr" && (
            <Badge 
              variant={isPublished ? "default" : "outline"} 
              className={`text-xs rounded-md ${isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
            >
              {isPublished ? "Published" : "Draft"}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-wrap gap-4 text-xs">
        {viewType === "hr" && (
          <>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {testRespondents} {testRespondents === 1 ? "response" : "responses"}
              </span>
            </div>

            {testAvgScore !== undefined && (
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>{testAvgScore}% avg. score</span>
              </div>
            )}
          </>
        )}

        {viewType === "candidate" && (
          <>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{testData.duration || 30} minutes</span>
            </div>
            {testStatus === "completed" && testAvgScore !== undefined && (
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>{testAvgScore}% score</span>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{questionCount} questions</span>
        </div>

        <div className="ml-auto flex gap-2">
          {viewType === "hr" ? (
            <>
              <Button 
                size="sm" 
                variant={isPublished ? "default" : "outline"}
                onClick={() => handleAction("publish")}
              >
                {isPublished ? "Published" : "Publish"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("view-results")}>
                View results
              </Button>
            </>
          ) : testStatus === "completed" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => handleAction("view-results")}>
                View Results
              </Button>
              <Button size="sm" onClick={() => handleAction("retake-test")}>
                Retake Test
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => handleAction("start-test")}>
              Start test
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
