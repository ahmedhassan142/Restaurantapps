// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import MenuItem from '../../../models/menu';
import Category from '../../../models/category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Search menu items
    const menuItems = await MenuItem.find({
      isAvailable: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { ingredients: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .select('name description price category')
    .limit(5)
    .lean();

    // Search categories
    const categories = await Category.find({
      isActive: true,
      name: { $regex: query, $options: 'i' }
    })
    .select('name description')
    .limit(3)
    .lean();

    const results = [
      ...menuItems.map(item => ({
        ...item,
        type: 'menu' as const
      })),
      ...categories.map(cat => ({
        _id: cat.id.toString(),
        name: cat.name,
        description: `Category: ${cat.description || 'Browse all items'}`,
        category: cat.name.toLowerCase(),
        type: 'category' as const
      }))
    ].slice(0, 8); // Limit total results

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}