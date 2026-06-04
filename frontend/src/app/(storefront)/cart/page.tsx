"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CartItem } from "@/components/ecommerce/CartItem";
import { OrderSummaryCard } from "@/components/ecommerce/OrderSummaryCard";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { api as apiClient } from "@/utils/api";

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await apiClient.get("/shop/cart");
      setCart(res.data);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      // Mock empty cart if unauthorized or failed
      setCart({ items: [], total_paise: 0, subtotal_paise: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      await apiClient.put(`/shop/cart/items/${itemId}?quantity=${newQty}`, null);
      fetchCart();
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await apiClient.delete(`/shop/cart/items/${itemId}`);
      fetchCart();
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your cart..." />;
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Your Cart</h1>
        {isEmpty ? (
          <EmptyState
            title="Your cart is empty"
            description="Looks like you haven't added any wellness products to your cart yet."
            actionLabel="Continue Shopping"
            onAction={() => window.location.href = "/shop"}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onUpdateQuantity={updateQuantity} 
                  onRemove={removeItem} 
                />
              ))}
            </div>
            
            <div className="lg:col-span-1">
              <OrderSummaryCard cart={cart} mode="cart" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
