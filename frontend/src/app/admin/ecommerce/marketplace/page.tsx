"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Star,
  Activity,
  UserCheck,
  UserX,
  MessageSquare,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  X,
  Compass,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/common/ui/Table";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { api as apiClient } from "@/utils/api";

interface ProviderItem {
  branch_id: number;
  provider_name: string;
  latitude: number;
  longitude: number;
  city: string | null;
  average_rating: number;
  total_reviews: number;
  operational_consistency_score: number;
  offered_services: string[];
  is_accepting_new_clients: boolean;
}

interface ProviderListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: ProviderItem[];
}

interface ProviderReview {
  id: string;
  branch_id: number;
  customer_id: number;
  reservation_group_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export default function AdminMarketplacePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Drawer state
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  const fetchProviders = async () => {
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
      const response = await apiClient.get("/admin/marketplace/providers", { params });
      setProviders(response.data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch marketplace providers:", err);
      setError(err?.message || "Failed to load marketplace catalog index.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleFetchReviews = async (branchId: number) => {
    setIsReviewsLoading(true);
    try {
      const response = await apiClient.get(`/admin/marketplace/providers/${branchId}/reviews`);
      setReviews(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleOpenDetail = (provider: ProviderItem) => {
    setSelectedBranchId(provider.branch_id);
    setSelectedProvider(provider);
    handleFetchReviews(provider.branch_id);
  };

  const handleToggleClients = async (branchId: number) => {
    try {
      await apiClient.patch(`/admin/marketplace/providers/${branchId}/toggle-clients`);
      setProviders(prev => prev.map(p => p.branch_id === branchId ? { ...p, is_accepting_new_clients: !p.is_accepting_new_clients } : p));
      if (selectedProvider && selectedProvider.branch_id === branchId) {
        setSelectedProvider(prev => prev ? { ...prev, is_accepting_new_clients: !prev.is_accepting_new_clients } : null);
      }
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  return (
    <div className="relative min-h-screen space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketplace Directory</h1>
          <p className="text-slate-500 mt-1">Monitor seller profiles, reputation, reviews, and client acceptance controls.</p>
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
                placeholder="Search sellers by business name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-slate-50"
              />
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Sellers
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  statusFilter === "active"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Accepting Clients
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  statusFilter === "inactive"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Not Accepting
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Offered Services</TableHead>
                <TableHead>Consistency</TableHead>
                <TableHead>Clients Acceptance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-slate-200 rounded w-40"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-12"></div></TableCell>
                    <TableCell><div className="h-5 bg-slate-200 rounded-full w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-12"></div></TableCell>
                    <TableCell><div className="h-8 bg-slate-200 rounded-xl w-16 ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No marketplace providers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((p) => (
                  <TableRow key={p.branch_id}>
                    <TableCell className="font-semibold text-slate-900">
                      {p.provider_name}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {p.city || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-slate-800">{p.average_rating.toFixed(1)}</span>
                        <span className="text-slate-400 text-xs">({p.total_reviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {p.offered_services.map((srv, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] uppercase font-bold py-0">
                            {srv}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-800">
                        {Math.round(p.operational_consistency_score * 100)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleClients(p.branch_id)}
                        className="text-slate-500 hover:text-slate-900 transition-colors focus:outline-none"
                      >
                        {p.is_accepting_new_clients ? (
                          <ToggleRight className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-300" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(p)}
                        className="text-slate-700 hover:text-slate-950 font-medium inline-flex items-center gap-1"
                      >
                        Overview <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Slide-over Detail Drawer */}
      {selectedBranchId && selectedProvider && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 transition-opacity"
            onClick={() => setSelectedBranchId(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seller Profile</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedProvider.provider_name}</h2>
              </div>
              <button
                onClick={() => setSelectedBranchId(null)}
                className="p-2 hover:bg-slate-200/60 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Trust & Location metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Consistency</span>
                  <div className="text-2xl font-black text-slate-900">
                    {Math.round(selectedProvider.operational_consistency_score * 100)}%
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${Math.round(selectedProvider.operational_consistency_score * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Controls</span>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleToggleClients(selectedProvider.branch_id)}
                      className="text-slate-500 hover:text-slate-950 focus:outline-none"
                    >
                      {selectedProvider.is_accepting_new_clients ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                    <span className="text-xs text-slate-600 font-semibold">
                      {selectedProvider.is_accepting_new_clients ? "Accepting Clients" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offered Services */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-slate-500" /> Active Capabilities
                </h3>
                <div className="flex gap-2 flex-wrap bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                  {selectedProvider.offered_services.map((srv, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1 font-bold text-slate-700 bg-white uppercase">
                      {srv}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" /> Location Coordinates
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 p-4 border border-slate-100 rounded-2xl font-medium text-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 block">Latitude</span>
                    {selectedProvider.latitude}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Longitude</span>
                    {selectedProvider.longitude}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" /> Customer Feedbacks ({reviews.length})
                </h3>

                {isReviewsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    No customer reviews indexed for this branch yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2 text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex gap-0.5">
                            {Array(5).fill(0).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {r.customer_id}</span>
                        </div>
                        <p className="text-slate-700 font-medium">{r.review_text || "No review text provided."}</p>
                        <div className="text-[10px] text-slate-400 text-right">
                          Reviewed: {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {selectedProvider.average_rating.toFixed(1)} / 5.0 Rating
              </div>
              <span className="text-xs text-slate-500 font-medium">{selectedProvider.total_reviews} reviews submitted</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
