"use client";

import React, { useState, useEffect } from "react";
import { Search, Edit3, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/common/ui/Table";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { api as apiClient } from "@/utils/api";

interface InventoryVariantItem {
  id: number;
  variant_name: string;
  price_paise: number;
  stock_qty: number;
}

interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  brand: string | null;
  stock_qty: number;
  low_stock_threshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  variants: InventoryVariantItem[];
}

interface InventoryListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: InventoryItem[];
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit stock state
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newStock, setNewStock] = useState("");

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page: 1, limit: 50 };
      if (search.length >= 2) {
        params.search = search;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await apiClient.get("/admin/inventory", { params });
      setItems(response.data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch inventory:", err);
      setError(err?.message || "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 450);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const openAdjustmentModal = (item: InventoryItem) => {
    setEditingItem(item);
    setNewStock(item.stock_qty.toString());
    setIsAdjusting(true);
  };

  const handleSaveAdjustment = async () => {
    if (!editingItem) return;
    try {
      const stock = parseInt(newStock);
      if (isNaN(stock) || stock < 0) {
        alert("Please enter a valid stock number");
        return;
      }
      await apiClient.patch(`/admin/inventory/${editingItem.id}/stock`, { stock_qty: stock });
      setIsAdjusting(false);
      fetchInventory();
    } catch (err: any) {
      alert(`Adjustment failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
        <p className="text-slate-500 mt-1">Track stock levels, monitor low stock thresholds, and make adjustments.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="border-b-0 pb-0">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex-1 w-full max-w-md">
              <Input
                placeholder="Search inventory by name, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-slate-50"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {[
                { label: "All Items", val: "all" },
                { label: "Low Stock", val: "low_stock" },
                { label: "Out of Stock", val: "out_of_stock" }
              ].map((filter) => (
                <button
                  key={filter.val}
                  onClick={() => setStatusFilter(filter.val)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    statusFilter === filter.val
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-slate-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-48"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-20"></div></TableCell>
                    <TableCell><div className="h-8 bg-slate-200 rounded-xl w-16 ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No inventory records match your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow 
                    key={item.id}
                    className={
                      item.status === "out_of_stock" ? "bg-rose-50/30 hover:bg-rose-50/50" : 
                      item.status === "low_stock" ? "bg-amber-50/20 hover:bg-amber-50/40" : ""
                    }
                  >
                    <TableCell className="font-mono text-xs text-slate-500">{item.sku || `PN-GEN-${item.id}`}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.brand && <div className="text-xs text-slate-400">Brand: {item.brand}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{item.stock_qty} units</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "out_of_stock" ? "danger" :
                          item.status === "low_stock" ? "warning" : "success"
                        }
                      >
                        {item.status === "out_of_stock" ? "Out of Stock" : 
                         item.status === "low_stock" ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit3 className="w-4 h-4" />}
                        onClick={() => openAdjustmentModal(item)}
                      >
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Stock Modal */}
      {isAdjusting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Adjust Stock Quantity</h3>
              <p className="text-slate-500 text-sm mt-1">Set physical inventory count for {editingItem?.name}</p>
            </div>

            <div className="space-y-2">
              <Input
                label="New Inventory Stock Level"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                min="0"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsAdjusting(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveAdjustment}>
                Save Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
