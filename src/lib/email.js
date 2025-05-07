import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

export const sendEmail = async (to, subject, html) => {
  try {
    console.log('Attempting to send email:', {
      to,
      subject,
      from: 'QuickReply <noreply@replyquick.ai>'
    });
    
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: 'QuickReply <noreply@replyquick.ai>',
      to: [to],
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', {
      to,
      messageId: data.id,
      response: data
    });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error in sendEmail:', {
      error,
      to,
      errorMessage: error.message,
      errorCode: error.code
    });
    return { success: false, error: error.message };
  }
}; 