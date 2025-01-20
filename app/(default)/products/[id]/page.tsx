import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getProductById } from '@/models/product';
import { getUserProductsByProductId } from '@/models/userProduct';
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

  const product = await getProductById(parseInt(params.id));
  if (!product) {
    redirect('/products');
  }

  const userProducts = await getUserProductsByProductId(userId, parseInt(params.id));

  return <ProductDetail product={product} userProducts={userProducts} />;
} 