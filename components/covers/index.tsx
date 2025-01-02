"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserProductWithDetails } from "@/types/userProduct";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

export default function UserProducts() {
  const [products, setProducts] = useState<UserProductWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const fetchUserProducts = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const resp = await fetch("/api/get-user-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const { data } = await resp.json();
      if (data) {
        setProducts(data);
      }
    } catch (e) {
      console.log("fetch user products failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchUserProducts();
    }
  }, [userId, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-2xl font-semibold">Sign in to view your collection</h2>
        <SignInButton mode="modal">
          <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <section>
      <div className="mx-auto max-w-7xl px-5 my-16">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-3xl font-normal md:text-2xl">My Collection</h2>
          <div className="mx-auto mb-8 mt-4 max-w-[528px] md:mb-12 lg:mb-16">
            <p className="text-[#636262]">Your collected cosmetic products</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-3 lg:gap-12">
          {loading ? (
            <div className="text-center mx-auto">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center mx-auto col-span-full">
              <p className="text-gray-500">No products in your collection yet.</p>
              <button 
                onClick={() => router.push('/products')}
                className="mt-4 text-primary hover:underline"
              >
                Browse Products
              </button>
            </div>
          ) : (
            products.map((userProduct) => (
              <div
                key={userProduct.id}
                className="group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/products/${userProduct.product.id}`)}
              >
                <div className="aspect-square relative">
                  {userProduct.product.image_url ? (
                    <Image
                      src={userProduct.product.image_url}
                      alt={userProduct.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {userProduct.product.brand && (
                    <p className="text-sm text-gray-500">{userProduct.product.brand}</p>
                  )}
                  <h3 className="font-medium text-lg">{userProduct.product.name}</h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                      {userProduct.usage_status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {userProduct.usage_percentage}% used
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
