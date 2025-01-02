import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getUserProducts } from "@/models/userProduct";
import CollectionView from "./CollectionView";

export default async function CollectionPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const products = await getUserProducts(userId);

  return <CollectionView initialProducts={products} />;
} 