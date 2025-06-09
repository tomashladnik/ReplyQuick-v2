import React from 'react';
import { Phone, Mail, Building2, Clock, MessageSquare } from 'lucide-react';

export default function LeadCard({ contact, call }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-lg font-medium text-gray-600">
              {contact.Name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{contact.Name}</h3>
            <p className="text-sm text-gray-500">{contact.company || 'No company'}</p>
          </div>
        </div>
        {call && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            call.status === 'completed' ? 'bg-green-100 text-green-800' :
            call.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {call.status}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4" />
          <span className="text-sm">{contact.phone || 'No phone'}</span>
        </div>
        {contact.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{contact.email}</span>
          </div>
        )}
        {contact.company && (
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{contact.company}</span>
          </div>
        )}
      </div>

      {call && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {new Date(call.startTime).toLocaleString()}
                {call.duration && ` (${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')})`}
              </span>
            </div>
            {call.transcriptText && (
              <div className="flex items-start gap-2 text-gray-600">
                <MessageSquare className="w-4 h-4 mt-1" />
                <p className="text-sm line-clamp-2">{call.transcriptText}</p>
              </div>
            )}
            {call.summary && (
              <div className="mt-2 text-sm text-gray-700">
                <strong>Summary:</strong> {call.summary}
              </div>
            )}
          </div>
        </div>
      )}

      {contact.source === 'inbound_call' && contact.status === 'new' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            New Inbound Lead
          </span>
        </div>
      )}
    </div>
  );
} 