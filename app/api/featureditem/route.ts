// app/api/featured/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import FeaturedItem from '../../../models/Featureditem';

export async function GET() {
  try {
    await connectDB();
    
    const featuredItems = await FeaturedItem.find({
      isActive: true,
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    })
    .populate('menuItem')
    .sort({ order: 1, createdAt: -1 })
    .limit(6)
    .lean();

    // Filter out featured items where menuItem is not available
    const validFeaturedItems = featuredItems.filter(item => 
      item.menuItem && item.menuItem.isAvailable
    );

    return NextResponse.json({ featuredItems: validFeaturedItems });
  } catch (error) {
    console.error('Featured items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const featuredItem = new FeaturedItem(body);
    await featuredItem.save();

    await featuredItem.populate('menuItem');

    return NextResponse.json(
      { 
        message: 'Featured item created successfully',
        featuredItem 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create featured item error:', error);
    
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