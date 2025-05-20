"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MessageSquare, Phone, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

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
        const response = await fetch("/api/contacts/getContact");
        const data = await response.json();
        setContacts(data);
        console.log("data",data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
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
      } catch (error) {
        console.error("Error fetching messages:", error);
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

  return (
    <div className="w-full min-h-screen bg-background overflow-x-hidden">
      <main className="flex flex-col md:grid md:grid-cols-12 gap-2 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-6 w-full">
        {/* Contact List */}
        <Card className="w-full md:col-span-4 xl:col-span-3 p-2 sm:p-4 border-none shadow-md h-[350px] md:h-full mb-2 md:mb-0 order-1 md:order-none">
          <div className="flex flex-col h-full">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10 h-10 sm:h-11 bg-muted/50 border-none focus-visible:ring-1"
              />
            </div>

            {/* Contact Scroll List */}
            <ScrollArea className="flex-1 pr-2 space-y-2 max-h-[220px] md:max-h-none">
                {loading ? <p>loading</p> : contacts.map((contact) => (
                  <div
                  key={contact.id}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors duration-200 ${
                    selectedContact?.id === contact.id
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <Avatar className="h-10 w-10 mr-3 ring-2 ring-background">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {/* {contact.name[0]} */}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{contact.Name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.phone}
                    </p>
                  </div>
                </div>
                ))}
              {/* {contacts.length > 0 ? contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors duration-200 ${
                    selectedContact?.id === contact.id
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <Avatar className="h-10 w-10 mr-3 ring-2 ring-background">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{contact.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.lastMessage}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                    {contact.time}
                  </span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <p className="text-lg">No contacts found</p>
                </div>
              )} */}
            </ScrollArea>
          </div>
        </Card>

        {/* Chat Box */}
        <Card className="w-full md:col-span-8 xl:col-span-9 p-2 sm:p-4 border-none shadow-md h-[400px] md:h-full order-2 md:order-none flex-1 flex flex-col">
          <div className="flex flex-col h-full">
            {selectedContact ? (
              <>
                {/* Communication Type Selector */}
                <div className="flex flex-wrap items-center justify-center gap-2 p-2 mb-4 bg-muted/20 rounded-lg">
                  <Button
                    variant={communicationType === "whatsapp" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setCommunicationType("whatsapp")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant={communicationType === "email" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setCommunicationType("email")}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant={communicationType === "sms" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setCommunicationType("sms")}
                  >
                    <Phone className="h-4 w-4" />
                    SMS
                  </Button>
                </div>

                {/* Header */}
                <div className="flex items-center p-2 sm:p-4 border-b bg-muted/30 rounded-t-lg mb-2">
                  <Avatar className="h-10 w-10 mr-4 ring-2 ring-background">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedContact.Name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-lg">{selectedContact.Name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {communicationType === "whatsapp" ? "WhatsApp" : 
                       communicationType === "email" ? "Email" : "SMS"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-2 sm:px-4 py-2 messages-container min-h-[120px] max-h-[30vh] sm:max-h-[40vh] md:max-h-none">
                  <div className="space-y-4">
                    {communicationType === "sms" ? (
                      showSmsMessages.length > 0 ? (
                        showSmsMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex w-full ${msg.direction === "outbound-api" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 mb-2 shadow
                                ${msg.direction === "outbound-api"
                                  ? "bg-primary text-primary-foreground rounded-br-none ml-8"
                                  : "bg-muted rounded-bl-none mr-8"
                                }`}
                            >
                              <p className="text-sm break-words">{msg.body}</p>
                              <p className="text-xs text-muted-foreground mt-1 text-right">
                                {new Date(msg.dateCreated).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm italic text-center">
                          No messages yet. Start the conversation!
                        </p>
                      )
                    ) : communicationType === "whatsapp" ? (
                      <p className="text-muted-foreground text-sm italic">
                        WhatsApp messages will appear here.
                      </p>
                    ) : communicationType === "email" ? (
                      emailMessages.length > 0 ? (
                        emailMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex w-full ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 mb-2 shadow
                                ${msg.direction === "outbound"
                                  ? "bg-primary text-primary-foreground rounded-br-none ml-8"
                                  : "bg-muted rounded-bl-none mr-8"
                                }`}
                            >
                              <p className="text-sm break-words">{msg.content}</p>
                              <p className="text-xs text-muted-foreground mt-1 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm italic text-center">
                          No emails yet. Start the conversation!
                        </p>
                      )
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        SMS messages will appear here.
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="mt-2 border-t p-2 sm:p-4 bg-muted/30 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                    <Input
                      placeholder={`Type a ${communicationType} message...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="h-10 sm:h-11 bg-background border-none focus-visible:ring-1 w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto px-6"
                      onClick={handleSendMessage}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-lg">Select a contact to start chatting</p>
                <p className="text-sm">Choose from your contacts on the left</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
