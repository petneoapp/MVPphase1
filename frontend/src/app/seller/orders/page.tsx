"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Truck, Package, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/common/ui/Input";
import { Button } from "@/components/common/ui/Button";
import { api } from "@/utils/api";

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data: any = await api.get("/partner/shop/orders", undefined, "partner");
      setOrders(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, currentStatus: string) => {
    setUpdating(orderId);
    try {
      let newStatus = "";
      if (currentStatus === "confirmed") newStatus = "packed";
      else if (currentStatus === "packed") newStatus = "shipped";
      else return;

      const payload: any = { newStatus };
      if (newStatus === "shipped") {
        payload.tracking_number = "TRK" + Math.floor(Math.random() * 1000000);
        payload.courier_name = "FastShip";
      }

      await api.patch(`/partner/shop/orders/${orderId}/status?new_status=${newStatus}&tracking_number=${payload.tracking_number || ''}&courier_name=${payload.courier_name || ''}`, undefined, undefined, "partner");
      await fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
        <p className="text-slate-500 mt-1">Track and manage your customer orders.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Input placeholder="Search orders..." leftIcon={<Search className="w-4 h-4"/>} className="max-w-md"/>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500">You haven't received any orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="p-4">Order Info</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4 text-right">Revenue</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">
                      #{order.order_number}
                      {order.tracking_number && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> {order.tracking_number}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-600">{order.item_count} items</td>
                    <td className="p-4 text-right font-semibold text-slate-900">?{(order.seller_earnings_paise / 100).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {order.status === "confirmed" && <CheckCircle className="w-3 h-3 text-indigo-500" />}
                        {order.status === "packed" && <Package className="w-3 h-3 text-amber-500" />}
                        {order.status === "shipped" && <Truck className="w-3 h-3 text-blue-500" />}
                        {order.status === "pending" && <Clock className="w-3 h-3 text-slate-500" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {order.status === "confirmed" && (
                        <Button size="sm" onClick={() => updateStatus(order.id, order.status)} disabled={updating === order.id}>Pack Order</Button>
                      )}
                      {order.status === "packed" && (
                        <Button size="sm" className="bg-indigo-600" onClick={() => updateStatus(order.id, order.status)} disabled={updating === order.id}>Ship Order</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
