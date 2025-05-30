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

    const messages = records.map(record => {
      const fields = record.fields;
      const history = fields.History || '';
      let content = '';
      
      if (history.includes('Person:') || history.includes('AI:')) {
        // Split the content by markers and clean each part
        const parts = history.split(/(?=Person:|AI:)/).filter(Boolean);
        const cleanedParts = parts.map(part => {
          const trimmedPart = part.trim();
          if (trimmedPart.startsWith('Person:')) {
            let message = trimmedPart.replace('Person:', '').trim();
            if (message.includes('Body:')) {
              message = message.split('Body:')[1].trim();
            }
            return 'Person:' + cleanEmailContent(message);
          } else if (trimmedPart.startsWith('AI:')) {
            return 'AI:' + trimmedPart.replace('AI:', '').trim();
          }
          return trimmedPart;
        });
        content = cleanedParts.join('\n');
      } else {
        content = cleanEmailContent(fields['Draft Email'] || history || '');
      }

      return {
        id: record.id,
        content,
        subject: fields.Subject || '',
        isAirtable: true,
        direction: 'inbound',
        createdAt: fields['Last Updated'] || record._rawJson.createdTime,
        status: fields.Status || 'pending'
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching Airtable messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
} 