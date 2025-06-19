"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MessageSquare, Phone, Search, UserPlus } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

function ChatPageContent() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [communicationType, setCommunicationType] = useState("whatsapp");
  const [smsMessages, setSmsMessages] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [emailMessages, setEmailMessages] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [viewMode, setViewMode] = useState("contacts");
  const OUR_NUMBER = "+19412717374";

  const searchParams = useSearchParams();
  const chatNumber = searchParams.get("number");

  const [customerConversations, setCustomerConversations] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    if (chatNumber) {
      setViewMode("customers");
    }
  }, [chatNumber]);
  useEffect(() => {
    if (chatNumber && customerConversations.length > 0) {
      const found = customerConversations.find(
        (conv) => conv.number === chatNumber
      );
      if (found) setSelectedCustomer(found);
    }
  }, [chatNumber, customerConversations]);

  useEffect(() => {
    async function fetchCustomerConversations() {
      setLoadingCustomers(true);
      try {
        const res = await fetch(`/api/sms/getSmsAgent?number=${encodeURIComponent(OUR_NUMBER)}`);
        const data = await res.json();
        if (data.success) {
          const grouped = {};
          data.messages.forEach(msg => {
            const customerNumber = msg.from === OUR_NUMBER ? msg.to : msg.from;
            if (!grouped[customerNumber]) grouped[customerNumber] = [];
            grouped[customerNumber].push(msg);
          });
          const convArr = Object.entries(grouped).map(([number, msgs]) => ({
            number,
            latest: msgs.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))[0],
            messages: msgs
          })).sort((a, b) => new Date(b.latest.dateCreated) - new Date(a.latest.dateCreated));
          setCustomerConversations(convArr);
        }
      } catch (e) {
        setCustomerConversations([]);
      }
      setLoadingCustomers(false);
    }
    fetchCustomerConversations();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/contacts/getContact");
        const data = await response.json();
        if (data.error) {
          setContacts([]);
          return;
        }
        setContacts(Array.isArray(data) ? data : []);
      } catch (error) {
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
            if (selectedContact.email) {
              try {
                const response = await fetch(`/api/email/airtable-messages?email=${encodeURIComponent(selectedContact.email)}`);
                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.error || 'Failed to fetch messages');
                }
                setEmailMessages(data.messages || []);
              } catch (error) {
                toast.error('Failed to load messages');
              }
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
        toast.error("Failed to load messages");
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [communicationType, selectedContact]);

  const handleSendMessage = async () => {
    if (!message.trim() || (!selectedContact && !selectedCustomer)) return;
    try {
      setMessage("");
      let endpoint;
      let contactId = selectedContact?.id;
      if (viewMode === "customers") {
        contactId = selectedCustomer?.number;
        endpoint = "/api/sms/send";
      } else {
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
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          contactId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  // Filter out OTP messages and only show delivered/sent messages
  const showSmsMessages = smsMessages
    .filter((msg) =>
      !msg?.body?.includes("This code will expire in 10 minutes") &&
      (msg?.status === "delivered" || msg?.status === "sent")
    )
    .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));

  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [showSmsMessages, emailMessages, whatsappMessages]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto">
      <main className="flex flex-col md:grid md:grid-cols-12 h-full">
        {/* Sidebar - Single Pane with Toggle */}
        <div className="w-full md:col-span-3 border-r border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col h-full p-4">
            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded-md font-medium ${viewMode === "contacts" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}`}
                onClick={() => {
                  setViewMode("contacts");
                  setSelectedCustomer(null);
                }}
              >
                Contacts
              </button>
              <button
                className={`px-3 py-1 rounded-md font-medium ${viewMode === "customers" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}`}
                onClick={() => {
                  setViewMode("customers");
                  setSelectedContact(null);
                }}
              >
                Customers
              </button>
            </div>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={viewMode === "contacts" ? "Search contacts..." : "Search customers..."}
                value={viewMode === "contacts" ? contactSearch : customerSearch}
                onChange={e =>
                  viewMode === "contacts"
                    ? setContactSearch(e.target.value)
                    : setCustomerSearch(e.target.value)
                }
                className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg transition-all duration-200"
              />
            </div>
            {/* List */}
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-2">
                {viewMode === "contacts" ? (
                  loading ? (
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
                  ) : contacts
                      .filter(contact =>
                        contact.Name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                        contact.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                        contact.phone?.toLowerCase().includes(contactSearch.toLowerCase())
                      )
                      .map((contact) => (
                        <div
                          key={contact.id}
                          className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedContact?.id === contact.id
                              ? "bg-primary/10 hover:bg-primary/15 shadow-inner"
                              : "hover:bg-muted/80 bg-muted/40"
                          }`}
                          onClick={() => {
                            setSelectedContact(contact);
                            setSelectedCustomer(null);
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
                      ))
                ) : loadingCustomers ? (
                  <div className="p-4">Loading...</div>
                ) : customerConversations.length === 0 ? (
                  <div className="p-4 text-zinc-500">No customer conversations found.</div>
                ) : customerConversations
                    .filter(conv =>
                      conv.number.toLowerCase().includes(customerSearch.toLowerCase())
                    )
                    .map(conv => (
                      <div
                        key={conv.number}
                        className={`flex items-center gap-3 px-4 py-2 cursor-pointer truncate ${
                          selectedCustomer?.number === conv.number
                            ? "bg-primary/10 font-semibold text-primary"
                            : "hover:bg-muted/80"
                        }`}
                        onClick={() => {
                          setSelectedCustomer(conv);
                          setSelectedContact(null);
                        }}
                      >
                        {/* Initials Circle */}
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-blue-600 font-bold text-sm">
                          {conv.number
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="truncate">{conv.number}</span>
                      </div>
                    ))
                }
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full md:col-span-9 flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
          {viewMode === "contacts" && selectedContact ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="flex-none px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
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
                <div className="flex items-center gap-2 mt-4">
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
              {/* Messages */}
              <div className="flex-1 overflow-y-auto messages-container">
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
                  ) : communicationType === "sms" && showSmsMessages.length > 0 ? (
                    showSmsMessages.map((msg, idx) => {
                      const isMe = msg.from === OUR_NUMBER;
                      return (
                        <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`px-3 py-2 rounded-2xl max-w-[70%] text-[15px] leading-relaxed
                            ${isMe
                              ? "bg-blue-600 text-white rounded-tr-sm"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm"
                            }`}>
                            <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                            <div className="text-[11px] opacity-70 text-right mt-1">
                              {new Date(msg.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : communicationType === "whatsapp" && whatsappMessages.length > 0 ? (
                    whatsappMessages.map((msg, idx) => {
                      const isMe = msg.from === OUR_NUMBER;
                      return (
                        <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`px-3 py-2 rounded-2xl max-w-[70%] text-[15px] leading-relaxed
                            ${isMe
                              ? "bg-blue-600 text-white rounded-tr-sm"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm"
                            }`}>
                            <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                            <div className="text-[11px] opacity-70 text-right mt-1">
                              {new Date(msg.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
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
              {/* Input */}
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
          ) : viewMode === "customers" && selectedCustomer ? (
            <div className="flex flex-col h-full">
              {/* Header with Initials and Number */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-blue-600 font-bold text-sm">
                  {selectedCustomer.number
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedCustomer.number}</span>
              </div>
              <div className="flex-1 overflow-y-auto messages-container">
                <div className="p-4 space-y-2">
                  {selectedCustomer.messages?.length > 0 ? (
                    selectedCustomer.messages
                      .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated))
                      .map((msg, idx) => {
                        const isMe = msg.from === OUR_NUMBER;
                        return (
                          <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`px-3 py-2 rounded-2xl max-w-[70%] text-[15px] leading-relaxed
                              ${isMe
                                ? "bg-blue-600 text-white rounded-tr-sm"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm"
                              }`}>
                              <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                              <div className="text-[11px] opacity-70 text-right mt-1">
                                {new Date(msg.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="p-4 text-zinc-500">No messages found for this customer.</div>
                  )}
                </div>
              </div>
              {/* Input */}
              <div className="flex-none p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Sending is disabled in customer view"
                    value={message}
                    disabled
                    className="h-11 bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-800 rounded-xl opacity-60"
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 bg-zinc-300 dark:bg-zinc-800 text-zinc-400 rounded-xl cursor-not-allowed"
                    disabled
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
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Select a {viewMode === "contacts" ? "Contact" : "Customer"}
              </h3>
              <p className="mt-2 text-zinc-500">
                Choose a {viewMode === "contacts" ? "contact" : "customer"} from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}