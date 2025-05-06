import { NextResponse } from 'next/server';

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_API_URL = 'https://api.cal.com/v2';

export async function GET() {
  try {
    const response = await fetch(`${CALCOM_API_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings from Cal.com');
    }

    const data = await response.json();
    const bookings = data.data.bookings.map(booking => ({
      id: booking.id,
      title: booking.title,
      date: new Date(booking.startTime).toISOString().split('T')[0],
      time: new Date(booking.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      duration: `${booking.eventType.slug}`,
      client: booking.attendees.length > 0 ? booking.attendees.map(att => att.name).join(', ') : 'Unknown',
      status: booking.status,
      meetingLink: booking.meetingLink,
    }));

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { startTime, endTime, attendees, description, name, timezone } = body;
    console.log(startTime, endTime, attendees, description, name, timezone);
    
    const bookingPayload = {
      eventTypeId: 2398905, // Your event type ID
      responses: {
        name: name,
        email: attendees[0],
        notes: description || "Interested in a call",
        location: {
          value: "Your Office",
          optionValue: "inPerson"
        }
      },
      start: startTime,
      end: endTime,
      timeZone: timezone || "America/New_York", // Use the selected timezone or default to ET
      language: "en",
      metadata: {
        source: "manual_scheduling"
      }
    };

    const CALCOM_API_URL = process.env.CALCOM_API_URL || "https://api.cal.com/v2";
    const CALCOM_API_KEY = process.env.CALCOM_API_KEY;

    const bookingResponse = await fetch(`${CALCOM_API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!bookingResponse.ok) {
      const errBody = await bookingResponse.json();
      throw new Error(`Failed to create booking: ${JSON.stringify(errBody)}`);
    }

    const bookingData = await bookingResponse.json();

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingData.id,
        title: bookingData.title,
        startTime: bookingData.start,
        endTime: bookingData.end,
        meetingLink: bookingData.meetingLink || bookingData.location,
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
  
  
