// src/app/customer/orders/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import {
  Package, Search, Filter, RefreshCw, X, ChevronRight,
  MapPin, CreditCard, Truck, CheckCircle2, XCircle,
  Clock3, AlertCircle, RotateCcw, ShoppingBag, Store,
  Receipt, ArrowLeft, ExternalLink, Tag, Box
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItemSummary {
  product_id: number;
  product_name: string | null;
  variant_name: string | null;
  image_url: string | null;
  quantity: number;
  unit_price_rupees: number;
  total_rupees: number;
}

interface OrderListItem {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_rupees: number;
  items_count: number;
  items_summary: OrderItemSummary[];
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
}

interface OrderItemDetail extends OrderItemSummary {
  id: number;
  sku: string | null;
  gst_rate_pct: number;
  is_returned: boolean;
  refunded_rupees: number;
  seller_name: string | null;
  seller_logo: string | null;
}

interface SellerOrder {
  id: number;
  seller_name: string | null;
  status: string;
  tracking_number: string | null;
  courier_name: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface PaymentTx {
  id: number;
  type: string;
  amount_rupees: number;
  status: string;
  method: string | null;
  bank: string | null;
  wallet: string | null;
  created_at: string;
}

interface TimelineStep {
  step: number;
  event: string;
  label: string;
  timestamp: string | null;
  completed: boolean;
  color: string;
}

interface Financial {
  subtotal_rupees: number;
  discount_rupees: number;
  coupon_discount_rupees: number;
  shipping_rupees: number;
  cod_charge_rupees: number;
  tax_rupees: number;
  total_rupees: number;
}

interface OrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  delivery_address: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: OrderItemDetail[];
  seller_orders: SellerOrder[];
  payment_transactions: PaymentTx[];
  financial: Financial;
  timeline: TimelineStep[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon: React.ReactNode }> = {
  pending:           { label: "Pending",          bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500",   icon: <Clock3 className="w-3.5 h-3.5" /> },
  confirmed:         { label: "Confirmed",         bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  packed:            { label: "Packed",            bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500", icon: <Box className="w-3.5 h-3.5" /> },
  shipped:           { label: "Shipped",           bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500",  icon: <Truck className="w-3.5 h-3.5" /> },
  out_for_delivery:  { label: "Out for Delivery",  bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", icon: <Truck className="w-3.5 h-3.5" /> },
  delivered:         { label: "Delivered",         bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled:         { label: "Cancelled",         bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500",    icon: <XCircle className="w-3.5 h-3.5" /> },
  refunded:          { label: "Refunded",          bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200",  dot: "bg-slate-400",  icon: <RotateCcw className="w-3.5 h-3.5" /> },
  return_requested:  { label: "Return Requested",  bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  payment_pending:   { label: "Payment Pending",   bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500", icon: <Clock3 className="w-3.5 h-3.5" /> },
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending", paid: "Paid", cod_pending: "COD – Pay on Delivery",
  failed: "Failed", refunded: "Refunded",
};

const TIMELINE_DOT_COLORS: Record<string, string> = {
  blue: "bg-blue-500 ring-blue-100", indigo: "bg-indigo-500 ring-indigo-100",
  violet: "bg-violet-500 ring-violet-100", amber: "bg-amber-500 ring-amber-100",
  orange: "bg-orange-500 ring-orange-100", green: "bg-green-500 ring-green-100",
  red: "bg-red-500 ring-red-100", slate: "bg-slate-300 ring-slate-100",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function rupees(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onSelect }: { order: OrderListItem; onSelect: () => void }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div
      onClick={onSelect}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Status accent bar */}
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-slate-800 text-base">#{order.order_number}</h3>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-slate-800">{rupees(order.total_rupees)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{order.items_count} item{order.items_count !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Item thumbnails */}
        {order.items_summary.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {order.items_summary.map((item, i) => (
              <div key={i} className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url || '/images/logo.svg'} alt={item.product_name || ""} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/logo.svg'; }} />
                ) : (
                  <Package className="w-5 h-5 text-slate-300" />
                )}
              </div>
            ))}
            {order.items_count > 3 && (
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-500">+{order.items_count - 3}</span>
              </div>
            )}
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-sm font-medium text-slate-700 truncate">
                {order.items_summary[0]?.product_name || "Order items"}
                {order.items_count > 1 && ` +${order.items_count - 1} more`}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CreditCard className="w-3.5 h-3.5" />
            <span className="capitalize">{order.payment_method?.replace("_", " ") || "—"}</span>
          </div>
          <span className="text-xs font-semibold text-[var(--color-primary-600)] group-hover:text-[var(--color-primary-700)] flex items-center gap-1 transition-colors">
            View Details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "items" | "payment" | "address">("timeline");

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/api/v1/shop/orders/my-orders/${orderId}`)
      .then((res: any) => setData(res))
      .catch((e: any) => setError(e.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const tabs = [
    { id: "timeline" as const, label: "Timeline" },
    { id: "items" as const, label: `Items${data ? ` (${data.items.length})` : ""}` },
    { id: "payment" as const, label: "Payment" },
    { id: "address" as const, label: "Delivery" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white h-full overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: "slideInRight 0.25s ease" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-white flex-shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
            ) : data ? (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-800">#{data.order_number}</h2>
                <StatusBadge status={data.status} />
              </div>
            ) : null}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[var(--color-primary-500)] text-[var(--color-primary-600)]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1 pt-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-32" />
                    <div className="h-2 bg-slate-100 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* TIMELINE TAB */}
              {activeTab === "timeline" && (
                <div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-slate-100" />
                    <div className="space-y-5">
                      {data.timeline.map((step, i) => {
                        const dotStyle = step.completed
                          ? TIMELINE_DOT_COLORS[step.color] || "bg-slate-400 ring-slate-100"
                          : "bg-white border-2 border-slate-200 ring-slate-50";
                        return (
                          <div key={i} className="flex gap-4 relative">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ring-4 z-10 ${dotStyle}`}>
                              {step.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="pb-1 flex-1">
                              <p className={`text-sm font-semibold ${step.completed ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                              {step.timestamp && (
                                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(step.timestamp)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cancellation reason */}
                  {data.cancellation_reason && (
                    <div className="mt-5 p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs font-semibold text-red-600 mb-1">Cancellation Reason</p>
                      <p className="text-sm text-red-700">{data.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Seller shipping info */}
                  {data.seller_orders.some(so => so.tracking_number) && (
                    <div className="mt-5 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tracking</h4>
                      {data.seller_orders.filter(so => so.tracking_number).map(so => (
                        <div key={so.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-800">{so.courier_name || "Courier"}</span>
                          </div>
                          <p className="text-xs text-amber-700 font-mono">{so.tracking_number}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ITEMS TAB */}
              {activeTab === "items" && (
                <div className="space-y-3">
                  {data.items.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url || '/images/logo.svg'} alt={item.product_name || ""} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/logo.svg'; }} />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.product_name || "Product"}</p>
                        {item.variant_name && <p className="text-xs text-slate-500 mt-0.5">{item.variant_name}</p>}
                        {item.seller_name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-400">{item.seller_name}</p>
                          </div>
                        )}
                        {item.sku && <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">Qty: {item.quantity} × {rupees(item.unit_price_rupees)}</span>
                          <span className="text-sm font-bold text-slate-800">{rupees(item.total_rupees)}</span>
                        </div>
                        {item.is_returned && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-semibold">
                            <RotateCcw className="w-2.5 h-2.5" /> Returned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Financial summary */}
                  <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <FinRow label="Subtotal" val={data.financial.subtotal_rupees} />
                      {data.financial.discount_rupees > 0 && <FinRow label="Discount" val={-data.financial.discount_rupees} green />}
                      {data.financial.coupon_discount_rupees > 0 && <FinRow label="Coupon Discount" val={-data.financial.coupon_discount_rupees} green />}
                      {data.financial.shipping_rupees > 0 && <FinRow label="Shipping" val={data.financial.shipping_rupees} />}
                      {data.financial.cod_charge_rupees > 0 && <FinRow label="COD Charge" val={data.financial.cod_charge_rupees} />}
                      {data.financial.tax_rupees > 0 && <FinRow label="Tax" val={data.financial.tax_rupees} />}
                      <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between">
                        <span className="font-bold text-slate-800">Total</span>
                        <span className="font-black text-slate-800 text-base">{rupees(data.financial.total_rupees)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT TAB */}
              {activeTab === "payment" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Details</h4>
                    <div className="space-y-2.5">
                      <InfoRow label="Method" value={(data.payment_method || "—").replace(/_/g, " ")} icon={<CreditCard className="w-4 h-4" />} />
                      <InfoRow label="Status" value={PAYMENT_STATUS_LABELS[data.payment_status] || data.payment_status} icon={<Receipt className="w-4 h-4" />} />
                      <InfoRow label="Amount" value={rupees(data.financial.total_rupees)} icon={<Tag className="w-4 h-4" />} />
                      {data.paid_at && <InfoRow label="Paid On" value={formatDateTime(data.paid_at) || "—"} icon={<CheckCircle2 className="w-4 h-4" />} />}
                    </div>
                  </div>

                  {data.payment_transactions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Transaction History</h4>
                      <div className="space-y-2">
                        {data.payment_transactions.map(tx => (
                          <div key={tx.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-slate-600 capitalize">{tx.type}</span>
                              <StatusBadge status={tx.status === "paid" ? "confirmed" : tx.status === "refunded" ? "refunded" : "cancelled"} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">
                                {tx.method && <span className="capitalize">{tx.method}</span>}
                                {tx.bank && ` · ${tx.bank}`}
                                {tx.wallet && ` · ${tx.wallet}`}
                              </span>
                              <span className="text-sm font-bold text-slate-700">{rupees(tx.amount_rupees)}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(tx.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADDRESS TAB */}
              {activeTab === "address" && data.delivery_address && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[var(--color-primary-600)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{data.delivery_address.name}</p>
                      <p className="text-xs text-slate-500">{data.delivery_address.phone}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{data.delivery_address.line1}</p>
                  {data.delivery_address.line2 && <p className="text-sm text-slate-700">{data.delivery_address.line2}</p>}
                  <p className="text-sm text-slate-700">{data.delivery_address.city}, {data.delivery_address.state} – {data.delivery_address.pincode}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{data.delivery_address.country}</p>

                  {data.notes && (
                    <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Order Notes</p>
                      <p className="text-sm text-slate-700">{data.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  );
}

function FinRow({ label, val, green }: { label: string; val: number; green?: boolean }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className={green ? "text-green-600 font-semibold" : ""}>
        {green ? "−" : ""}{rupees(Math.abs(val))}
      </span>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 capitalize">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["", "pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async (p = 1, q = search, s = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, per_page: 10 };
      if (q) params.search = q;
      if (s) params.status = s;
      const res: any = await api.get("/api/v1/shop/orders/my-orders", params);
      setOrders(res?.orders || []);
      setTotal(res?.total || 0);
      setPages(res?.pages || 1);
      setPage(p);
    } catch (e: any) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchOrders(1, search, statusFilter), search ? 400 : 0);
  }, [search, statusFilter]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[var(--color-primary-600)]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">My Orders</h1>
              <p className="text-sm text-slate-500">Track and manage your purchases</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] shadow-sm cursor-pointer"
            >
              <option value="">All Orders</option>
              {ORDER_STATUSES.filter(Boolean).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchOrders(page)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 shadow-sm disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Total count */}
        {!loading && !error && (
          <p className="text-sm text-slate-500 mb-4">
            {total > 0 ? `Showing ${orders.length} of ${total} orders` : "No orders found"}
          </p>
        )}

        {/* Content */}
        {error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Something went wrong</h3>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchOrders(1)}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary-500)] text-white text-sm font-semibold hover:bg-[var(--color-primary-600)] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-1 bg-slate-200 w-full" />
                <div className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-slate-200 rounded w-28" />
                    <div className="h-5 bg-slate-200 rounded w-16" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-14 h-14 rounded-xl bg-slate-100" />
                    <div className="w-14 h-14 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 w-full" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-slate-100 rounded w-20" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <ShoppingBag className="w-14 h-14 text-slate-200 mx-auto mb-5" />
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No Orders Yet</h3>
            <p className="text-slate-400 text-sm">
              {search || statusFilter ? "Try clearing your filters." : "Your order history will appear here."}
            </p>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); }}
                className="mt-4 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={() => setSelectedOrderId(order.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchOrders(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 px-2">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => fetchOrders(page + 1)}
                  disabled={page >= pages || loading}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail slide-over */}
      {selectedOrderId !== null && (
        <DetailPanel
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </main>
  );
}
