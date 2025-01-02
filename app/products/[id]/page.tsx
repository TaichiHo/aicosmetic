import { getProductById } from '@/models/product';
import { getUserProductsByProductId } from '@/models/userProduct';
import { auth } from '@clerk/nextjs';
import ProductDetail from './ProductDetail';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { userId } = auth();
  const product = await getProductById(parseInt(params.id));
  const userProducts = userId ? await getUserProductsByProductId(userId, parseInt(params.id)) : [];
  
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Product not found</h1>
      </div>
    );
  }

  return <ProductDetail product={product} userProducts={userProducts} />;
} 