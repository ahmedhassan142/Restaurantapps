// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Contact from '../../../models/contact';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const contact = new Contact(body);
    await contact.save();

    // Here you would typically send an email notification
    console.log('New contact form submission:', {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject
    });

    return NextResponse.json(
      { 
        message: 'Message sent successfully',
        contactId: contact._id 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Contact form error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .limit(50)
      .lean();

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}