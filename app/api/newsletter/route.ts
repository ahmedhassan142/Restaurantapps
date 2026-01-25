// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Newsletter from '../../../models/newsletter';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if already subscribed and active
    const existingSubscriber = await Newsletter.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 400 }
      );
    }

    // Check if previously unsubscribed
    const previousSubscriber = await Newsletter.findOne({ 
      email: email.toLowerCase()
    });

    if (previousSubscriber) {
      // Reactivate the subscription
      previousSubscriber.isActive = true;
      previousSubscriber.unsubscribedAt = undefined;
      await previousSubscriber.save();
    } else {
      // Create new subscription
      const newsletter = new Newsletter({
        email: email.toLowerCase()
      });
      await newsletter.save();
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const subscriber = await Newsletter.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Email not found in our subscription list' },
        { status: 404 }
      );
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return NextResponse.json(
      { message: 'Successfully unsubscribed from newsletter' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}