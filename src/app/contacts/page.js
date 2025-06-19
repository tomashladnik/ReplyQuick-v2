"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from 'axios';
import UploadCSV from "../calls/UploadCSV";
import ContactList from "../calls/contactList";
import { Button } from "@/components/ui/button";

export default function ContactsPage() {
  const [hubspotAccessToken, setHubspotAccessToken] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("hubspot_access_token");
    if (accessToken) {
      setHubspotAccessToken(accessToken);
    }
  }
  , []);

  const uploadHubspotContacts = async () => {
    if (!hubspotAccessToken) {
      console.error("No HubSpot access token found");
      return;
    }

    try {
      const response = await axios.post("/api/hubspot/contacts", {
        hubspotAccessToken,
      });

      if (response.statusText  !== "OK") {
        throw new Error("Failed to upload contacts");
      }

      const contacts = response.data.results.map((contact) => ({
        Name: `${contact.properties.firstname || ""} ${contact.properties.lastname || ""}`.trim() || "Unknown",
        email: contact.properties.email || '',
        phone: contact.properties.phone || '',
        source: "hubspot_import",
      }))

      const responseFromContacts = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts }),
        credentials: "include",
      })

      if (!responseFromContacts.ok) {
        const errorData = await responseFromContacts.json()
        throw new Error(errorData.error || "Upload failed")
      }

      console.log("Contacts uploaded successfully:", responseFromContacts);
    } catch (error) {
      console.error("Error uploading contacts:", error);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 max-w-7xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Contacts
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage and import your contacts</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Contacts</CardTitle>
              <CardDescription>Import your contacts via CSV, XLSX, or XLS file</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadCSV />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>View and manage your contact list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <ContactList expanded={true} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Contacts from HubSpot</CardTitle>
            </CardHeader>
            <Button
              disabled={!hubspotAccessToken}
              variant="default"
              onClick={uploadHubspotContacts}
              className="w-60 mx-auto"
            >
              Upload Contacts
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
