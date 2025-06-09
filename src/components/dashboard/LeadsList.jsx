"use client";
import { useEffect, useState } from 'react';
import { LeadDetailsSidebar } from './LeadDetailsSidebar';

export function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('30');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showInboundOnly, setShowInboundOnly] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/contacts/getContact');
        const data = await response.json();
        
        // Sort leads to show recent inbound callers first
        const sortedLeads = data.sort((a, b) => {
          // If both are inbound callers, sort by most recent call
          if (a.source === 'inbound_call' && b.source === 'inbound_call') {
            return new Date(b.lastContact) - new Date(a.lastContact);
          }
          // Put inbound callers first
          if (a.source === 'inbound_call') return -1;
          if (b.source === 'inbound_call') return 1;
          // Sort rest by last contact date
          return new Date(b.lastContact) - new Date(a.lastContact);
        });
        
        setLeads(sortedLeads);
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
                         lead.email?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
                         lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesInbound = !showInboundOnly || lead.source === 'inbound_call';
    return matchesSearch && matchesStatus && matchesInbound;
  });

  if (loading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-base sm:text-lg font-semibold">Your Leads</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showInbound"
              checked={showInboundOnly}
              onChange={(e) => setShowInboundOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showInbound" className="text-sm text-gray-600">
              Show inbound callers only
            </label>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input 
            type="search" 
            placeholder="Search leads..." 
            className="border rounded p-2 text-sm w-full sm:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <select 
              className="border rounded p-2 text-sm w-full sm:w-auto"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="all">All time</option>
            </select>
            <select 
              className="border rounded p-2 text-sm w-full sm:w-auto"
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
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No leads found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id} 
              className={`${
                lead.source === 'inbound_call' 
                  ? 'bg-blue-50 border-blue-200 shadow-md' 
                  : statusColors[lead.status]
              } p-3 sm:p-4 rounded-lg relative border hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => setSelectedLeadId(lead.id)}
            >
              {lead.source === 'inbound_call' && (
                <div className="absolute top-2 right-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    Inbound Caller
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 overflow-hidden">
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
                    <h3 className="font-semibold text-sm sm:text-base">{lead.Name}</h3>
                    <span>{statusDot[lead.status]}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">{lead.company || 'No company'}</p>
                </div>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600 ml-[52px] sm:ml-[60px]">
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
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

      <LeadDetailsSidebar
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        leadId={selectedLeadId}
      />
    </div>
  );
}