import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Validate required environment variables
const validateEnvVariables = () => {
  const requiredVars = {
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
    MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Initialize Mailgun client
let mg;
try {
  validateEnvVariables();
  const mailgun = new Mailgun(formData);
  mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  });
} catch (error) {
  console.error('Failed to initialize Mailgun client:', error);
  throw error;
}

export const sendEmail = async (to, subject, html) => {
  try {
    // Validate inputs
    if (!to || !subject || !html) {
      throw new Error('Missing required email parameters: to, subject, or html');
    }

    console.log('Attempting to send email:', {
      to,
      subject
    });
    
    // Send to n8n webhook for email sending
    const response = await fetch(process.env.N8N_EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html,
        from: process.env.OUTLOOK_EMAIL || 'noreply@replyquick.ai'
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to send email via n8n');
    }

    console.log('Email sent successfully:', {
      to,
      messageId: data.messageId
    });
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Error in sendEmail:', {
      error,
      to,
      errorMessage: error.message
    });
    return { success: false, error: error.message };
  }
};

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formBody = await req.text();
      data = Object.fromEntries(new URLSearchParams(formBody).entries());
    } else {
      throw new Error('Unsupported content type: ' + contentType);
    }

    // ...rest of your logic
  } catch (error) {
    console.error('Error in POST:', error);
    return { success: false, error: error.message };
  }
} 