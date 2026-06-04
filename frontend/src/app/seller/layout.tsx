import React from "react";
import Link from "next/link";
import { Store, Package, ShoppingBag, LogOut, ChevronRight } from "lucide-react";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Store className="w-6 h-6" />
            <span>Seller Portal</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/seller/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <Store className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/seller/products" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">Products</span>
          </Link>
          <Link href="/seller/orders" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">Orders</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Exit Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <Store className="w-5 h-5" />
            <span>Seller Portal</span>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
