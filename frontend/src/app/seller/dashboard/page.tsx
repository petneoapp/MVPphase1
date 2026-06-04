"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/common/ui/Card";
import { DollarSign, ShoppingBag, Package } from "lucide-react";
import { api } from "@/utils/api";

export default function SellerDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data: any = await api.get("/partner/shop/analytics", undefined, "partner");
        setStats({
          revenue: (data.total_earnings_paise || 0) / 100,
          orders: data.total_orders || 0,
          products: data.active_products || 0
        });
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Seller Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-slate-900">₹{stats.revenue.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Orders</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.orders}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Products</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.products}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No recent activity</h3>
        <p className="text-slate-500 max-w-sm mx-auto">When you receive orders or update your shop, the activity will show up here.</p>
      </div>
    </div>
  );
}
