// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Category from '../../../models/category';
import { verifyToken } from '../../../lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('children', 'name slug order isActive')
      .sort({ level: 1, order: 1, name: 1 })
      .lean();

    // Build tree structure
    //@ts-ignore
    const buildTree = (items: any[], parentId: string | null = null) => {
      return items
        .filter(item => {
          if (parentId === null) return !item.parent;
          return item.parent?._id?.toString() === parentId;
        })
         //@ts-ignore
        .map((item: any) => ({
          ...item,
          children: buildTree(items, item._id.toString())
        }))
        .sort((a, b) => a.order - b.order);
    };

    const categoryTree = buildTree(categories);

    return NextResponse.json({ 
      success: true,
      categories: categoryTree,
      flatCategories: categories 
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['auth-token'];
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    const slug = body.slug || body.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Prepare category data
    const categoryData: any = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      image: body.image || '',
      order: body.order || 0,
      isActive: body.isActive !== false,
      slug
    };

    // Handle parent - convert to ObjectId if valid, otherwise set to null
    if (body.parent && body.parent.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(body.parent)) {
        categoryData.parent = new mongoose.Types.ObjectId(body.parent);
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid parent category ID' },
          { status: 400 }
        );
      }
    } else {
      categoryData.parent = null;
    }

    const category = new Category(categoryData);
    await category.save();

    // Update parent's children array if parent exists
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $addToSet: { children: category._id } }
      );
    }

    await category.populate('parent', 'name slug');
    await category.populate('children', 'name slug');

    return NextResponse.json(
      { 
        success: true,
        message: 'Category created successfully',
        category 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create category error:', error);
    
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