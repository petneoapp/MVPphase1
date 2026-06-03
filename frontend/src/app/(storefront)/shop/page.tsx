"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Sparkles, Heart, Plus, ChevronRight, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/ecommerce/ProductCard";
import { apiClient } from "@/lib/api/client";

const CATEGORIES = [
  "All Products",
  "Everyday Nutrition",
  "Post-Surgery Recovery",
  "Anxiety & Calm Care",
  "Senior Pet Wellness",
  "Grooming Essentials",
  "Dental Health"
];

// Map category strings to backend slugs if necessary
const categorySlugMap: Record<string, string> = {
  "Everyday Nutrition": "nutrition",
  "Post-Surgery Recovery": "recovery",
  "Anxiety & Calm Care": "anxiety",
  "Senior Pet Wellness": "senior",
  "Grooming Essentials": "grooming",
  "Dental Health": "dental"
};

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: any = { page: 1, limit: 20 };
        
        if (activeCategory !== "All Products" && categorySlugMap[activeCategory]) {
          params.category = categorySlugMap[activeCategory];
        }
        
        if (searchQuery.length > 2) {
          params.search = searchQuery;
        }

        const response = await apiClient.get("/shop/products", { params });
        setProducts(response.data.items || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce fetch

    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-foreground)] tracking-tight mb-4">
              Wellness Shop
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Curated, vet-approved products for your pet's everyday health, specific conditions, and recovery.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Input 
                placeholder="Search products, conditions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-white shadow-[var(--shadow-premium-sm)]"
              />
            </div>
            <Button variant="outline" className="bg-white shadow-[var(--shadow-premium-sm)]" leftIcon={<Filter className="w-4 h-4" />}>
              Filter
            </Button>
          </div>
        </div>

        {/* Categories (Premium Pill Navigation) */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-10 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-premium flex-shrink-0 border ${
                activeCategory === category
                  ? "bg-[var(--color-primary-600)] text-white border-transparent shadow-sm"
                  : "bg-white text-slate-600 border-[var(--color-border)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Active Category Header */}
        <AnimatePresence mode="wait">
          {activeCategory !== "All Products" && (
            <motion.div 
              key="active-category-header"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-primary-50)] border border-white shadow-[var(--shadow-premium-sm)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[var(--color-primary-600)] fill-[var(--color-primary-600)]/20" />
                    {activeCategory}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 font-medium">Showing {products.length} curated products for this wellness concern.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveCategory("All Products")} className="self-start sm:self-auto bg-white/50 hover:bg-white">
                  Clear Filter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {isLoading ? (
          <LoadingState message="Loading curated products..." />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState
              title="No products found"
              description="We couldn't find any products matching your current filters. Try adjusting your search."
              actionLabel="Clear All Filters"
              onAction={() => { setActiveCategory("All Products"); setSearchQuery(""); }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
