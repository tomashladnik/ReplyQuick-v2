'use client';

export function LeadsList() {
  // Sample leads data
  const sampleLeads = [
    {
      id: 1,
      fullName: 'John Dove',
      phone: '+1 223 456 7890',
      email: 'john@example.com',
      status: 'new',
      avatarUrl: '/avatars/john.jpg'
    },
    {
      id: 2,
      fullName: 'Paul Johns',
      phone: '+1 223 456 7890',
      email: 'paul@example.com',
      status: 'contacted',
      avatarUrl: '/avatars/paul.jpg'
    },
    {
      id: 3,
      fullName: 'David Johnson',
      phone: '+1 223 456 7890',
      email: 'david@example.com',
      status: 'interested',
      avatarUrl: '/avatars/david.jpg'
    },
    {
      id: 4,
      fullName: 'Lucy Jones',
      phone: '+1 223 456 7890',
      email: 'lucy@example.com',
      status: 'closed',
      avatarUrl: '/avatars/lucy.jpg'
    },
    {
      id: 5,
      fullName: 'Sarah Lynn',
      phone: '+1 223 456 7890',
      email: 'sarah@example.com',
      status: 'new',
      avatarUrl: '/avatars/sarah.jpg'
    },
    {
      id: 6,
      fullName: 'George Steven',
      phone: '+1 223 456 7890',
      email: 'george@example.com',
      status: 'closed',
      avatarUrl: '/avatars/george.jpg'
    }
  ];

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Your Leads</h2>
        <div className="flex gap-2">
          <input 
            type="search" 
            placeholder="Search leads..." 
            className="border rounded p-2"
          />
          <select className="border rounded p-2">
            <option>Last 30 days</option>
            <option>Last 60 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <span className="text-sm">
          <span className="mr-2">⚪</span>New
        </span>
        <span className="text-sm">
          <span className="mr-2">🔵</span>Contacted
        </span>
        <span className="text-sm">
          <span className="mr-2">🟢</span>Interested
        </span>
        <span className="text-sm">
          <span className="mr-2">🔴</span>Closed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sampleLeads.map((lead) => (
          <div 
            key={lead.id} 
            className={`${statusColors[lead.status]} p-4 rounded-lg relative border`}
          >
            <button className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50">
              +
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                {/* Placeholder for avatar */}
                <div className="w-full h-full bg-gray-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{lead.fullName}</h3>
                  <span>{statusDot[lead.status]}</span>
                </div>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 