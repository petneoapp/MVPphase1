"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/common/ui/Table";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { api as apiClient } from "@/utils/api";

interface Campaign {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  cta: string | null;
  target_url: string | null;
  priority: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    cta: "",
    target_url: "",
    priority: 0,
    active: true
  });

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/campaigns/admin");
      setCampaigns(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch campaigns:", err);
      setError(err?.message || "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        title: campaign.title,
        description: campaign.description || "",
        image: campaign.image || "",
        cta: campaign.cta || "",
        target_url: campaign.target_url || "",
        priority: campaign.priority,
        active: campaign.active
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        title: "",
        description: "",
        image: "",
        cta: "",
        target_url: "",
        priority: 0,
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert("Title is required");
      return;
    }
    
    try {
      if (editingCampaign) {
        await apiClient.put(`/campaigns/${editingCampaign.id}`, formData);
      } else {
        await apiClient.post("/campaigns", formData);
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        await apiClient.delete(`/campaigns/${id}`);
        fetchCampaigns();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns & Promos</h1>
          <p className="text-slate-500 mt-1">Manage storefront banners and promotions.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal()}>
          New Campaign
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-10 w-20 bg-slate-200 rounded"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-48"></div></TableCell>
                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-20"></div></TableCell>
                    <TableCell><div className="h-8 bg-slate-200 rounded-xl w-24 ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-12 w-24 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-24 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      {item.description && <div className="text-xs text-slate-500 mt-1">{item.description}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.priority}</TableCell>
                    <TableCell>
                      <Badge variant={item.active ? "success" : "default"}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openModal(item)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{editingCampaign ? "Edit Campaign" : "New Campaign"}</h3>
            </div>

            <div className="space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <Input
                label="Image URL"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
              <Input
                label="Target URL"
                value={formData.target_url}
                onChange={(e) => setFormData({...formData, target_url: e.target.value})}
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    label="Priority (higher = first)"
                    type="number"
                    value={formData.priority.toString()}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-slate-700">Is Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
