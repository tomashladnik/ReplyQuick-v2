import { getSmsConversationHistory } from '@/lib/twilio';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number');

  if (!number) {
    return new Response(JSON.stringify({ success: false, error: 'Missing number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await getSmsConversationHistory(number);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}