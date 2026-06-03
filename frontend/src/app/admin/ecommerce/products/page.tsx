"use client";

import React, { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { WorkflowCard } from "@/components/common/WorkflowCard";
import { Input } from "@/components/common/ui/Input";
import { Button } from "@/components/common/ui/Button";

const MOCK_PRODUCTS = [
  { id: "1", title: "Premium Dog Food", status: "Active", metadata: [{ label: "Price", value: "₹2,500" }, { label: "Stock", value: "45 units" }] },
  { id: "2", title: "Cat Grooming Kit", status: "Active", metadata: [{ label: "Price", value: "₹1,200" }, { label: "Stock", value: "12 units" }] },
  { id: "3", title: "Joint Supplements", status: "Draft", metadata: [{ label: "Price", value: "₹800" }, { label: "Stock", value: "0 units" }] },
];

export default function ProductsAdminPage() {
  const [search, setSearch] = useState("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" },
    { label: "Ecommerce", href: "/admin/ecommerce" },
    { label: "Products", href: "/admin/ecommerce/products" },
  ];

  const actions = (
    <Button leftIcon={<Plus className="w-4 h-4" />}>
      Add Product
    </Button>
  );

  return (
    <AdminShell title="Product Management" breadcrumbs={breadcrumbs} actions={actions}>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Input 
            placeholder="Search products by name, SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_PRODUCTS.map(product => (
          <WorkflowCard 
            key={product.id}
            title={product.title}
            status={product.status === "Active" ? "completed" : "pending"}
            metadata={product.metadata}
            onAction={() => console.log("Edit", product.id)}
            actionLabel="Edit Product"
          />
        ))}
      </div>
    </AdminShell>
  );
}
