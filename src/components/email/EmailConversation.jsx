'use client';

import { useState, useEffect } from 'react';
import { fetchEmailRequests, updateEmailStatus, watchEmailChanges } from '@/lib/airtable';
import { sendEmail } from '@/lib/email';
import { toast } from 'react-hot-toast';

export default function EmailConversation() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showApproved, setShowApproved] = useState(true);

  useEffect(() => {
    loadEmails();
    
    // Set up real-time updates
    const unsubscribe = watchEmailChanges((newEmails) => {
      if (newEmails.length > 0) {
        // Merge new emails with existing ones
        setEmails(prevEmails => {
          const updatedEmails = [...prevEmails];
          newEmails.forEach(newEmail => {
            const existingIndex = updatedEmails.findIndex(e => e.id === newEmail.id);
            if (existingIndex >= 0) {
              updatedEmails[existingIndex] = newEmail;
            } else {
              updatedEmails.push(newEmail);
            }
          });
          return groupEmailsByThread(updatedEmails);
        });
        
        // Show notification for new approved emails
        const newApprovedEmails = newEmails.filter(email => email.status === 'approved');
        if (newApprovedEmails.length > 0) {
          toast.success(`${newApprovedEmails.length} new email(s) approved`);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const groupEmailsByThread = (emails) => {
    // Group emails by thread
    const threadGroups = emails.reduce((groups, email) => {
      const threadId = email.threadId || email.id;
      if (!groups[threadId]) {
        groups[threadId] = [];
      }
      groups[threadId].push(email);
      return groups;
    }, {});
    
    // Sort emails within each thread by timestamp
    Object.values(threadGroups).forEach(thread => {
      thread.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    return Object.values(threadGroups);
  };

  const loadEmails = async () => {
    try {
      const emailRequests = await fetchEmailRequests();
      setEmails(groupEmailsByThread(emailRequests));
    } catch (error) {
      console.error('Error loading emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (email) => {
    try {
      // Send the email
      const result = await sendEmail(
        email.recipient,
        email.subject,
        email.content
      );

      if (result.success) {
        // Update status in Airtable
        await updateEmailStatus(email.id, 'approved');
        toast.success('Email approved and sent');
        // Refresh the email list
        await loadEmails();
      }
    } catch (error) {
      console.error('Error approving email:', error);
      toast.error('Failed to approve email');
    }
  };

  const handleReject = async (email) => {
    try {
      await updateEmailStatus(email.id, 'rejected');
      toast.success('Email rejected');
      await loadEmails();
    } catch (error) {
      console.error('Error rejecting email:', error);
      toast.error('Failed to reject email');
    }
  };

  const filteredEmails = showApproved 
    ? emails 
    : emails.filter(thread => thread.some(email => email.status === 'pending'));

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Email Conversations</h2>
        <div className="flex gap-4 items-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showApproved}
              onChange={(e) => setShowApproved(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">Show Approved</span>
          </label>
          <select 
            className="px-3 py-2 rounded border"
            onChange={(e) => setSelectedThread(e.target.value)}
            value={selectedThread || ''}
          >
            <option value="">All Threads</option>
            {emails.map((thread, index) => (
              <option key={index} value={index}>
                Thread {index + 1} - {thread[0]?.subject || 'No Subject'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEmails.length === 0 ? (
        <p className="text-center text-gray-500">No email conversations found</p>
      ) : (
        <div className="space-y-6">
          {(selectedThread !== null ? [filteredEmails[selectedThread]] : filteredEmails).map((thread, threadIndex) => (
            <div key={threadIndex} className="border rounded-lg p-4 space-y-4">
              <div className="border-b pb-2 mb-4">
                <h3 className="font-semibold">Thread {threadIndex + 1}</h3>
                <p className="text-sm text-gray-500">
                  {thread[0]?.subject || 'No Subject'}
                </p>
              </div>
              
              {thread.map((email, emailIndex) => (
                <div 
                  key={emailIndex}
                  className={`rounded-lg p-4 ${
                    email.direction === 'inbound' 
                      ? 'bg-gray-100 mr-12' 
                      : 'bg-blue-50 ml-12'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{email.direction === 'inbound' ? 'From' : 'To'}: {email.recipient}</p>
                      <p className="text-sm text-gray-600">Subject: {email.subject}</p>
                    </div>
                    {email.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(email)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(email)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: email.content }} />
                  </div>
                  <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                    <span>{new Date(email.created_at).toLocaleString()}</span>
                    <span className={`capitalize px-2 py-1 rounded ${
                      email.status === 'approved' ? 'bg-green-100 text-green-800' :
                      email.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100'
                    }`}>
                      {email.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 