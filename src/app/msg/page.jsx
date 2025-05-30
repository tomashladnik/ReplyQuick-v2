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

  // Add this new function to render individual messages
  const MessageRow = ({ index, style }) => {
    const messages = communicationType === "sms" ? showSmsMessages :
                    communicationType === "email" ? emailMessages :
                    whatsappMessages;
    const msg = messages[index];
    
    if (!msg) return null;

    // Parse Airtable email content
    if (communicationType === "email" && msg.content) {
      const content = msg.content;
      let aiResponse = '';
      let personMessage = '';

      // Parse the History field format
      if (content.includes('Person:') || content.includes('AI:')) {
        // Split the content by markers
        const parts = content.split(/(?=Person:|AI:)/).filter(Boolean);
        
        parts.forEach(part => {
          const trimmedPart = part.trim();
          if (trimmedPart.startsWith('Person:')) {
            // Extract everything after "Person:" and before "Body:" if it exists
            let message = trimmedPart.replace('Person:', '').trim();
            if (message.includes('Body:')) {
              message = message.split('Body:')[1].trim();
            }
            personMessage = message;
          } else if (trimmedPart.startsWith('AI:')) {
            aiResponse = trimmedPart.replace('AI:', '').trim();
          }
        });
      } else {
        // If no markers, treat as a regular message
        personMessage = content;
      }

      // Return the formatted message components
      return (
        <div style={style} className="space-y-4">
          {personMessage && (
            <div className="flex w-full justify-start items-start">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {selectedContact?.Name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] rounded-lg p-3 mb-2 shadow bg-muted rounded-bl-none">
                <p className="text-sm whitespace-pre-wrap break-words">{personMessage}</p>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {aiResponse && (
            <div className="flex w-full justify-end items-start">
              <div className="max-w-[70%] rounded-lg p-3 mb-2 shadow bg-primary text-primary-foreground rounded-br-none">
                <div className="text-xs text-primary-foreground/80 mb-1">AI Response</div>
                <p className="text-sm whitespace-pre-wrap break-words">{aiResponse}</p>
                <p className="text-xs text-primary-foreground/80 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
              <Avatar className="h-8 w-8 ml-2">
                <AvatarFallback className="bg-primary/20 text-primary">
                  AI
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      );
    }

    // For non-email messages, use the existing format
    const isOutbound = msg.direction === "outbound-api" || msg.direction === "outbound";
    const isAI = msg.isAI;
    const messageContent = msg.body || msg.content;
    const messageTime = msg.dateCreated || msg.createdAt;

    return (
      <div style={style} className={`flex w-full ${isOutbound ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[70%] rounded-lg p-3 mb-2 shadow
            ${isOutbound
              ? "bg-primary text-primary-foreground rounded-br-none ml-8"
              : isAI
                ? "bg-green-100 rounded-bl-none mr-8"
                : "bg-muted rounded-bl-none mr-8"
            }`}
        >
          {isAI && (
            <div className="text-xs text-green-600 mb-1">AI Response</div>
          )}
          <p className="text-sm break-words">{messageContent}</p>
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {new Date(messageTime).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      <main className="flex flex-col md:grid md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 h-full max-w-[1920px] mx-auto w-full">
        {/* Contact List */}
        <Card className="w-full md:col-span-4 xl:col-span-3 border-none bg-background/60 shadow-xl backdrop-blur-sm h-full mb-2 md:mb-0 order-1 md:order-none rounded-xl">
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
                    onClick={() => setSelectedContact(contact)}
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
        </Card>

        {/* Chat Box */}
        <Card className="w-full md:col-span-8 xl:col-span-9 border-none bg-background/60 shadow-xl backdrop-blur-sm flex flex-col h-full order-2 md:order-none rounded-xl overflow-hidden">
          {selectedContact ? (
            <div className="flex flex-col h-full">
              {/* Communication Type Selector - Fixed at top */}
              <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedContact.Name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-lg leading-none mb-1">{selectedContact.Name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {communicationType === "whatsapp" ? "WhatsApp" : 
                       communicationType === "email" ? "Email" : "SMS"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={communicationType === "whatsapp" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 transition-colors duration-200"
                    onClick={() => setCommunicationType("whatsapp")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant={communicationType === "email" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 transition-colors duration-200"
                    onClick={() => setCommunicationType("email")}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant={communicationType === "sms" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 transition-colors duration-200"
                    onClick={() => setCommunicationType("sms")}
                  >
                    <Phone className="h-4 w-4" />
                    SMS
                  </Button>
                </div>
              </div>

              {/* Messages Container - Scrollable */}
              <div className="flex-1 min-h-0 flex flex-col">
                <ScrollArea className="flex-1 px-4 py-6">
                  <div className="space-y-6">
                    {communicationType === "sms" ? (
                      showSmsMessages.length > 0 ? (
                        <List
                          height={window.innerHeight * 0.6}
                          itemCount={showSmsMessages.length}
                          itemSize={100}
                          width="100%"
                          className="messages-list"
                        >
                          {MessageRow}
                        </List>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
                          <p className="font-medium">No messages yet</p>
                          <p className="text-sm text-muted-foreground/80">Start the conversation!</p>
                        </div>
                      )
                    ) : communicationType === "whatsapp" ? (
                      whatsappMessages.length > 0 ? (
                        <List
                          height={window.innerHeight * 0.6}
                          itemCount={whatsappMessages.length}
                          itemSize={100}
                          width="100%"
                          className="messages-list"
                        >
                          {MessageRow}
                        </List>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
                          <p className="font-medium">No WhatsApp messages</p>
                          <p className="text-sm text-muted-foreground/80">Messages will appear here</p>
                        </div>
                      )
                    ) : communicationType === "email" ? (
                      emailMessages.length > 0 ? (
                        <List
                          height={window.innerHeight * 0.6}
                          itemCount={emailMessages.length}
                          itemSize={100}
                          width="100%"
                          className="messages-list"
                        >
                          {MessageRow}
                        </List>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Mail className="h-12 w-12 mb-4 text-muted-foreground/50" />
                          <p className="font-medium">No emails yet</p>
                          <p className="text-sm text-muted-foreground/80">Start the conversation!</p>
                        </div>
                      )
                    ) : null}
                  </div>
                </ScrollArea>

                {/* Input Area - Fixed at bottom */}
                <div className="p-4 bg-muted/30 border-t">
                  <div className="flex items-center gap-3 w-full">
                    <Input
                      placeholder={`Type a ${communicationType} message...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="h-11 bg-background/60 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg transition-all duration-200"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="lg"
                      className="px-6 shadow-sm transition-all duration-200 hover:shadow-md"
                      onClick={handleSendMessage}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a Contact</h3>
              <p className="text-center text-muted-foreground/80">
                Choose a contact from the list to start messaging
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
