'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from "react-hot-toast";
import axios from 'axios';

export default function AppointmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hubspotAccessToken, setHubspotAccessToken] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsToSend, setLeadsToSend] = useState([]);
  const [displayedLeads, setDisplayedLeads] = useState([]);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    fetchCrmStatus();
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [hubspotAccessToken]);

  useEffect(() => {
    removeRepeatedLeads();
  }, [leads]);

  const fetchCrmStatus = () => {
    setLoading(true);
    const accessTokenStorage = localStorage.getItem("hubspot_access_token");
    const refreshTokenStorage = localStorage.getItem("hubspot_refresh_token");

    if (accessTokenStorage && refreshTokenStorage) {
      setHubspotAccessToken(accessTokenStorage);
    } else {
      setHubspotAccessToken(null);
    }
    setLoading(false);
  };

  const fetchInfo = async () => {
    setLoading(true);
    try {
      if (hubspotAccessToken) {
        await fetchHubspotLeads();
        await fetchContacts();
        await fetchDeals();
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get("/api/contacts/getContact");

      const filteredContacts = response.data.filter((contact) => (
        leads.every((lead) => lead.name !== contact.Name)
      ));

      const contacts = filteredContacts.map((contact) => ({
        id: contact.id,
        name: contact.Name || "",
        contactMethod: contact.email || contact.phone || "N/A",
        source: "ReplyQuick",
        status: "New",
        lastActivity: "",
        assignedRep: "Unassigned",
        followUpDate: "",
      }));

      setLeads((prevLeads) => [...prevLeads, ...contacts]);
    } catch (error) {
      console.error("Error fetching contacts", error);
    }
  }

  const fetchHubspotLeads = async () => {
    try {
      const response = await axios.post("/api/hubspot/get-contacts", {
        hubspotAccessToken,
      });

      if (!response.statusText || response.statusText !== "OK") {
        throw new Error("Failed to fetch leads");
      }

      const filteredContacts = response.data.results.filter((contact) => (
        leads.every((lead) => lead.properties.name !== contact.properties.firstname + " " + contact.properties.lastname)
      ));

      const contacts = filteredContacts.map((contact) => ({
        id: contact.id,
        name: `${contact.properties.firstname || ""} ${contact.properties.lastname || ""}`.trim() || "Unknown",
        contactMethod: contact.properties.email || contact.properties.phone || "N/A",
        source: "HubSpot",
        status: "New",
        lastActivity: contact.properties.lastmodifieddate,
        assignedRep: "Unassigned",
        followUpDate: "",
      }));

      setLeads((prevLeads) => [...prevLeads, ...contacts]);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load leads');
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await axios.post("/api/hubspot/deals", {
        hubspotAccessToken,
      });

      if (!response.statusText || response.statusText !== "OK") {
        throw new Error("Failed to fetch deals");
      }

      setDeals(response.data.results || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load leads');
    }
  };

  const removeRepeatedLeads = () => {
    const uniqueLeads = [];
    const leadNames = new Set();

    leads.forEach((lead) => {
      if (!leadNames.has(lead.name)) {
        uniqueLeads.push(lead);
        leadNames.add(lead.name);
      }
    });

    setDisplayedLeads(uniqueLeads);
  };

  const addLeadToSentList = (lead) => {
    if (lead.source === "HubSpot") return;
    setLeadsToSend((prevSentLeads) => {
      if (prevSentLeads.includes(lead.id)) {
        prevSentLeads = prevSentLeads.filter(id => id !== lead.id);
      } else {
        return [...prevSentLeads, lead.id];
      }
      return prevSentLeads;
    });
  };

  const sendContactsToHubSpot = async () => {
    const filteredLeads = leads.filter((lead) => leadsToSend.includes(lead.id));

    const hubspotContacts = filteredLeads.map((lead) => ({
      properties: {
        firstname: lead.name || "",
        email: lead.contactMethod.includes('@') && lead.contactMethod || "",
        phone: lead.contactMethod.includes('+') && lead.contactMethod || "",
      }
    }));

    const response = await axios.post("/api/hubspot/post-contacts", {
      hubspotAccessToken,
      hubspotContacts,
    });

    if (!response.statusText || response.statusText !== "OK") {
      throw new Error("Failed to send contacts");
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto">
        <div className="flex flex-row justify-start items-start sm:items-center gap-2 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">CRM</h1>
          {
            hubspotAccessToken && (
              <p className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                Connected
              </p>
            )
          }
        </div>

        <div className="grid">
          <div className="lg:col-span-2">
            <Card className={"mb-6"}>
              <CardHeader>
                <CardTitle>Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-4">
                    {error}
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No upcoming leads
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                      <Card 
                        className={"p-3 sm:p-4 cursor-pointer transition-colors"}
                      >
                        <Table className="leads-table">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last activity</TableHead>
                              <TableHead>Assigned rep</TableHead>
                              <TableHead>Follow-up date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedLeads.map((lead) => (
                              <TableRow
                                key={lead.id}
                                onClick={() => addLeadToSentList(lead)}
                                className={
                                  (leadsToSend.includes(lead.id)
                                    ? "bg-blue-50 ring-2 ring-blue-400"
                                    : "bg-white"
                                  )
                                }
                              >
                                <TableCell className="font-medium">{lead.name}</TableCell>
                                <TableCell>{lead.contactMethod}</TableCell>
                                <TableCell>{lead.source}</TableCell>
                                <TableCell>{lead.status}</TableCell>
                                <TableCell>{lead.lastActivity}</TableCell>
                                <TableCell>{lead.assignedRep}</TableCell>
                                <TableCell>{lead.followUpDate}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                  </div>
                )}
              </CardContent>
            </Card>
 
            {
              leadsToSend.length > 0 && (
                <Button
                  disabled={false}
                  variant="default"
                  onClick={sendContactsToHubSpot}
                  className="mx-auto mb-8"
                >
                  Upload these {leadsToSend.length} Contacts to HubSpot
                </Button>
              )
            }

            <Card>
              <CardHeader>
                <CardTitle>Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : deals.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No deals found
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    Display deals here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </main>
  );
} 