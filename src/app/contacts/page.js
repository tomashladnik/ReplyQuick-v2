"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UploadCSV from "../calls/UploadCSV";
import ContactList from "../calls/contactList";

export default function ContactsPage() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Contacts
                </h1>
                <p className="text-muted-foreground mt-1">Manage and import your contacts</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <ContactList expanded={true} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
