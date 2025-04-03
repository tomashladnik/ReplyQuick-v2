"use client";
import axios from "axios";
import Papa from "papaparse";
import { useState } from "react";

export default function CsvUpload({ onContactsUploaded }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          const parsedContacts = result.data.map((row) => ({
            fullName: row[0],
            email: row[1],
            phone: row[2],
            source: "csv_import",
          }));
          setContacts(parsedContacts);
        },
        header: false, // Ensure first row is data
      });
    }
  };

  // Send contacts to backend
  const uploadContacts = async () => {
    setLoading(true);
    try {
      await axios.post("/api/contacts", { contacts });
      onContactsUploaded();
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md">
      <h2 className="text-lg font-semibold mb-2">Upload CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-3" />
      <button
        onClick={uploadContacts}
        disabled={loading || contacts.length === 0}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? "Uploading..." : "Upload Contacts"}
      </button>
    </div>
  );
}
