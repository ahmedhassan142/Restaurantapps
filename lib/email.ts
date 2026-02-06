// Update these constants in lib/email.ts
// lib/email.ts
import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  text: string;
  html?: string;
}
export interface OrderConfirmationEmailProps {
  email: string;  // STRING email address
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
  }>;
  total: number;
  type: 'pickup' | 'delivery';
  estimatedReadyTime: Date;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  specialInstructions?: string;
}


// Hardcoded Gmail credentials
const SMTP_USER = "ah770643@gmail.com";
const SMTP_PASS = "tzhixkiirkcpahrq";
const EMAIL_FROM_NAME = "Epicurean Restaurant";
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://restaurantapps-git-main-ahmed-hassans-projects-96c42d63.vercel.app";
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
  });
};

// Update the verification email template to use your restaurant name
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}:`, info.messageId);
    console.log(`📧 Preview URL: https://mail.google.com/mail/u/0/#inbox/${info.messageId}`);
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${options.email}:`, error.message);
    
    // Provide helpful debugging info
    if (error.code === 'EAUTH') {
      console.error('🔑 Authentication failed. Check:');
      console.error('1. Gmail account: ah770643@gmail.com');
      console.error('2. App password: tzhixkiirkcpahrq');
      console.error('3. Enable 2FA and generate app password at:');
      console.error('   https://myaccount.google.com/apppasswords');
    } else if (error.code === 'EENVELOPE') {
      console.error('📬 Invalid recipient email address');
    }
    
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verificationUrl = `${NEXTAUTH_URL}/verify-email?token=${token}`;
  
  console.log(`📧 Sending verification email to ${email}`);
  console.log(`🔗 Verification URL: ${verificationUrl}`);
  console.log(`🕐 Token expires in: 24 hours`);
  
  await sendEmail({
    email,
    subject: 'Verify your email address - Epicurean Restaurant',
    text: `Hello ${name},\n\nWelcome to Epicurean Restaurant! Please verify your email address by clicking this link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f97316; margin: 0;">🍽️ Epicurean Restaurant</h1>
          <p style="color: #666; margin-top: 5px;">Verify Your Email Address</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
        
        <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering with <strong style="color: #f97316;">Epicurean Restaurant</strong>! 
          To complete your registration and start ordering delicious food, please verify your email address by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                    color: white; 
                    padding: 15px 35px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    font-size: 16px;
                    display: inline-block;
                    box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
                    transition: all 0.3s ease;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #777; font-size: 14px; margin-bottom: 10px;">
          Or copy and paste this link into your browser:
        </p>
        
        <div style="background: #fff7ed; padding: 12px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #f97316;">
          <code style="color: #9a3412; word-break: break-all; font-size: 13px;">
            ${verificationUrl}
          </code>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
          <strong>⚠️ Important:</strong> This verification link will expire in <strong>24 hours</strong>. 
          You must verify your email before placing orders.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            If you didn't create an account with Epicurean Restaurant, please ignore this email.<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  });
};

// Welcome email after verification
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  console.log(`📧 Sending welcome email to ${email}`);
  
  await sendEmail({
    email,
    subject: 'Welcome to Your App! 🎉',
    text: `Welcome ${name}!\n\nCongratulations! Your email has been verified and your account is now fully activated.\n\nYou can now login and start using all the features of our platform.\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nThe Your App Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">🎉 Welcome to Your App!</h1>
          <p style="color: #666; margin-top: 5px;">Your account is now fully activated</p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    width: 80px; 
                    height: 80px; 
                    border-radius: 50%; 
                    display: inline-flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 36px;">
            ✓
          </div>
        </div>
        
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Hello ${name},</h2>
        
        <p style="color: #555; line-height: 1.6; margin-bottom: 25px; text-align: center;">
          Congratulations! Your email has been successfully verified and your account is now <strong>fully activated</strong>.
        </p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #0369a1; margin-top: 0; margin-bottom: 15px;">🚀 What's Next?</h3>
          <ul style="color: #555; padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Login</strong> to your account</li>
            <li style="margin-bottom: 8px;"><strong>Complete</strong> your profile setup</li>
            <li style="margin-bottom: 8px;"><strong>Explore</strong> the dashboard features</li>
            <li style="margin-bottom: 8px;"><strong>Set up</strong> your preferences</li>
            <li><strong>Start</strong> using our platform</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${NEXTAUTH_URL}/login" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    padding: 15px 35px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    font-size: 16px;
                    display: inline-block;
                    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
                    transition: all 0.3s ease;">
            Go to Login
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 10px;">
            Need help? <a href="${NEXTAUTH_URL}/support" style="color: #3b82f6; text-decoration: none;">Contact our support team</a>
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated welcome message.<br>
            Thank you for joining us! We're excited to have you on board.
          </p>
        </div>
      </div>
    `,
  });
};

// Test email function
export const testEmail = async (toEmail: string = "ah770643@gmail.com"): Promise<void> => {
  console.log('🧪 Testing email configuration...');
  console.log(`📤 From: ${SMTP_USER}`);
  console.log(`📥 To: ${toEmail}`);
  console.log(`🔐 Using app password: ${SMTP_PASS.substring(0, 4)}...`);
  
  try {
    await sendEmail({
      email: toEmail,
      subject: 'Test Email from Your App',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #3b82f6;">✅ Email Test Successful!</h2>
          <p>Your email configuration is working correctly.</p>
          <p>Sent from: ${SMTP_USER}</p>
          <p>Received at: ${toEmail}</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox at:', toEmail);
  } catch (error) {
    console.error('❌ Test email failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify the Gmail credentials are correct');
    console.log('2. Ensure 2FA is enabled on the Gmail account');
    console.log('3. Generate a new app password at:');
    console.log('   https://myaccount.google.com/apppasswords');
    console.log('4. Make sure "Less secure app access" is NOT enabled');
    console.log('5. Check if the Gmail account has any security alerts');
  }
};
export const sendOrderConfirmationEmail = async (props: OrderConfirmationEmailProps): Promise<void> => {
  console.log('📧 Sending order confirmation email with props:', props);
  
  const {
    email,  // This should be a string like "customer@example.com"
    orderNumber,
    customerName,
    items,
    total,
    type,
    estimatedReadyTime,
    deliveryAddress,
    specialInstructions
  } = props;

  // Calculate subtotal
    const confirmationUrl = `${NEXTAUTH_URL}/order-confirmation/${orderNumber}`;
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = type === 'delivery' ? 5.00 : 0;
  
  // Format items for HTML
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong>
        ${item.specialInstructions ? `<br><small style="color: #6b7280;"><em>Note: ${item.specialInstructions}</em></small>` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

   const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation #${orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #f97316; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
        .order-number { background: #ffedd5; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .confirmation-link { text-align: center; margin: 25px 0; }
        .confirmation-btn { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold; 
          font-size: 16px;
          display: inline-block;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
        }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        .total-row { font-weight: bold; border-top: 2px solid #e5e7eb; }
        .info-box { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🍽️ Epicurean Restaurant</h1>
        <p>Order Confirmation</p>
      </div>
      
      <div class="content">
        <div class="order-number">
          <h2 style="margin: 0; color: #9a3412;">Order #${orderNumber}</h2>
          <p style="margin: 5px 0 0 0; color: #ea580c;">Confirmed ✓</p>
        </div>
        
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Thank you for your order! We've received it and our kitchen team is preparing your food with care.</p>
        
        <!-- ORDER CONFIRMATION LINK -->
        <div class="confirmation-link">
          <p>Click below to view your order details:</p>
          <a href="${confirmationUrl}" class="confirmation-btn">
            View Order Details
          </a>
          <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
            Or copy this link: <br>
            <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 12px;">
              ${confirmationUrl}
            </code>
          </p>
        </div>
        
        <h3>Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                <strong>${item.name}</strong>
                ${item.specialInstructions ? `<br><small style="color: #6b7280;"><em>Note: ${item.specialInstructions}</em></small>` : ''}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
            `).join('')}
            ${type === 'delivery' ? `
            <tr>
              <td colspan="3" style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Delivery Fee</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$5.00</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3" style="padding: 8px;">Total Amount</td>
              <td style="padding: 8px; text-align: right;">$${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="info-box">
          <h3 style="color: #0369a1; margin-top: 0;">${type === 'pickup' ? 'Pickup Information' : 'Delivery Information'}</h3>
          ${type === 'pickup' ? `
            <p><strong>Pickup Type:</strong> Customer Pickup</p>
            <p><strong>Estimated Ready Time:</strong> ${estimatedReadyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Pickup Location:</strong><br>123 Restaurant Street, Food City, FC 12345</p>
            <p><strong>Phone:</strong> (555) 123-4567</p>
          ` : `
            <p><strong>Delivery Address:</strong><br>
            ${deliveryAddress?.street}<br>
            ${deliveryAddress?.city}, ${deliveryAddress?.state} ${deliveryAddress?.zipCode}</p>
            <p><strong>Estimated Delivery Time:</strong> ${estimatedReadyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          `}
        </div>
        
        <!-- ... rest of your email template ... -->
      </div>
    </body>
    </html>
  `;

  const textContent = `
Order Confirmation #${orderNumber}

Hi ${customerName},

Thank you for your order! We've received it and our kitchen team is preparing your food.

ORDER DETAILS:
${'-'.repeat(50)}

${items.map(item => `${item.name} x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}${item.specialInstructions ? `\n  Note: ${item.specialInstructions}` : ''}`).join('\n')}

${type === 'delivery' ? 'Delivery Fee: $5.00' : ''}
Total: $${total.toFixed(2)}

${type === 'pickup' ? 'PICKUP INFORMATION' : 'DELIVERY INFORMATION'}:
${'-'.repeat(50)}

${type === 'pickup' ? 
`Type: Customer Pickup
Estimated Ready Time: ${estimatedReadyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Pickup Location: 123 Restaurant Street, Food City, FC 12345`
:
`Type: Delivery
Address: ${deliveryAddress?.street}, ${deliveryAddress?.city}, ${deliveryAddress?.state} ${deliveryAddress?.zipCode}
Estimated Delivery Time: ${estimatedReadyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}

${specialInstructions ? `\nSpecial Instructions:\n${specialInstructions}` : ''}

${'-'.repeat(50)}
WHAT'S NEXT?
• We'll start preparing your order immediately
• You'll receive another notification when your order is ${type === 'pickup' ? 'ready for pickup' : 'out for delivery'}
• Estimated wait time: 25-35 minutes
${type === 'pickup' ? '• Please bring your order number and ID for pickup' : ''}

Need help?
Phone: (555) 123-4567
Email: support@epicurean.com

Thank you for choosing Epicurean Restaurant!
  `;

  await sendEmail({
    email: email,  // This is now a STRING
    subject: `🎉 Order Confirmed! #${orderNumber}`,
    text: textContent,
    html: htmlContent
  });
};

// ... KEEP YOUR OTHER EMAIL FUNCTIONS (sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, testEmail) ...

// Test order confirmation email
export const testOrderEmail = async (toEmail: string = "ah770643@gmail.com"): Promise<void> => {
  console.log('🧪 Testing order confirmation email...');
  
  try {
    await sendOrderConfirmationEmail({
      email: toEmail,
      orderNumber: 'TEST123',
      customerName: 'Test Customer',
      items: [
        { name: 'Margherita Pizza', price: 12.99, quantity: 1 },
        { name: 'Garlic Bread', price: 5.99, quantity: 2, specialInstructions: 'Extra garlic please' }
      ],
      total: 24.97,
      type: 'delivery',
      estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000),
      deliveryAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      specialInstructions: 'Please ring doorbell twice'
    });
    
    console.log('✅ Order confirmation test email sent successfully!');
  } catch (error) {
    console.error('❌ Order confirmation test email failed:', error);
  }
};
// lib/email.ts - Add this function
export async function sendPasswordResetEmail(data: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  try {
    // For production, use an email service like Resend, SendGrid, etc.
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Epicurean Restaurant</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello ${data.name},</p>
              <p>You requested to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request a password reset, please ignore this email.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Epicurean Restaurant. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // For now, log the reset URL (in production, send actual email)
    console.log('Password Reset URL:', data.resetUrl);
    
    // In production, uncomment and configure your email service:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Epicurean <noreply@epicurean.com>',
        to: data.email,
        subject: 'Reset Your Epicurean Password',
        html: emailContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */

    return { success: true };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}