"use client";
import { InsightsChart } from '@/components/dashboard/InsightsChart';
import { LeadsList } from '@/components/dashboard/LeadsList';
import { useEffect, useState } from 'react';
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchUser();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Welcome! 👋</h1>
        <div className="flex items-center gap-3">
          <img 
            src="/avatar.png" 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
          <span>{user?.name || "Guest"}</span>
        </div>
      </div>

      <div className="space-y-8">
        <InsightsChart />
        <LeadsList />
      </div>
    </div>
  );
}