// app/api/user/payment/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Payment, { PaymentPlatform } from '@/models/Payment';
import { verifyToken } from '@/lib/auth';

// GET: Get user's payment methods and platforms
export async function GET(request: NextRequest) {
  try {
    console.log('Payment API GET called');
    
    // Authenticate user
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['auth-token'] || cookies['token'];
    
    if (!token) {
      console.log('No auth token found');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    // Use userId from decoded token (check which property exists)
    const userId = (decoded as any).userId || (decoded as any).id;
    
    if (!userId) {
      console.log('No user ID found in token:', decoded);
      return NextResponse.json({ 
        success: false,
        error: 'User ID not found in token' 
      }, { status: 401 });
    }

    await connectDB();
    
    console.log('Looking for payment document for user:', userId);
    
    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Find or create payment document for user
    let payment = await Payment.findOne({ user: userObjectId });
    
    if (!payment) {
      console.log('Creating new payment document for user:', userId);
      
      // Create new payment document with all platforms
      payment = new Payment({
        user: userObjectId,
        paymentMethods: [],
        activePlatform: PaymentPlatform.XPAY,
        platforms: {
          [PaymentPlatform.XPAY]: { isConfigured: false },
          [PaymentPlatform.PAYPRO]: { isConfigured: false },
          [PaymentPlatform.PAYFAST]: { isConfigured: false },
          [PaymentPlatform.JAZZCASH]: { isConfigured: false },
          [PaymentPlatform.EASYPAISA]: { isConfigured: false },
          [PaymentPlatform.STRIPE]: { isConfigured: false },
          [PaymentPlatform.OTHER]: { isConfigured: false }
        }
      });
      
      try {
        await payment.save();
        console.log('New payment document created successfully');
      } catch (saveError: any) {
        console.error('Error saving new payment document:', saveError);
        throw saveError;
      }
    } else {
      console.log('Found existing payment document');
    }

    return NextResponse.json({
      success: true,
      paymentMethods: payment.paymentMethods || [],
      activePlatform: payment.activePlatform,
      platforms: payment.platforms,
      defaultPaymentMethod: payment.defaultPaymentMethod
    });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.errors ? Object.keys(error.errors) : undefined
    }, { status: 500 });
  }
}

// POST: Add new payment method with platform selection
// In your /app/api/user/payment/route.ts - FIX THE POST METHOD

// POST: Add new payment method with platform selection
// app/api/user/payment/route.ts - FIXED POST METHOD


// POST: Add new payment method with platform selection
export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT API POST START ===');
    
    // Authenticate user
    const cookieHeader = request.headers.get('cookie') || '';
    console.log('Cookie header:', cookieHeader);
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['auth-token'] || cookies['token'];
    console.log('Auth token found:', !!token);
    
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized. Please login again.' 
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token. Please login again.' 
      }, { status: 401 });
    }

    const userId = (decoded as any).userId || (decoded as any).id;
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID not found in token' 
      }, { status: 401 });
    }

    await connectDB();
    console.log('Database connected');
    
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const { 
      cardNumber, 
      expiryDate, 
      cvv, 
      cardholderName, 
      isDefault,
      platform = PaymentPlatform.XPAY
    } = body;

    // === VALIDATION START ===
    console.log('🔍 Starting validation...');
    
    // Check required fields
    if (!cardNumber?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Card number is required' 
      }, { status: 400 });
    }
    
    if (!expiryDate?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Expiry date is required' 
      }, { status: 400 });
    }
    
    if (!cvv?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'CVV is required' 
      }, { status: 400 });
    }
    
    if (!cardholderName?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Cardholder name is required' 
      }, { status: 400 });
    }

    // Validate platform
    if (!Object.values(PaymentPlatform).includes(platform)) {
      return NextResponse.json({ 
        success: false,
        error: `Invalid payment platform. Must be one of: ${Object.values(PaymentPlatform).join(', ')}` 
      }, { status: 400 });
    }

    // Clean and validate card number
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    console.log('💳 Card number cleaned:', cleanedCardNumber, 'Length:', cleanedCardNumber.length);
    
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid card number length. Must be 13-19 digits' 
      }, { status: 400 });
    }
    
    if (!/^\d+$/.test(cleanedCardNumber)) {
      return NextResponse.json({ 
        success: false,
        error: 'Card number must contain only digits' 
      }, { status: 400 });
    }

    // Validate expiry date
    console.log('📅 Expiry date:', expiryDate);
    
    // Handle different formats: "03/28", "03-28", "0328"
    const expiryRegex = /^(\d{1,2})[\/\-]?(\d{2,4})$/;
    const match = expiryDate.match(expiryRegex);
    
    if (!match) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid expiry date format. Use MM/YY or MM-YY' 
      }, { status: 400 });
    }
    
    let expMonth = parseInt(match[1]);
    let expYear = parseInt(match[2]);
    
    console.log('📅 Parsed expiry:', { expMonth, expYear });
    
    // Validate month
    if (expMonth < 1 || expMonth > 12) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid month. Must be 01-12' 
      }, { status: 400 });
    }
    
    // Handle year: convert 2-digit to 4-digit
    if (expYear < 100) {
      // Always assume 2000s for credit cards
      expYear = 2000 + expYear;
      console.log('🔄 Converted 2-digit year to:', expYear);
    }
    
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Month is 0-indexed
    
    console.log('📊 Date comparison:', {
      expiry: `${expMonth}/${expYear}`,
      current: `${currentMonth}/${currentYear}`
    });

    // Validate expiry date is not in the past
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      console.log('❌ Card is expired');
      return NextResponse.json({ 
        success: false,
        error: `Card has expired. Current date: ${currentMonth}/${currentYear}, Expiry: ${expMonth}/${expYear}` 
      }, { status: 400 });
    }

    // Validate CVV
    console.log('🔒 CVV:', cvv);
    if (!/^\d{3,4}$/.test(cvv)) {
      return NextResponse.json({ 
        success: false,
        error: 'CVV must be 3 or 4 digits' 
      }, { status: 400 });
    }

    // Determine card brand
    let brand = 'Other';
    if (cleanedCardNumber.startsWith('4')) brand = 'Visa';
    else if (cleanedCardNumber.startsWith('5')) brand = 'Mastercard';
    else if (cleanedCardNumber.startsWith('3')) brand = 'American Express';
    else if (cleanedCardNumber.startsWith('6')) brand = 'Discover';
    else if (cleanedCardNumber.startsWith('2')) brand = 'Mir';
    
    console.log('🏷️ Detected brand:', brand);

    // Get last 4 digits
    const last4 = cleanedCardNumber.slice(-4);
    console.log('🔢 Last 4 digits:', last4);
    // === VALIDATION END ===

    // === DATABASE OPERATIONS START ===
    console.log('💾 Starting database operations...');
    
    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('👤 User ObjectId:', userObjectId);
    
    // Find or create payment document
    let payment = await Payment.findOne({ user: userObjectId });
    console.log('🔍 Payment document found:', !!payment);
    
    if (!payment) {
      console.log('🆕 Creating new payment document...');
      payment = new Payment({
        user: userObjectId,
        paymentMethods: [],
        activePlatform: platform,
        platforms: {
          [PaymentPlatform.XPAY]: { isConfigured: true },
          [PaymentPlatform.PAYPRO]: { isConfigured: false },
          [PaymentPlatform.PAYFAST]: { isConfigured: false },
          [PaymentPlatform.JAZZCASH]: { isConfigured: false },
          [PaymentPlatform.EASYPAISA]: { isConfigured: false },
          [PaymentPlatform.STRIPE]: { isConfigured: false },
          [PaymentPlatform.OTHER]: { isConfigured: false }
        }
      });
      console.log('✅ New payment document created');
    }

    // Ensure platforms object exists
    if (!payment.platforms) {
      payment.platforms = {};
    }
    
    // Configure platform
    if (!payment.platforms[platform]) {
      payment.platforms[platform] = { isConfigured: true };
      console.log(`🔧 Platform ${platform} configured`);
    } else if (!payment.platforms[platform].isConfigured) {
      payment.platforms[platform].isConfigured = true;
      console.log(`🔧 Platform ${platform} enabled`);
    }

    // Generate unique ID for payment method
    const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated payment method ID:', paymentMethodId);

    // Create new payment method
    const newPaymentMethod = {
      id: paymentMethodId,
      platform,
      brand,
      last4,
      exp_month: expMonth,
      exp_year: expYear,
      cardholderName: cardholderName.trim(),
      isDefault: !!isDefault,
      metadata: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('🆕 New payment method object:', newPaymentMethod);

    // Ensure paymentMethods array exists
    if (!payment.paymentMethods) {
      payment.paymentMethods = [];
    }
    
    console.log('📋 Existing payment methods count:', payment.paymentMethods.length);

    // If setting as default, unset other defaults
    if (isDefault && payment.paymentMethods.length > 0) {
      console.log('⚡ Setting as default, unsetting others');
      payment.paymentMethods.forEach((pm: any) => {
        pm.isDefault = false;
      });
    }

    // If this is the first card, set as default
    if (payment.paymentMethods.length === 0) {
      newPaymentMethod.isDefault = true;
      console.log('⭐ First card, setting as default');
    }

    // Add new payment method
    payment.paymentMethods.push(newPaymentMethod);
    console.log('➕ Added to payment methods array');
    
    // Update active platform if this is the first payment method
    if (payment.paymentMethods.length === 1) {
      payment.activePlatform = platform;
      console.log('🔄 Set active platform to:', platform);
    }
    
    console.log('💾 Saving payment document...');
    
    try {
      await payment.save();
      console.log('✅ Payment document saved successfully');
    } catch (saveError: any) {
      console.error('❌ Save error:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', saveError.errors);
        return NextResponse.json({
          success: false,
          error: `Validation error: ${Object.values(saveError.errors).map((err: any) => err.message).join(', ')}`
        }, { status: 400 });
      }
      throw saveError;
    }
    // === DATABASE OPERATIONS END ===

    console.log('🎉 Payment method added successfully!');
    console.log('=== PAYMENT API POST END ===');
    
    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: {
        ...newPaymentMethod,
        exp_year: expYear // Ensure 4-digit year in response
      },
      activePlatform: payment.activePlatform
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ POST API ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      console.error('Validation errors:', errors);
      return NextResponse.json({
        success: false,
        error: `Validation failed: ${errors.join(', ')}`
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Duplicate payment method found'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
// PUT: Update platform configuration or active platform
export async function PUT(request: NextRequest) {
  try {
    // Similar authentication logic as GET
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['auth-token'] || cookies['token'];
    
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = (decoded as any).userId || (decoded as any).id;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID not found in token' 
      }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const payment = await Payment.findOne({ user: userObjectId });
    
    if (!payment) {
      return NextResponse.json({ 
        success: false,
        error: 'No payment configuration found' 
      }, { status: 404 });
    }

    let updateMessage = '';

    // Update platform configuration
    if (body.platform && body.config) {
      const platform = body.platform as PaymentPlatform;
      const config = body.config;
      
      if (!Object.values(PaymentPlatform).includes(platform)) {
        return NextResponse.json({ 
          success: false,
          error: 'Invalid payment platform' 
        }, { status: 400 });
      }

      // Update platform configuration
      payment.platforms[platform] = {
        ...payment.platforms[platform],
        ...config,
        isConfigured: true
      };

      updateMessage = `${platform} configuration updated`;
    }

    // Update active platform
    if (body.activePlatform) {
      const newPlatform = body.activePlatform as PaymentPlatform;
      
      if (!Object.values(PaymentPlatform).includes(newPlatform)) {
        return NextResponse.json({ 
          success: false,
          error: 'Invalid payment platform' 
        }, { status: 400 });
      }

      // Check if platform is configured
      if (!payment.platforms[newPlatform]?.isConfigured) {
        return NextResponse.json({ 
          success: false,
          error: `Please configure ${newPlatform} platform first` 
        }, { status: 400 });
      }

      payment.activePlatform = newPlatform;
      updateMessage = updateMessage 
        ? `${updateMessage} and active platform set to ${newPlatform}`
        : `Active platform set to ${newPlatform}`;
    }

    await payment.save();

    return NextResponse.json({
      success: true,
      message: updateMessage || 'Configuration updated',
      activePlatform: payment.activePlatform,
      platforms: payment.platforms
    });
  } catch (error: any) {
    console.error('Update payment configuration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Also add DELETE endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['auth-token'] || cookies['token'];
    
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = (decoded as any).userId || (decoded as any).id;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID not found in token' 
      }, { status: 401 });
    }

    await connectDB();
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const payment = await Payment.findOne({ user: userObjectId });
    
    if (!payment) {
      return NextResponse.json({ 
        success: false,
        error: 'No payment methods found' 
      }, { status: 404 });
    }

    const paymentMethodIndex = payment.paymentMethods.findIndex(
      (pm: any) => pm.id === params.id
    );

    if (paymentMethodIndex === -1) {
      return NextResponse.json({ 
        success: false,
        error: 'Payment method not found' 
      }, { status: 404 });
    }

    const wasDefault = payment.paymentMethods[paymentMethodIndex].isDefault;
    
    // Remove the payment method
    payment.paymentMethods.splice(paymentMethodIndex, 1);
    
    // If we deleted the default and there are other methods, set a new default
    if (wasDefault && payment.paymentMethods.length > 0) {
      payment.paymentMethods[0].isDefault = true;
    }

    await payment.save();

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete payment method error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Add OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}