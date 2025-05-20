"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { BarChart2, Clock, Phone, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ContactList from "./contactList";
import UploadCSV from "./UploadCSV";

// Colors for charts
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  primaryLight: "hsla(var(--primary), 0.5)",
  secondary: "#10b981",
  secondaryLight: "rgba(16, 185, 129, 0.5)",
  error: "#ef4444",
  errorLight: "rgba(239, 68, 68, 0.5)",
  warning: "#f59e0b",
  warningLight: "rgba(245, 158, 11, 0.5)",
  success: "#10b981",
  successLight: "rgba(16, 185, 129, 0.5)",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",
};

// Status colors
const STATUS_COLORS = {
  scheduled: CHART_COLORS.warning,
  "in-progress": CHART_COLORS.primary,
  completed: CHART_COLORS.success,
  failed: CHART_COLORS.error,
};

// Direction colors
const DIRECTION_COLORS = {
  inbound: CHART_COLORS.primary,
  outbound: CHART_COLORS.secondary,
};

// Qualification colors
const QUALIFICATION_COLORS = {
  Positive: CHART_COLORS.success,
  Negative: CHART_COLORS.error,
  Neutral: CHART_COLORS.warning,
  Unknown: CHART_COLORS.muted,
};

// Disconnection reason colors
const DISCONNECTION_COLORS = {
  agent_hangup: CHART_COLORS.error,
  customer_hangup: CHART_COLORS.warning,
  system_error: CHART_COLORS.primary,
  other: CHART_COLORS.muted,
};

export default function AICallsPage() {
  const [selectedCall, setSelectedCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Fetch stats from the API when the component mounts
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/calls/dashboard/stats", { withCredentials: true });
      setStats(response.data);
      toast.success("Dashboard stats loaded successfully");
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err.response?.data?.error || "Failed to fetch dashboard stats");
      toast.error(err.response?.data?.error || "Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Function to Call All Contacts
  const handleCallAll = async () => {
    try {
      setLoading(true);
      toast.loading("Initiating calls...", { id: "callAll" });
      const response = await axios.post("/api/calls", {}, { withCredentials: true });
      const { message, successfulCalls, failedCalls } = response.data;
      toast.success(`${message}\nSuccessful: ${successfulCalls}\nFailed: ${failedCalls}`, { id: "callAll" });
      await fetchStats();
    } catch (error) {
      console.error("Error starting calls:", error);
      toast.error(`Failed to start calls: ${error.response?.data?.error || error.message}`, { id: "callAll" });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
            <div className="text-red-500">Error: {error}</div>
            {error === "Not authenticated" && (
              <div>
                <a href="/login" className="text-blue-500 underline">
                  Please log in to view the dashboard.
                </a>
              </div>
            )}
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Aggregate data from recentCalls
  const getDirectionData = () => {
    if (!stats || !stats.recentCalls) return [{ name: "Outbound", value: 0 }, { name: "Inbound", value: 0 }];
    const directionCount = stats.recentCalls.reduce(
      (acc, call) => {
        acc[call.direction] = (acc[call.direction] || 0) + 1;
        return acc;
      },
      { outbound: 0, inbound: 0 }
    );
    return [
      { name: "Outbound", value: directionCount.outbound, color: DIRECTION_COLORS.outbound },
      { name: "Inbound", value: directionCount.inbound, color: DIRECTION_COLORS.inbound },
    ].filter((d) => d.value > 0);
  };

  const getDisconnectionReasonData = () => {
    if (!stats || !stats.recentCalls) return [];
    const reasonCount = stats.recentCalls.reduce((acc, call) => {
      const reason = call.disconnectionReason || "Unknown";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(reasonCount).map(([name, value]) => ({
      name,
      value,
      fill: DISCONNECTION_COLORS[name] || CHART_COLORS.muted,
    }));
  };

  const getQualificationData = () => {
    if (!stats || !stats.recentCalls) return [];
    const qualCount = stats.recentCalls.reduce((acc, call) => {
      const qual = call.qualification || "Unknown";
      acc[qual] = (acc[qual] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(qualCount).map(([name, value]) => ({
      name,
      value,
      color: QUALIFICATION_COLORS[name] || CHART_COLORS.muted,
    }));
  };

  const getCallStatusData = () => {
    if (!stats || !stats.statusDistribution) {
      return [
        { name: "Scheduled", value: 0 },
        { name: "In-Progress", value: 0 },
        { name: "Completed", value: 0 },
        { name: "Failed", value: 0 },
      ];
    }
    return stats.statusDistribution.map((status) => ({
      name: status.name,
      value: status.value,
      color: STATUS_COLORS[status.name.toLowerCase()] || CHART_COLORS.muted,
    }));
  };

  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="px-2 sm:px-4 py-4 max-w-full">
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">AI Calls Dashboard</h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">
                Manage and monitor your automated call campaigns
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setActiveTab("upload")}>Upload Contacts</Button>
              <Button className="w-full sm:w-auto" onClick={handleCallAll} disabled={loading}>{loading ? "Loading..." : "Call All Contacts"}</Button>
            </div>
          </div>
        </header>
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              <MetricCard
                title="Total Calls"
                value={stats?.totalCalls || 0}
                description="Total calls made"
                icon={<Phone className="h-4 w-4" />}
              />
              <MetricCard
                title="Success Rate"
                value={`${stats?.successRate || 0}%`}
                description="Successful calls"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg. Duration"
                value={formatTime(stats?.averageDuration || 0)}
                description="Average call duration"
                icon={<Clock className="h-4 w-4" />}
              />
              <MetricCard
                title="Active Campaigns"
                value={stats?.activeCampaigns || 0}
                description="Running campaigns"
                icon={<BarChart2 className="h-4 w-4" />}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Call Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCallStatusData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getCallStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Call Direction Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Direction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDirectionData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getDirectionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Calls Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <CallTable recentCalls={stats?.recentCalls || []} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <ContactList expanded={true} />
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Contacts</CardTitle>
                <CardDescription>Import your contacts via CSV, XLSX, or XLS file</CardDescription>
              </CardHeader>
              <CardContent>
                <UploadCSV />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function MetricCard({ title, value, description, icon }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <h3 className="text-sm font-medium tracking-tight text-muted-foreground">{title}</h3>
          <div className="bg-primary/10 p-2 rounded-full text-primary">{icon}</div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CallTable({ recentCalls }) {
  // Format date for table
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Number</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Qualification</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentCalls && recentCalls.length > 0 ? (
          recentCalls.map((call) => (
            <TableRow key={call.callSid}>
              <TableCell>{call.contactName}</TableCell>
              <TableCell>{call.contactPhone}</TableCell>
              <TableCell>{formatDate(call.startTime)}</TableCell>
              <TableCell>{call.duration ? `${call.duration}s` : "N/A"}</TableCell>
              <TableCell>{call.status.charAt(0).toUpperCase() + call.status.slice(1)}</TableCell>
              <TableCell>{call.qualification || "Unknown"}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No recent calls
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}