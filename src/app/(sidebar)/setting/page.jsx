"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SettingsContent() {
  const [hubSpotConnected, setHubSpotConnected] = useState(false);
  const [pipedriveConnected, setPipedriveConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCrmStatus();
  }, []);

  useEffect(() => {
    if (searchParams.get("token")) {
      fetchCrmStatus();
    }
  }, [searchParams]);

  const fetchCrmStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/crm/status");
      if (!response.ok) throw new Error("Failed to fetch CRM status");

      const data = await response.json();
      setHubSpotConnected(data?.hubSpotConnected || false);
      setPipedriveConnected(data?.pipedriveConnected || false);
    } catch (error) {
      console.error("Error checking CRM status:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectCRM = async (crm) => {
    try {
      const authUrl = `/api/crm/connect?platform=${crm}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Error connecting to ${crm}:`, error);
    }
  };

  const disconnectCRM = async (crm) => {
    try {
      const response = await fetch("/api/crm/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: crm }),
      });

      if (response.ok) {
        if (crm === "hubspot") setHubSpotConnected(false);
        if (crm === "pipedrive") setPipedriveConnected(false);
      }
    } catch (error) {
      console.error(`Error disconnecting ${crm}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-8">
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">CRM Integration Settings</h2>

          {/* HubSpot Integration */}
          <div className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">HubSpot</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {hubSpotConnected ? "Connected" : "Not connected"}
                </p>
              </div>
              {hubSpotConnected ? (
                <Button
                  variant="destructive"
                  onClick={() => disconnectCRM("hubspot")}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => connectCRM("hubspot")}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Pipedrive Integration */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Pipedrive</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {pipedriveConnected ? "Connected" : "Not connected"}
                </p>
              </div>
              {pipedriveConnected ? (
                <Button
                  variant="destructive"
                  onClick={() => disconnectCRM("pipedrive")}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => connectCRM("pipedrive")}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Loading component
function SettingsLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

// Main page component
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
