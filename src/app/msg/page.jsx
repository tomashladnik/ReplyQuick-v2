"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MessageSquare, Phone, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FixedSizeList as List } from 'react-window';
import { base } from "@/lib/airtable";

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [communicationType, setCommunicationType] = useState("whatsapp"); // Default to WhatsApp
  const [smsMessages, setSmsMessages] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [emailMessages, setEmailMessages] = useState([]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact) return;
    try {
      setMessage(""); // Clear message immediately for better UX
      
      let endpoint;
      switch (communicationType) {
        case "whatsapp":
          endpoint = "/api/whatsapp/send";
          break;
        case "email":
          endpoint = "/api/email/send";
          break;
        case "sms":
          endpoint = "/api/sms/send";
          break;
        default:
          throw new Error("Invalid communication type");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          contactId: selectedContact.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to send message");
      }

      // Trigger immediate message refresh
      const fetchMessages = async () => {
        let msgHistory;
        switch (communicationType) {
          case "whatsapp":
            msgHistory = "/api/whatsapp/messages?contactId=" + selectedContact.id;
            break;
          case "email":
            msgHistory = "/api/email/messages?contactId=" + selectedContact.id;
            break;
          case "sms":
            msgHistory = "/api/sms/messages?contactId=" + selectedContact.id;
            break;
        }
        
        const msgHistoryResponse = await fetch(msgHistory);
        const msgHistoryData = await msgHistoryResponse.json();
        
        if (communicationType === "whatsapp") {
          setWhatsappMessages(msgHistoryData);
        } else if (communicationType === "email") {
          setEmailMessages(msgHistoryData.messages || []);
        } else {
          setSmsMessages(msgHistoryData.messages || []);
        }
      };
      
      await fetchMessages();
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        console.log("Fetching contacts...");
        const response = await fetch("/api/contacts/getContact");
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Fetched contacts data:", data);
        
        if (data.error) {
          console.error("Error fetching contacts:", data.error);
          setContacts([]);
          return;
        }
        
        const contactsArray = Array.isArray(data) ? data : [];
        console.log("Setting contacts:", contactsArray);
        setContacts(contactsArray);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact) return;
      
      try {
        let msgHistory;
        switch (communicationType) {
          case "whatsapp":
            msgHistory = "/api/whatsapp/messages?contactId=" + selectedContact.id;
            break;
          case "email":
            // Fetch from our API endpoint instead of directly from Airtable
            if (selectedContact.email) {
              try {
                console.log('Fetching messages for email:', selectedContact.email);
                const response = await fetch(`/api/email/airtable-messages?email=${encodeURIComponent(selectedContact.email)}`);
                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to fetch messages');
                }

                console.log('Received messages:', data.messages);
                setEmailMessages(data.messages || []);
              } catch (error) {
                console.error('Error fetching messages:', error);
                toast.error('Failed to load messages');
              }
            } else {
              console.log('No email address found for contact:', selectedContact);
            }
            return;
          case "sms":
            msgHistory = "/api/sms/messages?contactId=" + selectedContact.id;
            break;
        }
        
        if (msgHistory) {
          const msgHistoryResponse = await fetch(msgHistory);
          const msgHistoryData = await msgHistoryResponse.json();
          
          if (communicationType === "whatsapp") {
            setWhatsappMessages(msgHistoryData);
          } else {
            setSmsMessages(msgHistoryData.messages || []);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      }
    };

    // Initial fetch
    fetchMessages();

    // Set up interval to refresh messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [communicationType, selectedContact]);

   // Filter out OTP messages and only show delivered/sent messages
   const showSmsMessages = smsMessages
     .filter((msg) => {
       // Debug logs
       
       return !msg?.body?.includes("This code will expire in 10 minutes") && 
              (msg?.status === "delivered" || msg?.status === "sent");
     })
     .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));

   console.log("showSmsMessages", showSmsMessages);

   // Function to scroll to bottom of messages
   const scrollToBottom = () => {
     const messagesContainer = document.querySelector('.messages-container');
     if (messagesContainer) {
       messagesContainer.scrollTop = messagesContainer.scrollHeight;
     }
   };

   // Scroll to bottom when messages change
   useEffect(() => {
     scrollToBottom();
   }, [showSmsMessages]);

  // Add dynamic height calculation for messages
  const calculateMessageHeight = (msg) => {
    // Base height for message container
    const baseHeight = 80;
    
    // Estimate height based on content length (roughly 50 chars per line at 16px)
    const contentLength = (msg.content || msg.body || '').length;
    const estimatedLines = Math.ceil(contentLength / 50);
    const contentHeight = Math.max(estimatedLines * 20, 20); // minimum 20px
    
    // Add extra height for labels and timestamp
    const extraHeight = (msg.type === 'ai' || msg.type === 'draft') ? 24 : 0;
    
    return baseHeight + contentHeight + extraHeight;
  };

  const MessageRow = ({ index, style }) => {
    const messages = communicationType === "sms" ? showSmsMessages :
                    communicationType === "email" ? emailMessages :
                    whatsappMessages;
    const msg = messages[index];
    
    if (!msg) return null;

    // For email messages
    if (communicationType === "email") {
      const isOutbound = msg.direction === "outbound";
      const isAI = msg.type === 'ai';
      const isDraft = msg.type === 'draft';
      
      return (
        <div style={{
          ...style,
          height: 'auto',
          paddingBottom: '24px'
        }} className="w-full">
          {/* Message Header - Timestamp */}
          <div className="text-center mb-4">
            <span className="text-xs text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md">
              {new Date(msg.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Message Content */}
          <div className={`flex w-full ${isOutbound ? "justify-end" : "justify-start"}`}>
            {!isOutbound && (
              <div className="flex-shrink-0 mr-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {msg.type === 'person' ? selectedContact?.Name?.[0]?.toUpperCase() || 'U' : 'M'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    {msg.type === 'person' ? selectedContact?.Name?.split(' ')[0] || 'User' : 'Mudit'}
                  </span>
                </div>
              </div>
            )}

            <div className={`relative max-w-[75%] group ${isOutbound ? 'ml-12' : 'mr-12'}`}>
              {/* AI Response Label */}
              {isAI && (
                <div className="absolute -top-6 left-0">
                  <span className="text-xs font-medium text-zinc-500">
                    AI Response
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`rounded-2xl px-4 py-3 shadow-sm
                ${isOutbound
                  ? isAI 
                    ? "bg-zinc-900 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                }
                ${isOutbound ? "rounded-tr-none" : "rounded-tl-none"}
              `}>
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>

              {/* Message Actions - Visible on Hover */}
              <div className="absolute top-0 right-0 translate-x-full px-2 hidden group-hover:flex items-center gap-1">
                <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-500">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {isOutbound && (
              <div className="flex-shrink-0 ml-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {isAI ? 'AI' : 'R'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    {isAI ? 'AI' : 'ReplyQuick'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // For non-email messages (SMS/WhatsApp), use similar structure
    const isOutbound = msg.direction === "outbound-api" || msg.direction === "outbound";
    const isAI = msg.isAI;
    const messageContent = msg.body || msg.content;
    const messageTime = msg.dateCreated || msg.createdAt;

    return (
      <div style={{
        ...style,
        height: 'auto',
        paddingBottom: '24px'
      }} className="w-full">
        <div className="text-center mb-4">
          <span className="text-xs text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md">
            {new Date(messageTime).toLocaleString()}
          </span>
        </div>

        <div className={`flex w-full ${isOutbound ? "justify-end" : "justify-start"}`}>
          {!isOutbound && (
            <div className="flex-shrink-0 mr-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {selectedContact?.Name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {selectedContact?.Name?.split(' ')[0] || 'User'}
                </span>
              </div>
            </div>
          )}

          <div className={`relative max-w-[75%] group ${isOutbound ? 'ml-12' : 'mr-12'}`}>
            {isAI && (
              <div className="absolute -top-6 left-0">
                <span className="text-xs font-medium text-zinc-500">
                  AI Response
                </span>
              </div>
            )}

            <div className={`rounded-2xl px-4 py-3 shadow-sm
              ${isOutbound
                ? isAI 
                  ? "bg-zinc-900 text-white"
                  : "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              }
              ${isOutbound ? "rounded-tr-none" : "rounded-tl-none"}
            `}>
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {messageContent}
              </div>
            </div>

            <div className="absolute top-0 right-0 translate-x-full px-2 hidden group-hover:flex items-center gap-1">
              <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-500">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {isOutbound && (
            <div className="flex-shrink-0 ml-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {isAI ? 'AI' : 'R'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {isAI ? 'AI' : 'ReplyQuick'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950">
      <main className="flex flex-col md:grid md:grid-cols-12 h-full">
        {/* Contact List - Left Sidebar */}
        <div className="w-full md:col-span-3 border-r border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col h-full p-4">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg transition-all duration-200"
              />
            </div>

            {/* Contact Scroll List */}
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-3">
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">No contacts found</p>
                    <p className="text-sm text-muted-foreground/80">Add contacts to start messaging</p>
                  </div>
                ) : contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedContact?.id === contact.id
                        ? "bg-primary/10 hover:bg-primary/15 shadow-inner"
                        : "hover:bg-muted/80 bg-muted/40"
                    }`}
                    onClick={() => {
                      setWhatsappMessages([]);
                      setSmsMessages([]);
                      setEmailMessages([]);
                      setSelectedContact(contact);
                    }}
                  >
                    <Avatar className="h-10 w-10 mr-3 ring-2 ring-background shadow-sm">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className={`${
                        selectedContact?.id === contact.id 
                          ? "bg-primary/20 text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      }`}>
                        {contact.Name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{contact.Name}</h3>
                        {contact.isAirtable && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Approved
                          </span>
                        )}
                        {contact.isTemporary && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.email || contact.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full md:col-span-9 flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
          {selectedContact ? (
            <div className="flex flex-col h-full">
              {/* Chat Header - Fixed */}
              <div className="flex-none px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-base font-medium text-zinc-600 dark:text-zinc-300">
                        {selectedContact.Name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedContact.Name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {selectedContact.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={communicationType === "whatsapp" ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center gap-2 ${
                        communicationType === "whatsapp" 
                          ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                      onClick={() => setCommunicationType("whatsapp")}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </Button>
                    <Button
                      variant={communicationType === "email" ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center gap-2 ${
                        communicationType === "email" 
                          ? "bg-blue-500 text-white hover:bg-blue-600" 
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                      onClick={() => setCommunicationType("email")}
                    >
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Email</span>
                    </Button>
                    <Button
                      variant={communicationType === "sms" ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center gap-2 ${
                        communicationType === "sms" 
                          ? "bg-violet-500 text-white hover:bg-violet-600" 
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                      onClick={() => setCommunicationType("sms")}
                    >
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">SMS</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Container - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col p-4 space-y-4">
                  {communicationType === "email" && emailMessages.length > 0 ? (
                    emailMessages.map((msg, index) => {
                      const isOutbound = msg.direction === "outbound";
                      const isAI = msg.type === 'ai';
                      const showTimestamp = index === 0 || 
                        new Date(msg.createdAt).toDateString() !== new Date(emailMessages[index - 1].createdAt).toDateString();

                      return (
                        <div key={msg.id} className="space-y-2">
                          {showTimestamp && (
                            <div className="flex justify-center my-4">
                              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full">
                                {new Date(msg.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex items-end gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                            {!isOutbound && (
                              <div className="flex-shrink-0 mb-1">
                                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    {msg.type === 'person' ? selectedContact?.Name?.[0]?.toUpperCase() : 'M'}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className={`group relative max-w-[75%] ${isOutbound ? 'ml-4' : 'mr-4'}`}>
                              {isAI && (
                                <div className="absolute -top-5 left-0">
                                  <span className="text-xs font-medium text-zinc-500">AI Response</span>
                                </div>
                              )}

                              <div className={`px-3 py-2 rounded-2xl text-[15px] leading-relaxed
                                ${isOutbound
                                  ? isAI 
                                    ? "bg-zinc-900 text-white"
                                    : "bg-blue-600 text-white"
                                  : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                }
                                ${isOutbound ? "rounded-tr-sm" : "rounded-tl-sm"}
                              `}>
                                <div className="whitespace-pre-wrap break-words">
                                  {msg.content}
                                </div>
                                <div className="text-[11px] opacity-70 text-right mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            {isOutbound && (
                              <div className="flex-shrink-0 mb-1">
                                <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center">
                                  <span className="text-xs font-medium text-white">
                                    {isAI ? 'AI' : 'R'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                      <Mail className="h-12 w-12 text-zinc-400" />
                      <p className="mt-4 font-medium text-zinc-600 dark:text-zinc-300">No messages yet</p>
                      <p className="text-sm text-zinc-500">Start a conversation</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area - Fixed */}
              <div className="flex-none p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder={`Type a ${communicationType} message...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="h-11 bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-800 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl"
                    onClick={handleSendMessage}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M18.3333 1.66667L9.16667 10.8333M18.3333 1.66667L12.5 18.3333L9.16667 10.8333M18.3333 1.66667L1.66667 7.5L9.16667 10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-12 w-12 text-zinc-400" />
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Select a Contact</h3>
              <p className="mt-2 text-zinc-500">
                Choose a contact from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
