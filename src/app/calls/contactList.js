"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { Phone, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

export default function ContactList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const { data } = await axios.get("/api/contacts/getContact");
        setContacts(data);
      } catch (error) {
        console.error("Error fetching contacts", error);
      }
    }
    fetchContacts();
  }, []);

  const startCall = async (contactId) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/calls`, { contactId });
    } catch (error) {
      console.error("Error starting call", error);
      alert("Call failed");
    }
    setLoading(false);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact?.phone?.includes(searchTerm)
  );
  
  const displayContacts = expanded ? filteredContacts : filteredContacts.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {expanded && (
          <Button size="sm" variant="outline" className="gap-1">
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              {expanded && <TableHead>Status</TableHead>}
              {expanded && <TableHead>Last Contact</TableHead>}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.fullName}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                {expanded && (
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        contact.status === "ready"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {contact.status === "ready" ? "Ready to Call" : "Recently Contacted"}
                    </Badge>
                  </TableCell>
                )}
                {expanded && <TableCell>{contact.lastContact}</TableCell>}
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    onClick={() => startCall(contact.id)}
                    disabled={loading}
                  >
                    <Phone className="h-4 w-4" />
                    <span className="sr-only">Call</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!expanded && filteredContacts.length > 5 && (
        <div className="text-center">
          <Button variant="link" size="sm" onClick={() => setExpanded(true)}>
            View all {filteredContacts.length} contacts
          </Button>
        </div>
      )}
    </div>
  );
}
