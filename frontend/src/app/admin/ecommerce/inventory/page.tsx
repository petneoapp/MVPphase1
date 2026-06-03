"use client";

import React from "react";
import { Package, AlertTriangle, ArrowRight } from "lucide-react";
import { OperationsShell } from "@/components/layout/OperationsShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/common/ui/Card";
import { Button } from "@/components/common/ui/Button";

const INVENTORY_DATA = [
  { sku: "PN-FOOD-01", name: "Premium Dog Food", stock: 45, status: "completed" as const },
  { sku: "PN-TOY-04", name: "Interactive Cat Wand", stock: 8, status: "pending" as const },
  { sku: "PN-MED-12", name: "Joint Supplements", stock: 0, status: "error" as const },
];

export default function InventoryAdminPage() {
  const tabs = [
    { label: "All Items", active: true },
    { label: "Low Stock", active: false },
    { label: "Out of Stock", active: false },
  ];

  return (
    <OperationsShell title="Inventory Management" tabs={tabs}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Products</p>
              <h4 className="text-2xl font-bold text-slate-900">1,248</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Low Stock Alerts</p>
              <h4 className="text-2xl font-bold text-slate-900">24</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">SKU</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Product Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Stock Level</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {INVENTORY_DATA.map((item) => (
              <tr key={item.sku} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.sku}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.name}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.stock} units</td>
                <td className="px-6 py-4">
                  <StatusBadge 
                    status={item.status} 
                    label={item.stock === 0 ? "Out of Stock" : item.stock < 10 ? "Low Stock" : "In Stock"} 
                  />
                </td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OperationsShell>
  );
}
