"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/common/ui/Table";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { api as apiClient } from "@/utils/api";

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  price_paise: number;
  stock_qty: number;
  status: string;
  seller_name: string | null;
}

interface ProductListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: ProductItem[];
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPriceRupees, setEditPriceRupees] = useState("");
  const [editStock, setEditStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
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
      const response = await apiClient.get("/admin/products", { params });
      setProducts(response.data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError(err?.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 450);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this product for the marketplace?")) return;
    try {
      await apiClient.patch(`/admin/products/${id}/approve`);
      fetchProducts();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Reject this product request?")) return;
    try {
      await apiClient.patch(`/admin/products/${id}/reject`);
      fetchProducts();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditBrand(product.brand || "");
    setEditPriceRupees((product.price_paise / 100).toString());
    setEditStock(product.stock_qty.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      const pricePaise = Math.round(parseFloat(editPriceRupees) * 100);
      if (isNaN(pricePaise) || pricePaise < 0) {
        alert("Invalid price value");
        setIsSaving(false);
        return;
      }

      await apiClient.put(`/admin/products/${editingProduct.id}`, {
        name: editName,
        brand: editBrand || null,
        price_paise: pricePaise,
        stock_qty: parseInt(editStock) || 0,
      });

      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(`Failed to save edits: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog Management</h1>
          <p className="text-slate-500 mt-1">Review, approve, and manage products on the PetNeo Marketplace.</p>
        </div>
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
                placeholder="Search products by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-slate-50"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {["all", "pending_review", "approved", "rejected", "draft"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all capitalize whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-slate-100 rounded w-32"></div>
                    </TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-12"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-20"></div></TableCell>
                    <TableCell><div className="h-8 bg-slate-200 rounded-xl w-24 ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No products found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs text-slate-500">PRD-{product.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500">Brand: {product.brand || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{product.seller_name || "Unknown"}</TableCell>
                    <TableCell className="font-semibold text-slate-900">₹{(product.price_paise / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-slate-700 text-sm">{product.stock_qty} units</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "approved" ? "success" :
                          product.status === "pending_review" ? "warning" :
                          product.status === "rejected" ? "danger" : "default"
                        }
                      >
                        {product.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {product.status === "pending_review" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(product.id)}
                              title="Approve Product"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReject(product.id)}
                              title="Reject Product"
                            >
                              <XCircle className="w-4 h-4 text-rose-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(product)}
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Edit Product Details</h3>
              <p className="text-slate-500 text-sm mt-1">Update price, brand, and stock for PRD-{editingProduct?.id}</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Product Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Input
                label="Brand"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price (₹)"
                  type="number"
                  step="0.01"
                  value={editPriceRupees}
                  onChange={(e) => setEditPriceRupees(e.target.value)}
                />
                <Input
                  label="Stock Qty"
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                isLoading={isSaving}
                disabled={isSaving || !editName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
