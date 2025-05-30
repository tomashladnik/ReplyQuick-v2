import { base } from "@/lib/airtable";
import { NextResponse } from "next/server";

// Function to clean email content
const cleanEmailContent = (content) => {
  if (!content) return '';
  
  // Remove common email reply patterns
  const patterns = [
    /On.*wrote:.*$/s,  // Matches "On [date] [name] wrote:" and everything after
    /On.*,.*wrote:.*$/s,  // Matches "On [date], [name] wrote:" and everything after
    /On.*\n.*wrote:.*$/s,  // Matches multiline "On ... wrote:" patterns
    /^>.*$/gm,  // Matches quoted lines starting with ">"
    /From:.*$/s,  // Matches "From:" and everything after
    /Sent:.*$/s,  // Matches "Sent:" and everything after
    /Date:.*$/s,  // Matches "Date:" and everything after
    /Subject:.*$/s,  // Matches "Subject:" and everything after
    /Reply-To:.*$/s,  // Matches "Reply-To:" and everything after
    /To:.*$/s,  // Matches "To:" and everything after
    /CC:.*$/s,  // Matches "CC:" and everything after
    /BCC:.*$/s,  // Matches "BCC:" and everything after
  ];

  let cleanedContent = content;
  patterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });

  // Remove multiple newlines and trim
  return cleanedContent.replace(/\n{3,}/g, '\n\n').trim();
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!base) {
      console.error('Airtable base is not initialized');
      return NextResponse.json({ error: 'Airtable configuration error' }, { status: 500 });
    }

    const records = await base('Email')
      .select({
        filterByFormula: `Contact = '${email}'`,
        sort: [{ field: 'Last Updated', direction: 'asc' }],
        view: "Grid view"
      })
      .all();

    const messages = [];
    
    records.forEach(record => {
      const fields = record.fields;
      const history = fields.History || '';
      
      // Split the conversation into parts
      const parts = history.split(/(?=Person:|AI:)/).filter(Boolean);
      
      parts.forEach(part => {
        const trimmedPart = part.trim();
        if (trimmedPart.startsWith('Person:')) {
          let message = trimmedPart.replace('Person:', '').trim();
          if (message.includes('Body:')) {
            message = message.split('Body:')[1].trim();
          }
          messages.push({
            id: record.id + '_person',
            content: cleanEmailContent(message),
            subject: fields.Subject || '',
            isAirtable: true,
            direction: 'inbound',
            createdAt: fields['Last Updated'] || record._rawJson.createdTime,
            status: fields.Status || 'pending',
            type: 'person'
          });
        } else if (trimmedPart.startsWith('AI:')) {
          const aiMessage = trimmedPart.replace('AI:', '').trim();
          messages.push({
            id: record.id + '_ai',
            content: aiMessage,
            subject: fields.Subject || '',
            isAirtable: true,
            direction: 'outbound',
            createdAt: fields['Last Updated'] || record._rawJson.createdTime,
            status: fields.Status || 'pending',
            type: 'ai'
          });
        }
      });

      // If there's a draft email, add it as a separate message
      if (fields['Draft Email']) {
        messages.push({
          id: record.id + '_draft',
          content: cleanEmailContent(fields['Draft Email']),
          subject: fields.Subject || '',
          isAirtable: true,
          direction: 'outbound',
          createdAt: fields['Last Updated'] || record._rawJson.createdTime,
          status: fields.Status || 'pending',
          type: 'draft'
        });
      }
    });

    // Sort messages by createdAt timestamp
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching Airtable messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
} 