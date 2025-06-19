import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Generate a random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
export const sendOTP = async (phoneNumber, otp) => {
  try {
    console.log('Attempting to send OTP to:', phoneNumber);
    
    const message = await client.messages.create({
      body: `Your ReplyQuick.AI verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: '+19412717374', // Your Twilio phone number
      to: phoneNumber
    });

    console.log('SMS sent successfully:', message.sid);
    return { success: true, messageId: message.sid, otp };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      status: error.status
    };
  }
};

// Send WhatsApp message
export const sendWhatsAppMessage = async (toNumber, message) => {
  try {
    console.log('Attempting to send WhatsApp message to:', toNumber);
    
    // Use the sandbox number for WhatsApp
    const fromNumber = "+19412717374";
    
    if (!fromNumber) {
      throw new Error('WhatsApp number not configured. Please set TWILIO_WHATSAPP_NUMBER in your environment variables.');
    }

    const whatsappMessage = await client.messages.create({
      body: message,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${toNumber}`
    });

    console.log('WhatsApp message sent successfully:', whatsappMessage.sid);
    return { 
      success: true, 
      messageId: whatsappMessage.sid,
      status: whatsappMessage.status
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 63007) {
      errorMessage = 'WhatsApp not configured. Please join the Twilio WhatsApp Sandbox and configure your sandbox number.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code,
      status: error.status
    };
  }
};

// Get WhatsApp message history
export const getWhatsAppHistory = async (phoneNumber) => {
  try {
    const messages = await client.messages.list({
      to: `whatsapp:${phoneNumber}`,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      limit: 50
    });

    return {
      success: true,
      messages: messages.map(msg => ({
        id: msg.sid,
        body: msg.body,
        status: msg.status,
        direction: msg.direction,
        dateCreated: msg.dateCreated,
        dateUpdated: msg.dateUpdated
      }))
    };
  } catch (error) {
    console.error('Error fetching WhatsApp history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send regular SMS message
export const sendSMS = async (toNumber, message) => {
  try {
    console.log('Attempting to send SMS to:', toNumber);
    console.log('from number:', process.env.TWILIO_PHONE_NUMBER);
    
    const smsMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toNumber
    });
    console.log('SMS sent successfully:', smsMessage.sid);
    console.log('from number:', process.env.TWILIO_PHONE_NUMBER);
    return { 
      success: true, 
      messageId: smsMessage.sid,
      status: smsMessage.status
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      status: error.status
    };
  }
};

// Get SMS message history
export const getSMSHistory = async (phoneNumber) => {
  try {
    const messages = await client.messages.list({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      limit: 50
    });

    return {
      success: true,
      messages: messages.map(msg => ({
        id: msg.sid,
        body: msg.body,
        status: msg.status,
        direction: msg.direction,
        dateCreated: msg.dateCreated,
        dateUpdated: msg.dateUpdated
      }))
    };
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Get SMS Conversation History
export const getSmsConversationHistory = async (number) => {
  try {
    // Fetch messages sent from the number
    const sentMessages = await client.messages.list({
      from: number,
      limit: 100
    });

    // Fetch messages sent to the number
    const receivedMessages = await client.messages.list({
      to: number,
      limit: 100
    });

    // Combine and sort by dateCreated
    const allMessages = [...sentMessages, ...receivedMessages].sort(
      (a, b) => new Date(a.dateCreated) - new Date(b.dateCreated)
    );

    return {
      success: true,
      messages: allMessages.map(msg => ({
        id: msg.sid,
        body: msg.body,
        status: msg.status,
        direction: msg.direction,
        from: msg.from,
        to: msg.to,
        dateCreated: msg.dateCreated,
        dateUpdated: msg.dateUpdated
      }))
    };
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};