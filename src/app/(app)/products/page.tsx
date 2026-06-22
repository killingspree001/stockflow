"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import ProductsClient from "./products-client";

export default function ProductsPage() {
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role === "cashier") router.replace("/checkout");
  }, [profile, router]);

  return <ProductsClient />;
}
