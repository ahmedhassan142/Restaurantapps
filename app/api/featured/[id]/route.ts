// app/api/featured/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Featureditem from '../../../../models/Featureditem';
import MenuItem from '../../../../models/menu';
import { verifyToken } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    const featuredItem = await Featureditem.findById(id)
      .populate({
        path: 'menuItem',
        select: 'name price category isAvailable image description',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      })
      .lean();

    if (!featuredItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Featured item not found' 
        },
        { status: 404 }
      );
    }

    // Transform the data
    //@ts-ignore
    const menuItem = featuredItem.menuItem as any;
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

    const transformedItem = {
      ...featuredItem,
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

    return NextResponse.json({ 
      success: true,
      featuredItem: transformedItem 
    });
  } catch (error) {
    console.error('Get featured item error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    await connectDB();
    const body = await request.json();

    const featuredItem = await Featureditem.findById(id);
    
    if (!featuredItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Featured item not found' 
        },
        { status: 404 }
      );
    }

    // Check if menu item is being updated
    if (body.menuItem && body.menuItem !== featuredItem.menuItem.toString()) {
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

      // Check for duplicate active featured items (excluding current one)
      if (body.isActive !== false) {
        const existingFeatured = await Featureditem.findOne({
          menuItem: body.menuItem,
          isActive: true,
          _id: { $ne: id },
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: new Date() } }
          ]
        });

        if (existingFeatured && !body.allowDuplicate) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'This menu item is already featured in another active item' 
            },
            { status: 400 }
          );
        }
      }
    }

    // Update fields
    if (body.title !== undefined) featuredItem.title = body.title.trim();
    if (body.description !== undefined) featuredItem.description = body.description?.trim() || '';
    if (body.isActive !== undefined) featuredItem.isActive = body.isActive;
    if (body.order !== undefined) featuredItem.order = body.order;
    if (body.badgeText !== undefined) featuredItem.badgeText = body.badgeText;
    if (body.badgeColor !== undefined) featuredItem.badgeColor = body.badgeColor;
    
    // Handle dates
    if (body.startDate !== undefined) {
      featuredItem.startDate = body.startDate ? new Date(body.startDate) : new Date();
    }
    
    if (body.endDate !== undefined) {
      featuredItem.endDate = body.endDate ? new Date(body.endDate) : undefined;
    }

    if (body.menuItem !== undefined) {
      featuredItem.menuItem = body.menuItem;
    }

    // Validate date range
    if (featuredItem.endDate && featuredItem.startDate > featuredItem.endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date must be before end date' 
        },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: 'Featured item updated successfully',
      featuredItem
    });
  } catch (error: any) {
    console.error('Update featured item error:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized' 
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    await connectDB();

    const featuredItem = await Featureditem.findById(id);
    
    if (!featuredItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Featured item not found' 
        },
        { status: 404 }
      );
    }

    await Featureditem.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Featured item deleted successfully'
    });
  } catch (error) {
    console.error('Delete featured item error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}