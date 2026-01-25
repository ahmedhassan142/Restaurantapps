// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Category from '../../../../models/category';
import { verifyToken } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const { id } = await params;
    
    await connectDB();
    
    const category = await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug order isActive')
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Await the params promise
    const { id } = await params;
    
    await connectDB();
    const body = await request.json();

    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update category
    Object.assign(category, body);
    await category.save();

    // Update parent's children array if parent changed
    if (body.parent !== undefined) {
      // Remove from old parent's children
      if (category.parent) {
        await Category.findByIdAndUpdate(
          category.parent,
          { $pull: { children: category._id } }
        );
      }

      // Add to new parent's children
      if (body.parent) {
        await Category.findByIdAndUpdate(
          body.parent,
          { $addToSet: { children: category._id } }
        );
      }
    }

    await category.populate('parent', 'name slug');
    await category.populate('children', 'name slug');

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Await the params promise
    const { id } = await params;
    
    await connectDB();

    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with subcategories. Please delete subcategories first.' },
        { status: 400 }
      );
    }

    // Remove from parent's children array
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { children: category._id } }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}