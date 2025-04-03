import { generateOTP, sendOTP } from '@/lib/twilio';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp);

    // Send OTP via SMS
    const result = await sendOTP(phone, otp);

    if (!result.success) {
      console.error('Failed to send OTP:', result);
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // In production, you should store the OTP in a database with expiration
    // For development, we'll just return it
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otp // Only for development, remove in production
    });
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
} 