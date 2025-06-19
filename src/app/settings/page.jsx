"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from 'axios';

function SettingsContent() {
  const [hubSpotConnected, setHubSpotConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: ''
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCrmStatus();
    fetchUser();
  }, [searchParams]);

  const fetchCrmStatus = async () => {
    setLoading(true);
    const accessTokenParam = searchParams.get("access_token");
    const accessTokenStorage = localStorage.getItem("hubspot_access_token");
    const refreshTokenParam = searchParams.get("refresh_token");
    const refreshTokenStorage = localStorage.getItem("hubspot_refresh_token");

    if (accessTokenParam && refreshTokenParam) {
      setHubSpotConnected(true);
      localStorage.setItem("hubspot_access_token", accessTokenParam);
      localStorage.setItem("hubspot_refresh_token", refreshTokenParam);
    } else if (accessTokenStorage && refreshTokenStorage) {
      setHubSpotConnected(true);
    } else {
      setHubSpotConnected(false);
    }
    setLoading(false);
  };

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

  const connectHubspot = async () => {
    try {
    const response = await axios.post('/api/hubspot/auth');
    const { authUrl } = await response.data;

    window.location.href = authUrl;
    } catch (error) {
      console.error(`Error connecting to Hubspot:`, error);
    }
  };

  const disconnectHubspot = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('hubspot_access_token');
      localStorage.removeItem('hubspot_refresh_token');
      setHubSpotConnected(false);
      window.location.href =  '/settings';
    } catch (error) {
      console.error(`Error disconnecting Hubspot:`, error);
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
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-6">Profile info</h2>
          <div className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-lg font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>

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
                  onClick={() => disconnectHubspot()}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => connectHubspot()}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Pipedrive Integration */}
          {/* <div className="p-4 border rounded-lg">
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
                  onClick={() => console.log('Disconnect Pipedrive')}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => console.log('Connect Pipedrive')}
                >
                  Connect
                </Button>
              )}
            </div>
          </div> */}
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
