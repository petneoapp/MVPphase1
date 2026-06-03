import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock } from "lucide-react";

export interface OrderSummaryCardProps {
  cart: any;
  mode: "cart" | "checkout";
  onCheckout?: () => void;
  isLoading?: boolean;
}

export function OrderSummaryCard({ cart, mode, onCheckout, isLoading }: OrderSummaryCardProps) {
  if (!cart) return null;

  return (
    <div className="bg-white p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-premium-sm)] sticky top-28">
      <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-6">Order Summary</h3>
      
      {mode === "checkout" && cart.items && (
        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {cart.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <div className="flex gap-3 items-center">
                <span className="text-slate-500">{item.quantity}x</span>
                <span className="font-medium text-[var(--color-foreground)] truncate max-w-[150px]">{item.product?.name}</span>
              </div>
              <span className="text-[var(--color-foreground)] font-medium">₹{((item.price_paise * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-[var(--color-border)] pt-4" />
        </div>
      )}

      <div className="space-y-4 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-slate-500">Subtotal ({cart.item_count || 0} items)</span>
          <span className="font-medium text-[var(--color-foreground)]">₹{((cart.subtotal_paise || 0) / 100).toFixed(2)}</span>
        </div>
        {(cart.discount_paise || 0) > 0 && (
          <div className="flex justify-between text-[var(--color-success-600)]">
            <span>Discount</span>
            <span>-₹{(cart.discount_paise / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Shipping</span>
          <span className="font-medium text-[var(--color-foreground)]">
            {cart.shipping_paise === 0 ? "Free" : `₹${((cart.shipping_paise || 0) / 100).toFixed(2)}`}
          </span>
        </div>
      </div>
      
      <div className="border-t border-[var(--color-border)] pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-[var(--color-foreground)]">Total</span>
          <span className="text-2xl font-bold text-[var(--color-foreground)]">₹{((cart.total_paise || 0) / 100).toFixed(2)}</span>
        </div>
      </div>
      
      {mode === "cart" ? (
        <Link href="/checkout" className="block w-full">
          <button className="w-full flex justify-center items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white py-3 rounded-lg font-semibold transition-colors shadow-sm">
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      ) : (
        <button 
          className="w-full flex justify-center items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white py-3 rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={onCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay ₹{((cart.total_paise || 0) / 100).toFixed(2)}
            </>
          )}
        </button>
      )}
      
      <div className={`mt-4 flex items-center justify-center gap-2 text-xs p-2 rounded-lg ${mode === 'checkout' ? 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border border-[var(--color-success-100)]' : 'text-slate-500'}`}>
        <ShieldCheck className="w-4 h-4" />
        <span>Secure encrypted checkout</span>
      </div>
    </div>
  );
}
