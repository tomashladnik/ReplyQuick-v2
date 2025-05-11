"use client";
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export function InsightsChart() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeLeads: 0,
    appointments: 0,
    messages: 0
  });
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('weekly');
 console.log(stats)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch contacts count
        const contactsRes = await fetch('/api/contacts/getContact');
        if (!contactsRes.ok) {
          throw new Error('Failed to fetch contacts');
        }
        const contactsData = await contactsRes.json();
        
        // Fetch appointments count
        const appointmentsRes = await fetch('/api/appointments');
        if (!appointmentsRes.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const appointmentsData = await appointmentsRes.json();
        console.log("appointmentsData",appointmentsData);
        // Fetch messages count
        const messagesRes = await fetch('/api/sms/getSms');
        if (!messagesRes.ok) {
          throw new Error('Failed to fetch messages');
        }
        const messagesData = await messagesRes.json();

        setStats({
          totalContacts: contactsData.length || 0,
          activeLeads: contactsData.filter(c => c.status === 'active').length || 0,
          appointments: appointmentsData.bookings.length || 0,
          messages: messagesData.length || 0
        });

        // Helper to safely get date string
        const safeDateString = d => {
          try {
            const dateObj = new Date(d);
            return !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : null;
          } catch {
            return null;
          }
        };

        // Generate chart data based on contacts
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const data = last7Days.map(date => {
          const dayContacts = contactsData.filter(c => safeDateString(c.createdAt) === date).length;
          const dayMessages = messagesData.filter(m => safeDateString(m.createdAt) === date).length;
          const dayAppointments = appointmentsData.bookings.filter(a => safeDateString(a.createdAt) === date).length;
          return {
            date: new Date(date).toLocaleDateString(),
            contacts: dayContacts,
            messages: dayMessages,
            appointments: dayAppointments
          };
        });

        setChartData(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Contacts</h3>
          <p className="text-2xl font-semibold mt-2">{stats.totalContacts}</p>
          {/* <div className="mt-2 text-sm text-green-600">↑ 12% from last month</div> */}
        </div>
       
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Appointments</h3>
          <p className="text-2xl font-semibold mt-2">{stats.appointments}</p>
          {/* <div className="mt-2 text-sm text-red-600">↓ 3% from last month</div> */}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Messages Sent</h3>
          <p className="text-2xl font-semibold mt-2">{stats.messages}</p>
          {/* <div className="mt-2 text-sm text-green-600">↑ 15% from last month</div> */}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Activity Overview</h2>
          <select 
            className="border rounded p-2 text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">Last 12 Months</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="contacts" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Contacts"
              />
              <Area 
                type="monotone" 
                dataKey="messages" 
                stackId="1" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                name="Messages"
              />
              <Area 
                type="monotone" 
                dataKey="appointments" 
                stackId="1" 
                stroke="#ffc658" 
                fill="#ffc658" 
                name="Appointments"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}