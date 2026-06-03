import React from "react";
import Link from "next/link";
import { Sparkles, Star, Plus } from "lucide-react";
import { Badge } from "@/components/common/ui/Badge";
import { Button } from "@/components/common/ui/Button";

export interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="h-full group flex flex-col bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm hover:shadow-[var(--shadow-premium-md)] hover:border-[var(--color-border-hover)] transition-all duration-300">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="aspect-square bg-[var(--color-surface)] relative overflow-hidden flex items-center justify-center p-8 rounded-t-[var(--radius-card)]">
          {/* Product Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {product.discount_pct && (
              <Badge variant="destructive" className="font-bold shadow-sm">{product.discount_pct}% OFF</Badge>
            )}
            {product.stock_qty < 10 && product.stock_qty > 0 && (
              <Badge variant="warning" className="font-bold shadow-sm">Low Stock</Badge>
            )}
          </div>
          
          {/* Product Image */}
          {product.primary_image ? (
            <div className="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] group-hover:scale-105">
               <img src={product.primary_image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
            </div>
          ) : (
            <div className="w-full h-full bg-slate-50 rounded-full border border-[var(--color-border)] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] group-hover:scale-105">
              <Sparkles className="w-12 h-12 text-slate-300 opacity-50" />
            </div>
          )}
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[var(--color-primary-600)] uppercase tracking-widest">{product.brand || "PetNeo"}</p>
          <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-xs border border-amber-100">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="font-bold text-amber-700">{product.rating_avg?.toFixed(1) || "New"}</span>
          </div>
        </div>
        
        <Link href={`/shop/${product.slug}`} className="block mb-4 flex-grow">
          <h3 className="text-lg font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-primary-600)] transition-colors line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Price</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-black text-[var(--color-foreground)]">₹{((product.price_paise || 0) / 100).toFixed(2)}</p>
              {product.mrp_paise && product.mrp_paise > product.price_paise && (
                <span className="text-sm font-medium text-slate-400 line-through">₹{(product.mrp_paise / 100).toFixed(2)}</span>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            className="rounded-full bg-slate-100 hover:bg-[var(--color-primary-600)] text-slate-700 hover:text-white transition-all shadow-none hover:shadow-[var(--shadow-premium-md)]" 
            disabled={product.stock_qty <= 0}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
