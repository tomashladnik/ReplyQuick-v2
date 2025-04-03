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
      from: '+18559576128', // Your Twilio phone number
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