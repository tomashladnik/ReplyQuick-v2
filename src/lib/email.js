import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    console.log('Attempting to send email:', {
      to,
      subject,
      from: 'QuickReply <noreply@replyquick.ai>'
    });
    
    const { data, error } = await resend.emails.send({
      from: 'QuickReply <noreply@replyquick.ai>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', {
        error,
        to,
        errorMessage: error.message,
        errorCode: error.code
      });
      return { success: false, error: error.message };
    }

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