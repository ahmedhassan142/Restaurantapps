// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import crypto from 'crypto';
import { sendWelcomeEmail } from '../../../../lib/email';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check expiration
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    // Set auth cookie
    const { generateToken } = await import('@/lib/auth');
    const authToken = generateToken({
      userId:user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    });

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });

    // Set auth cookie
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
    
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}