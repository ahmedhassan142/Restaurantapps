// app/order-confirmation/[orderNumber]/page.tsx
import OrderConfirmationContent from './OrderConfirmationContent';

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderNumber } = await params;
  
  return <OrderConfirmationContent orderNumber={orderNumber} />;
}