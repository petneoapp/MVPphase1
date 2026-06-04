"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Percent,
  Coins,
  Truck,
  Calendar,
  UserCheck,
  CheckCircle,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/common/ui/Table";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { api as apiClient } from "@/utils/api";

interface CouponItem {
  id: number;
  code: string;
  coupon_type: string;
  description: string | null;
  discount_value: number;
  min_order_paise: number | null;
  max_discount_paise: number | null;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  usage_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface CouponListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: CouponItem[];
}

export default function AdminPromotionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [couponType, setCouponType] = useState("percentage");
  const [description, setDescription] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderRupees, setMinOrderRupees] = useState("");
  const [maxDiscountRupees, setMaxDiscountRupees] = useState("");
  const [usageLimitTotal, setUsageLimitTotal] = useState("");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page: 1, limit: 50 };
      if (search.trim().length >= 2) {
        params.search = search.trim();
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await apiClient.get("/admin/promotions", { params });
      setCoupons(response.data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch coupons:", err);
      setError(err?.message || "Failed to load promotions catalog");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 450);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleToggleActive = async (id: number) => {
    try {
      await apiClient.patch(`/admin/promotions/${id}/toggle`);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this coupon? This action cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/promotions/${id}`);
      fetchCoupons();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setCouponType("percentage");
    setDescription("");
    setDiscountValue("");
    setMinOrderRupees("");
    setMaxDiscountRupees("");
    setUsageLimitTotal("");
    setUsageLimitPerUser("");
    setValidFrom("");
    setValidUntil("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setCouponType(coupon.coupon_type);
    setDescription(coupon.description || "");
    
    // Percentage is stored as e.g. 15.00, flat_amount is stored in paise
    if (coupon.coupon_type === "flat_amount") {
      setDiscountValue((coupon.discount_value / 100).toString());
    } else {
      setDiscountValue(coupon.discount_value.toString());
    }
    
    setMinOrderRupees(coupon.min_order_paise ? (coupon.min_order_paise / 100).toString() : "");
    setMaxDiscountRupees(coupon.max_discount_paise ? (coupon.max_discount_paise / 100).toString() : "");
    setUsageLimitTotal(coupon.usage_limit_total ? coupon.usage_limit_total.toString() : "");
    setUsageLimitPerUser(coupon.usage_limit_per_user ? coupon.usage_limit_per_user.toString() : "");
    
    // Format datetimes to match datetime-local format: YYYY-MM-DDTHH:MM
    const formatDateTime = (isoStr: string | null) => {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    setValidFrom(formatDateTime(coupon.valid_from));
    setValidUntil(formatDateTime(coupon.valid_until));
    setIsActive(coupon.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !discountValue.trim()) {
      alert("Coupon code and discount value are required.");
      return;
    }

    setIsSaving(true);
    try {
      // Calculate discount value depending on coupon type (flat_amount converted to paise)
      let calculatedDiscount = parseFloat(discountValue);
      if (couponType === "flat_amount") {
        calculatedDiscount = Math.round(calculatedDiscount * 100);
      }

      const minOrderPaise = minOrderRupees.trim() ? Math.round(parseFloat(minOrderRupees) * 100) : null;
      const maxDiscountPaise = maxDiscountRupees.trim() ? Math.round(parseFloat(maxDiscountRupees) * 100) : null;

      const payload = {
        code: code.trim().toUpperCase(),
        coupon_type: couponType,
        description: description.trim() || null,
        discount_value: calculatedDiscount,
        min_order_paise: minOrderPaise,
        max_discount_paise: maxDiscountPaise,
        usage_limit_total: usageLimitTotal.trim() ? parseInt(usageLimitTotal) : null,
        usage_limit_per_user: usageLimitPerUser.trim() ? parseInt(usageLimitPerUser) : null,
        valid_from: validFrom ? new Date(validFrom).toISOString() : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: isActive
      };

      if (editingCoupon) {
        await apiClient.put(`/admin/promotions/${editingCoupon.id}`, payload);
      } else {
        await apiClient.post("/admin/promotions", payload);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      alert(`Failed to save coupon: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isExpired = (coupon: CouponItem) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const formatDiscount = (coupon: CouponItem) => {
    if (coupon.coupon_type === "percentage") {
      return `${parseFloat(coupon.discount_value.toString())}% Off`;
    } else if (coupon.coupon_type === "flat_amount") {
      return `₹${(coupon.discount_value / 100).toFixed(2)} Off`;
    } else if (coupon.coupon_type === "free_shipping") {
      return "Free Shipping";
    }
    return coupon.discount_value.toString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Promotions & Coupons</h1>
          <p className="text-slate-500 mt-1">Create discount codes, manage validity, and track coupon usages.</p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateModal}
          className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="border-b-0 pb-0">
          <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
            <div className="flex-1 w-full max-w-md">
              <Input
                placeholder="Search coupons by code or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-slate-50"
              />
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {[
                { name: "All Coupons", key: "all" },
                { name: "Active", key: "active" },
                { name: "Inactive", key: "inactive" },
                { name: "Expired", key: "expired" }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    statusFilter === opt.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Discount Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Usage Stats</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Active Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-5 bg-slate-200 rounded w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-12"></div></TableCell>
                    <TableCell><div className="h-8 bg-slate-200 rounded-xl w-16 ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No promotional coupons found.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => {
                  const expired = isExpired(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div>
                          <span className="font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-sm font-bold border border-slate-200 shadow-sm">
                            {coupon.code}
                          </span>
                          {coupon.description && (
                            <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={coupon.description}>
                              {coupon.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <td className="p-4 font-bold text-slate-900">
                        {formatDiscount(coupon)}
                      </td>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {coupon.coupon_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-800">
                          {coupon.usage_count} / {coupon.usage_limit_total ?? "∞"}
                        </div>
                        {coupon.usage_limit_per_user && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Max {coupon.usage_limit_per_user} per customer
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5 text-slate-600">
                          {coupon.valid_from && (
                            <div>From: {new Date(coupon.valid_from).toLocaleDateString()}</div>
                          )}
                          {coupon.valid_until ? (
                            <div className={expired ? "text-rose-600 font-semibold flex items-center gap-1" : ""}>
                              Until: {new Date(coupon.valid_until).toLocaleDateString()}
                              {expired && <span className="text-[10px] bg-rose-50 border border-rose-200 px-1 rounded">Expired</span>}
                            </div>
                          ) : (
                            <div className="text-slate-400">No Expiry</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(coupon.id)}
                          className="text-slate-500 hover:text-slate-900 transition-colors focus:outline-none"
                          title={coupon.is_active ? "Deactivate Coupon" : "Activate Coupon"}
                        >
                          {coupon.is_active ? (
                            <ToggleRight className="w-9 h-9 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-9 h-9 text-slate-300" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(coupon)}
                            title="Edit Coupon"
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(coupon.id)}
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCoupon ? "Edit Promotion Coupon" : "Create Promotional Coupon"}
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Configure discount code parameters, constraints, and runtime limits.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Coupon Code"
                  placeholder="E.g., SUMMER50"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="uppercase font-mono"
                  disabled={!!editingCoupon}
                />
                
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Coupon Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat_amount">Flat Amount Discount (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>

              <Input
                label="Description"
                placeholder="Details about what the discount offers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={couponType === "percentage" ? "Percentage Value" : couponType === "free_shipping" ? "Value (N/A)" : "Flat Rupees Value"}
                  type="number"
                  placeholder={couponType === "percentage" ? "15" : couponType === "free_shipping" ? "0" : "50.00"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={couponType === "free_shipping"}
                />

                <Input
                  label="Min Order (₹)"
                  type="number"
                  placeholder="0.00"
                  value={minOrderRupees}
                  onChange={(e) => setMinOrderRupees(e.target.value)}
                />

                <Input
                  label="Max Discount (₹)"
                  type="number"
                  placeholder="None"
                  value={maxDiscountRupees}
                  onChange={(e) => setMaxDiscountRupees(e.target.value)}
                  disabled={couponType !== "percentage"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Usage Limit (Total)"
                  type="number"
                  placeholder="Unlimited"
                  value={usageLimitTotal}
                  onChange={(e) => setUsageLimitTotal(e.target.value)}
                />

                <Input
                  label="Usage Limit (Per User)"
                  type="number"
                  placeholder="Unlimited"
                  value={usageLimitPerUser}
                  onChange={(e) => setUsageLimitPerUser(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Valid From</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Valid Until</label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="text-slate-500 focus:outline-none"
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
                <span className="text-sm font-medium text-slate-700">Status is active immediately</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {editingCoupon ? "Save Changes" : "Create Coupon"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
