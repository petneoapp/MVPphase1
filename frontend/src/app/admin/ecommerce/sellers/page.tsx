"use client";

import React, { useState, useEffect } from "react";
import { Search, Store, ShieldAlert, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/common/ui/Card";
import { Input } from "@/components/common/ui/Input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/common/ui/Table";
import { Badge } from "@/components/common/ui/Badge";
import { Button } from "@/components/common/ui/Button";
import { api } from "@/utils/api";

export default function SellerApprovals() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get("/admin/sellers");
      setSellers(response?.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load sellers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleAction = async (sellerId: number, status: string) => {
    try {
      await api.patch(`/admin/sellers/${sellerId}/status`, { status });
      fetchSellers();
    } catch(err: any) {
      alert(`Error updating seller: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Seller Approvals</h1>
        <p className="text-slate-500 mt-1">Review and approve new marketplace sellers.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Input placeholder="Search sellers..." leftIcon={<Search className="w-4 h-4"/>} className="max-w-md"/>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400"/></TableCell></TableRow>
            ) : sellers.length === 0 ? (
               <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No sellers found.</TableCell></TableRow>
            ) : (
               sellers.map(s => (
                 <TableRow key={s.id}>
                   <TableCell className="font-medium">{s.store_name}</TableCell>
                   <TableCell>{s.owner_name}</TableCell>
                   <TableCell><Badge variant="default">{s.status}</Badge></TableCell>
                   <TableCell className="text-right flex justify-end gap-2">
                     <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => handleAction(s.id, 'APPROVED')}><CheckCircle2 className="w-4 h-4 mr-1"/> Approve</Button>
                     <Button size="sm" variant="outline" className="text-rose-600" onClick={() => handleAction(s.id, 'REJECTED')}><XCircle className="w-4 h-4 mr-1"/> Reject</Button>
                   </TableCell>
                 </TableRow>
               ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
