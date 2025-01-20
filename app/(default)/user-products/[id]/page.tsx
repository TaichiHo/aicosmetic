import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getUserProductById } from '@/models/userProduct';
import ProductDetail from './ProductDetail';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const userProduct = await getUserProductById(parseInt(params.id));
  console.log("User Product Data:", JSON.stringify(userProduct, null, 2));
  
  if (!userProduct) {
    redirect('/collection');
  }

  // Verify ownership
  if (userProduct.clerk_id !== userId) {
    redirect('/collection');
  }

  // Add null check for product property
  if (!userProduct.product) {
    console.error("Product data is missing from userProduct");
    redirect('/collection');
  }

  return <ProductDetail userProduct={userProduct} />;
} 