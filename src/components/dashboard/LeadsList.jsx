"use client";
import { useEffect, useState } from 'react';

export function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('30');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/contacts/getContact');
        const data = await response.json();
        console.log(data);
        setLeads(data);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const statusColors = {
    new: 'bg-yellow-50 border-yellow-200',
    contacted: 'bg-blue-50 border-blue-200',
    interested: 'bg-green-50 border-green-200',
    closed: 'bg-red-50 border-red-200'
  };

  const statusDot = {
    new: '⚪',
    contacted: '🔵',
    interested: '🟢',
    closed: '🔴'
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.Name.toLowerCase().includes(searchTerm?.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm?.toLowerCase()) ||
                         lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Your Leads</h2>
        <div className="flex gap-2">
          <input 
            type="search" 
            placeholder="Search leads..." 
            className="border rounded p-2 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="border rounded p-2 text-sm"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="all">All time</option>
          </select>
          <select 
            className="border rounded p-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>


      {filteredLeads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No leads found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id} 
              className={`${statusColors[lead.status]} p-4 rounded-lg relative border hover:shadow-md transition-shadow`}
            >
              <button 
                className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50"
                onClick={() => {
                  // Add quick action menu here
                  console.log('Quick action for:', lead.fullName);
                }}
              >
                +
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  {lead.avatarUrl ? (
                    <img 
                      src={lead.avatarUrl} 
                      alt={lead.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                      {lead.Name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{lead.Name}</h3>
                    <span>{statusDot[lead.status]}</span>
                  </div>
                  <p className="text-sm text-gray-500">{lead.company || 'No company'}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 ml-[60px]">
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>{lead.email}</span>
                </div>
                {lead.lastContact && (
                  <div className="flex items-center gap-2 mt-1">
                    <span>🕒</span>
                    <span>Last contact: {new Date(lead.lastContact).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}