"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UploadCSV from "../calls/UploadCSV";
import ContactList from "../calls/contactList";

export default function ContactsPage() {
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
        </div>
      </div>
    </div>
  );
}
