import React from 'react';
import LeadCard from '../components/LeadCard';

async function getLeads() {
  // Get both contacts and inbound calls
  const [contactsRes, callsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calls/inbound`, { cache: 'no-store' })
  ]);

  const contacts = await contactsRes.json();
  const calls = await callsRes.json();

  // Combine contacts with their latest calls
  const leadsWithCalls = contacts.map(contact => {
    const latestCall = calls.calls?.find(call => call.contactId === contact.id);
    return {
      contact,
      call: latestCall
    };
  });

  // Add any new inbound calls that don't have contacts yet
  const newInboundLeads = calls.calls
    ?.filter(call => !leadsWithCalls.some(lead => lead.contact.id === call.contactId))
    .map(call => ({
      contact: {
        id: call.contactId,
        Name: call.contactName,
        phone: call.phoneNumber,
        source: 'inbound_call',
        status: 'new'
      },
      call
    })) || [];

  return [...leadsWithCalls, ...newInboundLeads];
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Leads</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search leads..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map(({ contact, call }) => (
          <LeadCard key={contact.id} contact={contact} call={call} />
        ))}
      </div>
    </div>
  );
} 