// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinaryconfig';

export async function POST(request: NextRequest) {
  try {
    // Check authentication (add your auth logic)
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
          error: 'Unauthorized' 
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No image file provided' 
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.' 
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File size too large. Maximum size is 5MB.' 
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'epicurean/menu-items',
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      imageUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
      message: 'Image uploaded successfully'
    });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload image' 
      },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove images
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Public ID is required' 
        },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({
      success: true,
      result,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete image' 
      },
      { status: 500 }
    );
  }
}