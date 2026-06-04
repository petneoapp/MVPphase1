"use client";

import React, { useState, useEffect } from "react";
import { Plus, PackageSearch, ArrowRight, Package, Search, Edit2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Badge } from "@/components/common/ui/Badge";
import { api } from "@/utils/api";

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialForm = { name: "", brand: "", description: "", price_paise: 0, mrp_paise: 0, stock_qty: 0, category_id: 1, gst_rate_pct: 18 };
  const [formData, setFormData] = useState(initialForm);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/partner/shop/products?page=${page}&limit=12`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;

      const res: any = await api.get(url, undefined, "partner"); 
      setProducts(res.items || []);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/partner/shop/products", formData, "partner");
      alert("Product created as draft!");
      setShowAdd(false);
      setFormData(initialForm);
      fetchProducts();
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = async (id: number) => {
    setLoading(true);
    try {
      const detail: any = await api.get(`/partner/shop/products/${id}`, undefined, "partner");
      setFormData({
        name: detail.name || "",
        brand: detail.brand || "",
        description: detail.description || "",
        price_paise: detail.price_paise || 0,
        mrp_paise: detail.mrp_paise || 0,
        stock_qty: detail.stock_qty || 0,
        category_id: detail.category_id || 1,
        gst_rate_pct: detail.gst_rate_pct || 18
      });
      setEditId(id);
      setShowEdit(true);
    } catch (err: any) {
      alert("Failed to load details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        price_paise: formData.price_paise,
        mrp_paise: formData.mrp_paise,
        stock_qty: formData.stock_qty,
        gst_rate_pct: formData.gst_rate_pct
      };
      await api.put(`/partner/shop/products/${editId}`, payload, "partner");
      alert("Product updated!");
      setShowEdit(false);
      setEditId(null);
      setFormData(initialForm);
      fetchProducts();
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    try {
      await api.delete(`/partner/shop/products/${id}`, "partner");
      alert("Product archived");
      fetchProducts();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSubmitReview = async (id: number) => {
    try {
      await api.post(`/partner/shop/products/${id}/submit`, {}, "partner");
      alert("Submitted for review");
      fetchProducts();
    } catch (err: any) {
      alert("Failed to submit: " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge variant="success">Approved</Badge>;
      case "pending_review": return <Badge variant="warning">Pending Review</Badge>;
      case "rejected": return <Badge variant="danger">Rejected</Badge>;
      case "archived": return <Badge variant="outline">Archived</Badge>;
      default: return <Badge variant="default">Draft</Badge>;
    }
  };

  if (showAdd || showEdit) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{showEdit ? "Edit Product" : "Add New Product"}</h2>
          <Button variant="outline" onClick={() => { setShowAdd(false); setShowEdit(false); setFormData(initialForm); }}>Cancel</Button>
        </div>
        <form onSubmit={showEdit ? handleUpdate : handleCreate} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 max-w-2xl">
          <Input label="Product Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Input label="Brand" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea className="w-full border-slate-200 rounded-xl p-3 border" required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (?)" type="number" required value={formData.price_paise / 100} onChange={e => setFormData({...formData, price_paise: parseFloat(e.target.value) * 100})} />
            <Input label="MRP (?)" type="number" required value={formData.mrp_paise / 100} onChange={e => setFormData({...formData, mrp_paise: parseFloat(e.target.value) * 100})} />
            <Input label="Stock Qty" type="number" required value={formData.stock_qty} onChange={e => setFormData({...formData, stock_qty: parseInt(e.target.value)})} />
            <Input label="Category ID" type="number" required value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} />
          </div>
          <Button type="submit" className="w-full bg-indigo-600" disabled={submitting}>
            {submitting ? "Saving..." : (showEdit ? "Update Product" : "Create Product Draft")}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-slate-500 mt-1">Manage your store's inventory and listings.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-5 h-5 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input 
          placeholder="Search products..." 
          leftIcon={<Search className="w-4 h-4"/>} 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-md"
        />
        <select 
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading && products.length === 0 ? (
        <div className="text-center p-12 text-slate-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mt-6">
          <PackageSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">Try adjusting your filters or add a new product.</p>
          <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl" onClick={() => setShowAdd(true)}>
            Create Listing <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative">
                  {p.primary_image ? (
                    <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                    {p.stock_qty} in stock
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-1 flex-1">{p.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 flex-1">{p.brand}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-black text-lg text-slate-900">?{(p.price_paise / 100).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(p.id)}>
                      <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {(p.status === "draft" || p.status === "rejected") && (
                      <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleSubmitReview(p.id)} title="Submit for Review">
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
