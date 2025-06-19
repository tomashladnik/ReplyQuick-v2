"use client";
import { InsightsChart } from '@/components/dashboard/InsightsChart';
import { LeadsList } from '@/components/dashboard/LeadsList';
import { useEffect, useState } from 'react';
import { RxAvatar } from "react-icons/rx";

function extractNameEmail(transcript) {
  if (!transcript) return { name: "-", email: "-" };

  // Match name (e.g., "Your name is M-u-d-i-t")
  const nameMatch = transcript.match(/Your name is ([A-Za-z\-]+)/i);
  let name = nameMatch ? nameMatch[1].replace(/-/g, "") : "-";

  // Match email (e.g., "your email is m-u-d-i-t-r-a-j-p-u-t-p-e-r-s-o-n-a-l at gmail.com")
  const emailMatch = transcript.match(/your email is ([a-zA-Z\-]+) at ([a-zA-Z0-9.\-]+)\.([a-zA-Z]{2,})/i);
  let email = "-";
  if (emailMatch) {
    email = emailMatch[1].replace(/-/g, "") + "@" + emailMatch[2] + "." + emailMatch[3];
  }

  return { name, email };
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchLogs();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    const res = await fetch('/api/calls/retell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_number: ["+19412717374"]
      }),
    });
    console.log('--- RES', res);
    const data = await res.json();
    console.log('--- DATA', data);
    setCallLogs(Array.isArray(data) ? data : data.calls || []);
    setLogsLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold">Welcome! 👋</h1>
        <div className="flex items-center gap-3">
          <RxAvatar className="w-8 h-8 rounded-full" />
          <span className="text-sm sm:text-base">{user?.name || "Guest"}</span>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <InsightsChart />
        <LeadsList />
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Call Logs</h2>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {logsLoading ? (
              <div className="p-6 text-center text-gray-500">Loading call logs...</div>
            ) : callLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No call logs found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Date/Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration (sec)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">From</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">To</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Summary</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Lead Qualified</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {callLogs.map((call, idx) => {
                      const { name, email } = extractNameEmail(call.transcript);
                      return (
                        <tr
                          key={call.call_id}
                          className={
                            (selectedCall?.call_id === call.call_id
                              ? "bg-blue-50 ring-2 ring-blue-400"
                              : idx % 2 === 0
                                ? "bg-white"
                                : "bg-gray-50 hover:bg-gray-100 cursor-pointer"
                            )
                          }
                          onClick={() => setSelectedCall(call)}
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            {call.start_timestamp
                              ? new Date(call.start_timestamp).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {call.call_cost?.total_duration_seconds ??
                              Math.round((call.duration_ms || 0) / 1000)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{call.from_number}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{call.to_number}</td>
                          <td className="px-4 py-2 max-w-xs truncate" title={call.call_analysis?.call_summary}>
                            {call.call_analysis?.call_summary || "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{name}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {call.call_analysis?.call_successful ? "Yes" : "No"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedCall && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] md:w-[500px] lg:w-[600px] max-w-full bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto transition-all">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Call Transcript</h3>
            <div className="flex gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => window.location.href = `/msg?number=${encodeURIComponent(selectedCall.to_number)}`}
              >
                Open Chat
              </button>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setSelectedCall(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="mb-2 text-xs text-gray-500">
              <span className="font-semibold">From:</span> {selectedCall.from_number} <br />
              <span className="font-semibold">To:</span> {selectedCall.to_number} <br />
              <span className="font-semibold">Date:</span>{" "}
              {selectedCall.start_timestamp
                ? new Date(selectedCall.start_timestamp).toLocaleString()
                : "-"}
            </div>
            <div className="mb-4 text-sm text-gray-700">
              <span className="font-semibold">Summary:</span> {selectedCall.call_analysis?.call_summary || "-"}
            </div>
            <div className="mb-4">
              {selectedCall.recording_url ? (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">Recording:</span>
                  <audio controls src={selectedCall.recording_url} className="w-full max-w-xs" />
                </div>
              ) : (
                <div className="text-xs text-gray-400 mb-2">No recording available.</div>
              )}
            </div>
            <div className="mb-2 font-semibold text-gray-800">Transcript:</div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {selectedCall.transcript_object && selectedCall.transcript_object.length > 0 ? (
                selectedCall.transcript_object.map((turn, idx) => (
                  <div
                    key={idx}
                    className={
                      "flex " +
                      (turn.role === "agent" ? "justify-start" : "justify-end")
                    }
                  >
                    <div
                      className={
                        "rounded-lg px-4 py-2 text-xs max-w-[80%] " +
                        (turn.role === "agent"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-green-100 text-green-900")
                      }
                    >
                      {turn.content}
                    </div>
                  </div>
                ))
              ) : (
                parseTranscript(selectedCall.transcript).length === 0 ? (
                  <div className="text-xs text-gray-400">No transcript available.</div>
                ) : (
                  parseTranscript(selectedCall.transcript).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        "flex " +
                        (idx % 2 === 0 ? "justify-start" : "justify-end")
                      }
                    >
                      <div
                        className={
                          "rounded-lg px-4 py-2 text-xs max-w-[80%] " +
                          (idx % 2 === 0
                            ? "bg-blue-100 text-blue-900"
                            : "bg-green-100 text-green-900")
                        }
                      >
                        {line}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
          {/* Name & Email at the bottom of the side panel */}
          <div className="mt-8 border-t pt-4">
            {(() => {
              let name = "-";
              let email = "-";
              if (selectedCall.transcript_object && selectedCall.transcript_object.length > 0) {
                for (const turn of selectedCall.transcript_object) {
                  if (turn.role === "user" && turn.content) {
                    const extracted = extractNameEmail(turn.content);
                    if (extracted.name !== "-" || extracted.email !== "-") {
                      name = extracted.name;
                      email = extracted.email;
                      break;
                    }
                  }
                }
              } else if (selectedCall.transcript) {
                const extracted = extractNameEmail(selectedCall.transcript);
                name = extracted.name;
                email = extracted.email;
              }
              return (
                <div>
                  <div className="text-xs text-gray-500"><span className="font-semibold">Name:</span> {name}</div>
                  <div className="text-xs text-gray-500"><span className="font-semibold">Email:</span> {email}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}