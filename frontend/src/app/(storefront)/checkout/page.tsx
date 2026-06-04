"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, CreditCard, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/common/ui/Button";
import { Card, CardContent } from "@/components/common/ui/Card";
import { Input } from "@/components/common/ui/Input";
import { LoadingState } from "@/components/common/LoadingState";
import { OrderSummaryCard } from "@/components/ecommerce/OrderSummaryCard";
import { api as apiClient } from "@/utils/api";

// Utility hook to load script
function useScript(src: string) {
  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  }, [src]);
}

export default function CheckoutPage() {
  const router = useRouter();
  useScript("https://checkout.razorpay.com/v1/checkout.js");

  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<any>(null);
  
  // Dummy form state for address
  const [address, setAddress] = useState({
    name: "John Doe",
    address_line_1: "123 Wellness Avenue",
    address_line_2: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "9876543210"
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await apiClient.get("/shop/cart");
        setCart(res.data);
        if (!res.data.items || res.data.items.length === 0) {
          router.push("/cart");
        }
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      }
    };
    fetchCart();
  }, [router]);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // 1. Initialize Order on Backend
      const orderRes = await apiClient.post("/shop/orders/checkout", {
        payment_method: "online",
        delivery_address: address
      });

      const orderData = orderRes.data;

      // 2. Setup Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_placeholder",
        amount: orderData.amount_due_paise || orderData.total_paise, 
        currency: "INR",
        name: "PetNeo Platform",
        description: "Wellness Shop Purchase",
        order_id: orderData.razorpay_order_id, 
        handler: async function (response: any) {
          try {
            // 3. Verify Payment on Backend
            await apiClient.post("/shop/orders/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            // Redirect to success page
            router.push(`/checkout/success?order_id=${orderData.order_id}`);
          } catch (verifyError) {
            console.error("Payment verification failed", verifyError);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: {
          color: "#2563EB", // Primary Blue 600
        },
      };

      // 4. Open Razorpay Widget
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed", response.error);
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (error: any) {
      console.error("Checkout failed:", error);
      alert(error.message || "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart) return <LoadingState message="Preparing checkout..." />;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Address & Payment Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-(--color-primary-100) text-(--color-primary-700) flex items-center justify-center text-sm">1</span>
                  Delivery Address
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} />
                  <Input label="Phone Number" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} />
                  <div className="md:col-span-2">
                    <Input label="Address Line 1" value={address.address_line_1} onChange={(e) => setAddress({...address, address_line_1: e.target.value})} />
                  </div>
                  <Input label="City" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="State" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
                    <Input label="Pincode" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-(--color-primary-100) text-(--color-primary-700) flex items-center justify-center text-sm">2</span>
                  Payment Method
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 border-2 border-(--color-primary-600) rounded-xl bg-(--color-primary-50)/50 flex items-center gap-4 cursor-pointer">
                    <CreditCard className="w-6 h-6 text-(--color-primary-600)" />
                    <div>
                      <p className="font-semibold text-slate-900">Pay via Razorpay</p>
                      <p className="text-sm text-slate-500">Credit/Debit Cards, UPI, NetBanking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <OrderSummaryCard cart={cart} mode="checkout" onCheckout={handleCheckout} isLoading={isLoading} />
          </div>

        </div>
      </div>
    </div>
  );
}
