"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/common/ui/Table";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { api as apiClient } from "@/utils/api";

interface OrderListItem {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_paise: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface OrderListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: OrderListItem[];
}

interface OrderItemDetail {
  id: number;
  product_name: string;
  variant_name: string | null;
  price_paise: number;
  quantity: number;
}

interface OrderSellerGroup {
  id: number;
  seller_name: string;
  subtotal_paise: number;
  status: string;
}

interface OrderDetail {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address_line1: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  total_paise: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  items: OrderItemDetail[];
  seller_orders: OrderSellerGroup[];
}

const statusOptions = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded"
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 15 };
      if (search.trim().length >= 2) {
        params.search = search.trim();
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await apiClient.get("/admin/orders", { params });
      setOrders(response.data.items || []);
      setTotalOrders(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
      setCurrentPage(response.data.page || 1);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      setError(err?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleFetchDetail = async (id: number) => {
    setSelectedOrderId(id);
    setIsDetailLoading(true);
    try {
      const response = await apiClient.get(`/admin/orders/${id}`);
      setOrderDetail(response.data);
    } catch (err: any) {
      console.error("Failed to fetch order detail:", err);
      alert(`Failed to load order details: ${err.message}`);
      setSelectedOrderId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!orderDetail) return;
    if (!confirm(`Are you sure you want to update order status to ${newStatus}?`)) return;

    setIsUpdatingStatus(true);
    try {
      await apiClient.patch(`/admin/orders/${orderDetail.id}/status`, {
        status: newStatus
      });
      // Refresh current details and list
      await handleFetchDetail(orderDetail.id);
      fetchOrders(currentPage);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "success" | "warning" | "danger" | "destructive" | "info" | "outline" => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "success";
      case "shipped":
      case "processing":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
      case "refunded":
        return "danger";
      case "paid":
        return "success";
      default:
        return "default";
    }
  };

  const getTimelineSteps = (currentStatus: string) => {
    const steps = [
      { name: "Pending", key: "pending" },
      { name: "Paid", key: "paid" },
      { name: "Processing", key: "processing" },
      { name: "Shipped", key: "shipped" },
      { name: "Delivered", key: "delivered" }
    ];

    const isCancelled = ["cancelled", "refunded"].includes(currentStatus.toLowerCase());
    if (isCancelled) {
      steps.push({ name: currentStatus.toUpperCase(), key: currentStatus });
    }

    const currentIndex = steps.findIndex(step => step.key === currentStatus.toLowerCase());

    return steps.map((step, idx) => {
      let isCompleted = false;
      let isCurrent = false;

      if (isCancelled) {
        if (step.key === currentStatus) {
          isCurrent = true;
        } else if (idx < steps.length - 1) {
          isCompleted = true;
        }
      } else {
        if (idx < currentIndex) {
          isCompleted = true;
        } else if (idx === currentIndex) {
          isCurrent = true;
        }
      }

      return {
        ...step,
        isCompleted,
        isCurrent
      };
    });
  };

  return (
    <div className="relative min-h-screen space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500 mt-1">Track payments, updates status, and review platform-wide customer orders.</p>
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
          <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
            <div className="flex-1 w-full max-w-md">
              <Input
                placeholder="Search orders by number, customer, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-slate-50"
              />
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all capitalize whitespace-nowrap ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Orders
              </button>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all capitalize whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Info</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-slate-200 rounded w-24"></div></TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-40"></div>
                    </TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-16"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-20"></div></TableCell>
                    <TableCell><div className="h-8 bg-slate-200 rounded-xl w-16 ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No orders found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-semibold text-slate-900">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{order.customer_name}</div>
                        <div className="text-xs text-slate-500">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      ₹{(order.total_paise / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFetchDetail(order.id)}
                        className="text-slate-700 hover:text-slate-950 font-medium inline-flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                Showing Page {currentPage} of {totalPages} ({totalOrders} orders total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => fetchOrders(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => fetchOrders(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-over Detail Drawer */}
      {selectedOrderId && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 transition-opacity"
            onClick={() => setSelectedOrderId(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {isDetailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
                <span className="text-slate-500 text-sm">Loading order details...</span>
              </div>
            ) : orderDetail ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Details</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{orderDetail.order_number}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-2 hover:bg-slate-200/60 rounded-full transition-colors text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                  {/* Status & Quick Actions */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 font-medium">Current Status</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(orderDetail.status)} className="text-sm px-3 py-1">
                          {orderDetail.status}
                        </Badge>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-sm capitalize">{orderDetail.payment_status} Payment</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 font-medium">Update Status</div>
                      <select
                        disabled={isUpdatingStatus}
                        value={orderDetail.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all disabled:opacity-50"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vertical Progress Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" /> Order Progress Timeline
                    </h3>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {getTimelineSteps(orderDetail.status).map((step, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <span
                            className={`absolute left-[-20px] top-1.5 w-[12px] h-[12px] rounded-full border-2 bg-white transition-all ${
                              step.isCurrent
                                ? "border-slate-900 scale-125 ring-4 ring-slate-100"
                                : step.isCompleted
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-slate-200"
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                step.isCurrent ? "text-slate-900" : "text-slate-600"
                              }`}
                            >
                              {step.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer & Shipping Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" /> Customer Information
                      </h3>
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Name:</span>
                          <span className="font-semibold text-slate-900">{orderDetail.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email:</span>
                          <span className="font-medium text-slate-800">{orderDetail.customer_email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" /> Shipping Details
                      </h3>
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                        <div>
                          <div className="font-semibold text-slate-900">{orderDetail.delivery_name || "—"}</div>
                          <div className="text-slate-600 mt-1">
                            {orderDetail.delivery_address_line1 || "—"}
                            <br />
                            {orderDetail.delivery_city && `${orderDetail.delivery_city}, `}
                            {orderDetail.delivery_state && `${orderDetail.delivery_state} `}
                            {orderDetail.delivery_pincode && ` - ${orderDetail.delivery_pincode}`}
                          </div>
                          {orderDetail.delivery_phone && (
                            <div className="text-slate-500 mt-2">Phone: {orderDetail.delivery_phone}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seller Group Information */}
                  {orderDetail.seller_orders && orderDetail.seller_orders.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-500" /> Seller Packages
                      </h3>
                      <div className="space-y-3">
                        {orderDetail.seller_orders.map((so) => (
                          <div
                            key={so.id}
                            className="flex justify-between items-center border border-slate-200/60 rounded-xl p-4 bg-slate-50/50"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">{so.seller_name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">Package ID: SO-{so.id}</div>
                            </div>
                            <div className="text-right space-y-1.5">
                              <div className="font-medium text-slate-900">
                                ₹{(so.subtotal_paise / 100).toFixed(2)}
                              </div>
                              <Badge variant={getStatusBadgeVariant(so.status)}>{so.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-slate-500" /> Order Items ({orderDetail.items.length})
                    </h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
                          <tr>
                            <th className="p-4">Item Details</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4 text-right">Price</th>
                            <th className="p-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderDetail.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <div className="font-semibold text-slate-900">{item.product_name}</div>
                                {item.variant_name && (
                                  <div className="text-xs text-slate-500 mt-0.5">Variant: {item.variant_name}</div>
                                )}
                              </td>
                              <td className="p-4 text-center text-slate-600">{item.quantity}</td>
                              <td className="p-4 text-right text-slate-600">
                                ₹{(item.price_paise / 100).toFixed(2)}
                              </td>
                              <td className="p-4 text-right font-semibold text-slate-900">
                                ₹{((item.price_paise * item.quantity) / 100).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer Sum */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-slate-500" />
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Payment Method</div>
                      <div className="text-sm font-semibold text-slate-900 capitalize">
                        {orderDetail.payment_method || "Online Payment"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Total Amount</div>
                    <div className="text-2xl font-black text-slate-900">
                      ₹{(orderDetail.total_paise / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
