// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { name, phone, address } = body;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        $set: { 
          name: name?.trim(),
          phone: phone?.trim(),
          address: address?.trim()
        }
      },
      { new: true, runValidators: true }
    ).select('-password -resetToken -resetTokenExpiry');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}