"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
import { BarChart2, Clock, Phone, TrendingUp, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import CallDetailModal from "./CallDetailModal";
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
        <Sidebar />
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  AI Calls Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Manage and monitor your automated call campaigns</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setActiveTab("upload")} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Contacts
                </Button>
                <Button onClick={handleCallAll} disabled={loading} className="gap-2">
                  <Phone className="h-4 w-4" />
                  {loading ? "Loading..." : "Call All Contacts"}
                </Button>
              </div>
            </div>
          </header>

          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Total Calls"
                  value={stats ? stats.totalCalls : "Loading..."}
                  description={stats ? `+${Math.round(stats.totalCalls * 0.12)} from last week` : ""}
                  icon={<Phone className="h-5 w-5" />}
                  trend={<TrendingUp className="h-4 w-4 text-green-500" />}
                />
                <MetricCard
                  title="Success Rate"
                  value={stats ? `${stats.successRate}%` : "Loading..."}
                  description={stats ? `${stats.successRate > 82 ? "Above" : "Below"} average` : ""}
                  icon={<BarChart2 className="h-5 w-5" />}
                  trend={<TrendingUp className="h-4 w-4 text-green-500" />}
                />
                <MetricCard
                  title="Avg. Duration"
                  value={stats ? formatTime(stats.avgDuration) : "Loading..."}
                  description={stats ? "Across all calls" : ""}
                  icon={<Clock className="h-5 w-5" />}
                  trend={<TrendingUp className="h-4 w-4 text-green-500" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Call Trends</CardTitle>
                    <CardDescription>Daily call volume and success rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={stats?.callTrends || []}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="totalCalls"
                            name="Total Calls"
                            stroke={CHART_COLORS.primary}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                          />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            name="Completed"
                            stroke={CHART_COLORS.success}
                            fillOpacity={1}
                            fill="url(#colorCompleted)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Call Direction</CardTitle>
                    <CardDescription>Distribution of inbound vs outbound calls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getDirectionData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getDirectionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} calls`, "Count"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Call Status Distribution</CardTitle>
                    <CardDescription>Breakdown of call outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCallStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getCallStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} calls`, "Count"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disconnection Reasons</CardTitle>
                    <CardDescription>Frequency of call disconnection reasons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getDisconnectionReasonData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                            {getDisconnectionReasonData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Qualification Breakdown</CardTitle>
                    <CardDescription>Distribution of call qualifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getQualificationData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getQualificationData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} calls`, "Count"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Calls</CardTitle>
                  <CardDescription>History of your recent AI calls</CardDescription>
                </CardHeader>
                <CardContent>
                  <CallTable recentCalls={stats?.recentCalls} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Management</CardTitle>
                  <CardDescription>View and manage your contact list</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Button onClick={handleCallAll} disabled={loading} className="gap-2 2xl:space-y-6">
                      <Phone className="h-4 w-4" />
                      {loading ? "Calling..." : "Call All Contacts"}
                    </Button>
                  </div>
                  <ContactList expanded={true} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Contacts</CardTitle>
                  <CardDescription>Import your contacts via CSV file</CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadCSV />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
        </div>
      </div>
      <Toaster position="top-right" /> {/* Add Toaster component */}
    </div>
  );
}

function MetricCard({ title, value, description, icon, trend }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <h3 className="text-sm font-medium tracking-tight text-muted-foreground">{title}</h3>
          <div className="bg-primary/10 p-2 rounded-full text-primary">{icon}</div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center gap-1 mt-1">
            {trend}
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
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