"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent } from "@/components/common/ui/Card";
import { Input } from "@/components/common/ui/Input";
import { Button } from "@/components/common/ui/Button";

export default function PromotionsAdminPage() {
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" },
    { label: "Ecommerce", href: "/admin/ecommerce" },
    { label: "Promotions", href: "/admin/ecommerce/promotions" },
  ];

  const actions = (
    <Button leftIcon={<Plus className="w-4 h-4" />}>
      Create Promotion
    </Button>
  );

  return (
    <AdminShell title="Promotions & Coupons" breadcrumbs={breadcrumbs} actions={actions}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Create New Coupon</h3>
            
            <div className="space-y-4">
              <Input 
                label="Coupon Code" 
                placeholder="e.g. SUMMER25" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <Input 
                label="Discount Percentage" 
                placeholder="e.g. 15" 
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              
              <div className="pt-4">
                <Button className="w-full">Save Coupon</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Active Promotions</h3>
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[var(--color-primary-600)]">WELCOME10</h4>
                  <p className="text-sm text-slate-500">10% Off First Purchase</p>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  Active
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
