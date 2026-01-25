// app/api/menu/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import MenuItem from '../../../../models/menu';
import Category from '../../../../models/category';
import { verifyToken } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    const menuItem = await MenuItem.findById(id)
      .populate('category', 'name slug')
      .lean();

    if (!menuItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Menu item not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      menuItem 
    });
  } catch (error) {
    console.error('Get menu item error:', error);
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

    const menuItem = await MenuItem.findById(id);
    
    if (!menuItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Menu item not found' 
        },
        { status: 404 }
      );
    }

    // Validate category if being updated
    if (body.category && body.category !== menuItem.category.toString()) {
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
    }

    // Update menu item
    if (body.name !== undefined) menuItem.name = body.name.trim();
    if (body.description !== undefined) menuItem.description = body.description.trim();
    if (body.price !== undefined) menuItem.price = parseFloat(body.price);
    if (body.category !== undefined) menuItem.category = body.category;
    if (body.image !== undefined) menuItem.image = body.image;
    if (body.isAvailable !== undefined) menuItem.isAvailable = body.isAvailable;
    if (body.isVegetarian !== undefined) menuItem.isVegetarian = body.isVegetarian;
    if (body.isVegan !== undefined) menuItem.isVegan = body.isVegan;
    if (body.isGlutenFree !== undefined) menuItem.isGlutenFree = body.isGlutenFree;
    if (body.isSpicy !== undefined) menuItem.isSpicy = body.isSpicy;
    if (body.ingredients !== undefined) {
      menuItem.ingredients = body.ingredients.filter((ing: string) => ing.trim() !== '');
    }
    if (body.preparationTime !== undefined) {
      if (body.preparationTime < 5) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Preparation time must be at least 5 minutes' 
          },
          { status: 400 }
        );
      }
      menuItem.preparationTime = body.preparationTime;
    }
    if (body.nutritionalInfo !== undefined) menuItem.nutritionalInfo = body.nutritionalInfo;
    if (body.tags !== undefined) {
      menuItem.tags = body.tags.filter((tag: string) => tag.trim() !== '');
    }

    await menuItem.save();
    await menuItem.populate('category', 'name slug');

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error: any) {
    console.error('Update menu item error:', error);
    
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

    const menuItem = await MenuItem.findById(id);
    
    if (!menuItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Menu item not found' 
        },
        { status: 404 }
      );
    }

    // Check if menu item is referenced in featured items
    const FeaturedItem = (await import('@/models/Featureditem')).default;
    const featuredReference = await FeaturedItem.findOne({ menuItem: id });
    
    if (featuredReference) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete menu item that is featured. Remove from featured items first.' 
        },
        { status: 400 }
      );
    }

    await MenuItem.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}