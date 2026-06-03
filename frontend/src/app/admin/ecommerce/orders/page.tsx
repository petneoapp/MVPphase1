"use client";

import React from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { TimelineView } from "@/components/common/TimelineView";
import { Card, CardContent } from "@/components/common/ui/Card";

export default function OrdersAdminPage() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" },
    { label: "Ecommerce", href: "/admin/ecommerce" },
    { label: "Orders", href: "/admin/ecommerce/orders" },
  ];

  const MOCK_ORDER_EVENTS = [
    {
      id: "ev_1",
      title: "Order Placed",
      description: "Order #ORD-2024-8933 created successfully.",
      timestamp: "Today, 10:45 AM",
      status: "completed" as const
    },
    {
      id: "ev_2",
      title: "Payment Verified",
      description: "Payment of ₹1,200 processed via Razorpay.",
      timestamp: "Today, 10:46 AM",
      status: "completed" as const
    },
    {
      id: "ev_3",
      title: "Fulfillment Started",
      description: "Order has been routed to warehouse for picking.",
      timestamp: "Today, 11:30 AM",
      status: "pending" as const
    }
  ];

  return (
    <AdminShell title="Order Tracking & Management" breadcrumbs={breadcrumbs}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Orders</h3>
              <p className="text-slate-500 mb-4">Select an order from the list (mocked view).</p>
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer border-l-4 border-l-[var(--color-primary-500)]">
                <div className="flex justify-between">
                  <span className="font-bold">#ORD-2024-8933</span>
                  <span className="text-slate-500">₹1,200</span>
                </div>
                <div className="text-sm text-slate-500 mt-1">John Doe • 3 items</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Order Timeline</h3>
              <TimelineView events={MOCK_ORDER_EVENTS} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
