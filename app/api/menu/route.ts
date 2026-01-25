// app/api/menu/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import MenuItem from '../../../models/menu';
import Category from '../../../models/category';
import FeaturedItem from '@/models/Featureditem';
import { verifyToken } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query for available items
    let query: any = {};
    if (!includeInactive) {
      query.isAvailable = true;
    }

    // Get all categories to map category IDs to names
    const categories = await Category.find({ isActive: true }).lean();
    const categoryMap = categories.reduce((map, cat) => {
      map[cat._id.toString()] = cat.name;
      return map;
    }, {} as Record<string, string>);

    // If category is specified
    if (category && category !== 'all') {
      const categoryDoc = await Category.findOne({ name: category, isActive: true });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Fetch menu items
    const menuItems = await MenuItem.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Transform items to include category name
    const transformedItems = menuItems.map(item => ({
      ...item,
      categoryName: categoryMap[item.category] || 'Uncategorized',
      //@ts-ignore
      _id: item._id.toString(),
    }));

    return NextResponse.json({ 
      success: true,
      menuItems: transformedItems,
      categories: categories.map(cat => ({
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug
      }))
    });

  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch menu data' 
      },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['auth-token'];
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No token provided' 
        },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'manager')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized' 
        },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Menu item name is required' 
        },
        { status: 400 }
      );
    }

    if (!body.description || body.description.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Description is required' 
        },
        { status: 400 }
      );
    }

    if (!body.price || body.price <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valid price is required (greater than 0)' 
        },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category is required' 
        },
        { status: 400 }
      );
    }

    // Validate category exists
    const categoryExists = await Category.findById(body.category);
    if (!categoryExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category not found' 
        },
        { status: 400 }
      );
    }

    // Prepare menu item data
    const menuItemData = {
      name: body.name.trim(),
      description: body.description.trim(),
      price: parseFloat(body.price),
      category: body.category,
      image: body.image || '/images/default-food.jpg',
      isAvailable: body.isAvailable !== false,
      isVegetarian: body.isVegetarian || false,
      isVegan: body.isVegan || false,
      isGlutenFree: body.isGlutenFree || false,
      isSpicy: body.isSpicy || false,
      ingredients: body.ingredients?.filter((ing: string) => ing.trim() !== '') || [],
      preparationTime: body.preparationTime || 20,
      nutritionalInfo: body.nutritionalInfo || {},
      tags: body.tags?.filter((tag: string) => tag.trim() !== '') || []
    };

    // Validate preparation time
    if (menuItemData.preparationTime < 5) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Preparation time must be at least 5 minutes' 
        },
        { status: 400 }
      );
    }

    // Create new menu item
    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    // Populate category data for response
    await menuItem.populate('category', 'name slug');

    return NextResponse.json(
      { 
        success: true,
        message: 'Menu item created successfully',
        menuItem 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create menu item error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: errors.join(', ') 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}