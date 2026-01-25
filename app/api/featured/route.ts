// app/api/featured/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Featureditem from '../../../models/Featureditem';
import MenuItem from '../../../models/menu';
import { verifyToken } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const admin = searchParams.get('admin') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let query: any = {};
    
    // If not admin, only show active items within date range
    if (!admin || !includeInactive) {
      const now = new Date();
      query.isActive = true;
      query.$or = [
        { startDate: { $exists: false } },
        { startDate: { $lte: now } }
      ];
      query.$or.push(
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
      );
    }

    // Build the query
    let featuredQuery = Featureditem.find(query)
      .populate({
        path: 'menuItem',
        select: 'name price category isAvailable image description',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      })
      .sort({ order: 1, createdAt: -1 });

    // Apply limit if specified
    if (limit) {
      featuredQuery = featuredQuery.limit(limit);
    }

    const featuredItems = await featuredQuery.lean();

    // Transform the data to ensure proper formatting
    const transformedItems = featuredItems.map(item => {
      const menuItem = item.menuItem as any;
      let categoryName = 'Unknown';
      let categoryId = '';
      
      if (menuItem && menuItem.category) {
        if (typeof menuItem.category === 'object') {
          categoryName = menuItem.category.name || 'Unknown';
          categoryId = menuItem.category._id || '';
        } else {
          categoryName = menuItem.category;
          categoryId = menuItem.category;
        }
      }

      return {
        ...item,
        menuItem: {
          _id: menuItem?._id || '',
          name: menuItem?.name || 'Unknown',
          price: menuItem?.price || 0,
          category: categoryName,
          categoryId: categoryId,
          isAvailable: menuItem?.isAvailable || false,
          image: menuItem?.image || '',
          description: menuItem?.description || ''
        }
      };
    });

    return NextResponse.json({
      success: true,
      featuredItems: transformedItems,
      count: transformedItems.length
    });
  } catch (error) {
    console.error('Featured items API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch featured items' 
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
    if (!body.menuItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Menu item is required' 
        },
        { status: 400 }
      );
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Title is required' 
        },
        { status: 400 }
      );
    }

    // Check if menu item exists and is available
    const menuItem = await MenuItem.findById(body.menuItem);
    if (!menuItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Menu item not found' 
        },
        { status: 400 }
      );
    }

    if (!menuItem.isAvailable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot feature an unavailable menu item' 
        },
        { status: 400 }
      );
    }

    // Check if this menu item is already featured (active)
    const existingFeatured = await Featureditem.findOne({
      menuItem: body.menuItem,
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } }
      ]
    });

    if (existingFeatured && !body.allowDuplicate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This menu item is already featured' 
        },
        { status: 400 }
      );
    }

    // Prepare featured item data
    const featuredItemData: any = {
      menuItem: body.menuItem,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      isActive: body.isActive !== false,
      order: body.order || 0,
      badgeText: body.badgeText || 'Featured',
      badgeColor: body.badgeColor || 'orange'
    };

    // Handle dates
    if (body.startDate) {
      featuredItemData.startDate = new Date(body.startDate);
    } else {
      featuredItemData.startDate = new Date();
    }

    if (body.endDate) {
      featuredItemData.endDate = new Date(body.endDate);
    }

    // Validate date range
    if (featuredItemData.endDate && featuredItemData.startDate > featuredItemData.endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date must be before end date' 
        },
        { status: 400 }
      );
    }

    // Create new featured item
    const featuredItem = new Featureditem(featuredItemData);
    await featuredItem.save();

    // Populate menu item data for response
    await featuredItem.populate({
      path: 'menuItem',
      select: 'name price category isAvailable image description',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Featured item created successfully',
        featuredItem 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create featured item error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Featured item already exists with similar properties' 
        },
        { status: 400 }
      );
    }
    
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