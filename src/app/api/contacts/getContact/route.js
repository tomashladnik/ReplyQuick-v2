import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Airtable from 'airtable';
import { base } from "@/lib/airtable";

const prisma = new PrismaClient();

// Log Airtable configuration status
console.log("base", base);
console.log("process.env.NEXT_AIRTABLE_API_KEY", process.env.NEXT_AIRTABLE_API_KEY);
console.log("process.env.NEXT_AIRTABLE_BASE_ID", process.env.NEXT_AIRTABLE_BASE_ID);

export async function GET(req) {
  try {
    // First try to get contacts from Prisma database
    const dbContacts = await prisma.contact.findMany({
      select: {
        id: true,
        Name: true,
        phone: true,
        email: true,
      },
    });

    let airtableContacts = [];
    // Only try to fetch from Airtable if base is initialized
    if (base) {
      try {
        console.log("Fetching from Airtable...");
        
        // Use eachPage to handle pagination
        await new Promise((resolve, reject) => {
          base('Email').select({
            filterByFormula: "OR(Status = 'Approved', Status = '')",
            view: "Grid view"
          }).eachPage(function page(records, fetchNextPage) {
            records.forEach(function(record) {
              // Only add records with a defined status
              const status = record.get('Status');
              if (status && status !== 'undefined') {
                airtableContacts.push({
                  id: record.id,
                  Name: record.get('Contact')?.split('@')[0] || 'Unknown',
                  email: record.get('Contact'),
                  phone: record.get('Phone') || '',
                  isAirtable: true,
                  status: status,
                  created_at: record._rawJson.createdTime
                });
              }
            });
            
            fetchNextPage();
          }, function done(err) {
            if (err) {
              console.error("Error fetching Airtable records:", err);
              reject(err);
              return;
            }
            resolve();
          });
        });
        
        console.log("Fetched", airtableContacts.length, "contacts from Airtable");
        
        // Log unique Status values
        const uniqueStatuses = [...new Set(airtableContacts.map(c => c.status))];
        console.log("Unique Status values found:", uniqueStatuses);
      } catch (airtableError) {
        console.error("Airtable error:", airtableError);
        // Continue with database contacts even if Airtable fails
      }
    } else {
      console.log("Airtable base not initialized, skipping Airtable fetch");
    }

    // Create sets for existing emails and phones
    const existingEmails = new Set(dbContacts.map(c => c.email?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(dbContacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));

    // Filter out duplicates from Airtable contacts
    const uniqueAirtableContacts = airtableContacts.filter(contact => {
      const email = contact.email?.toLowerCase();
      const phone = contact.phone?.replace(/\D/g, '');
      return !(email && existingEmails.has(email)) && !(phone && existingPhones.has(phone));
    });

    // Combine and sort all contacts
    const allContacts = [...dbContacts, ...uniqueAirtableContacts].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    console.log(`Total contacts: ${allContacts.length} (DB: ${dbContacts.length}, Airtable: ${uniqueAirtableContacts.length})`);

    // Return the combined list as JSON response
    return new Response(JSON.stringify(allContacts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch contacts", details: error.message }),
      { status: 500 }
    );
  }
}
