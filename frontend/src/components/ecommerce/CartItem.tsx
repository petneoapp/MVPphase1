import React from "react";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";

export interface CartItemProps {
  item: any;
  onUpdateQuantity: (itemId: number, newQty: number) => void;
  onRemove: (itemId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 bg-white border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow-premium-sm)] hover:border-[var(--color-border-hover)] transition-all mb-4">
      <div className="w-full sm:w-32 h-32 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
        {item.product?.primary_image ? (
          <img src={item.product.primary_image} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply" />
        ) : (
          <ShoppingBag className="w-8 h-8 text-slate-300" />
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-[var(--color-primary-600)] uppercase tracking-wider mb-1">
              {item.product?.brand || "PetNeo"}
            </p>
            <h3 className="text-lg font-bold text-[var(--color-foreground)] line-clamp-2">
              {item.product?.name || "Product"}
            </h3>
          </div>
          <p className="text-lg font-bold text-[var(--color-foreground)] whitespace-nowrap ml-4">
            ₹{((item.price_paise * item.quantity) / 100).toFixed(2)}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border border-[var(--color-border)] rounded-lg bg-white">
            <button 
              className="p-2 text-slate-500 hover:text-[var(--color-foreground)] transition-colors disabled:opacity-50"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium text-[var(--color-foreground)]">{item.quantity}</span>
            <button 
              className="p-2 text-slate-500 hover:text-[var(--color-foreground)] transition-colors"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
