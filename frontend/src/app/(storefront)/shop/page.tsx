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
import { api as apiClient } from "@/utils/api";

export default function ShopPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [currentCampaignIdx, setCurrentCampaignIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: any = { page: 1, limit: 20 };
        
        if (activeCategory !== "All Products") {
          // Find the slug for the active category
          const cat = categories.find(c => c.name === activeCategory);
          if (cat) {
            params.category = cat.slug;
          }
        }
        
        if (searchQuery.length > 2) {
          params.search = searchQuery;
        }

        const response = await apiClient.get("/products", params);
        setProducts(response.items || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (categories.length > 0 || activeCategory === "All Products") {
        fetchProducts();
      }
    }, 300); // Debounce fetch

    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery, categories]);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await apiClient.get("/campaigns");
        setCampaigns(Array.isArray(response) ? response : (response?.data || []));
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      }
    };
    fetchCampaigns();
  }, []);

  // Auto-slide campaigns
  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCampaignIdx((prev) => (prev + 1) % campaigns.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/shop/categories");
        setCategories(response || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Campaigns Carousel */}
        {campaigns.length > 0 && (
          <div className="mb-12 relative rounded-2xl overflow-hidden shadow-[var(--shadow-premium-md)] group">
            <div 
              className="flex transition-transform duration-700 ease-in-out" 
              style={{ transform: `translateX(-${currentCampaignIdx * 100}%)` }}
            >
              {campaigns.map((camp, idx) => (
                <div key={camp.id} className="w-full flex-shrink-0 relative">
                  <div className="aspect-[21/9] sm:aspect-[21/7] md:aspect-[21/6] bg-slate-900 w-full relative">
                    {camp.image && (
                      <img src={camp.image} alt={camp.title} className="w-full h-full object-cover opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-8 md:px-16 text-white">
                      <h2 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight">{camp.title}</h2>
                      {camp.description && <p className="text-slate-200 text-sm md:text-lg max-w-xl mb-6">{camp.description}</p>}
                      {camp.target_url && (
                        <a href={camp.target_url} className="self-start px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-slate-100 transition shadow-lg flex items-center gap-2">
                          {camp.cta || "Shop Now"} <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Controls */}
            {campaigns.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {campaigns.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentCampaignIdx(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentCampaignIdx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
        <div className="flex flex-wrap gap-3 mb-10 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
              key="All Products"
              onClick={() => setActiveCategory("All Products")}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-premium flex-shrink-0 border ${
                activeCategory === "All Products"
                  ? "bg-[var(--color-primary-600)] text-white border-transparent shadow-sm"
                  : "bg-white text-slate-600 border-[var(--color-border)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
              }`}
            >
              All Products
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.name)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-premium flex-shrink-0 border ${
                activeCategory === category.name
                  ? "bg-[var(--color-primary-600)] text-white border-transparent shadow-sm"
                  : "bg-white text-slate-600 border-[var(--color-border)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
              }`}
            >
              {category.name}
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
