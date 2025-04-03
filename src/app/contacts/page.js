"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import CsvUpload from "./CsvUpload";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const res = await axios.get("/api/contacts");
    setContacts(res.data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>

      {/* CSV Upload Component */}
      <CsvUpload onContactsUploaded={fetchContacts} />

      {/* Contacts List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Uploaded Contacts</h2>
        <ul className="border rounded-lg p-4 bg-white shadow-md">
          {contacts.map((contact, index) => (
            <li key={index} className="border-b py-2">
              {contact.fullName} - {contact.phone}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
