"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ChevronRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/common/ui/Card";
import { Input } from "@/components/common/ui/Input";
import { Button } from "@/components/common/ui/Button";
import { api } from "@/utils/api";

export default function SellerRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    business_name: "",
    slug: "",
    contact_email: "",
    contact_phone: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/seller/register", formData, "customer");
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 px-4">
        <Card className="max-w-md mx-auto border-0 shadow-lg text-center p-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 mb-8">
            Thank you for applying to sell on PetNeo. Our team will review your application and activate your store shortly.
          </p>
          <Button onClick={() => router.push("/")} className="w-full">
            Return to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Become a Seller</h1>
          <p className="text-slate-500 mt-2">Open your store on PetNeo and reach thousands of pet parents.</p>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 rounded-xl flex items-start gap-3 border border-rose-100 text-rose-800">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Business Name</label>
                  <Input required name="business_name" value={formData.business_name} onChange={handleChange} placeholder="e.g. Happy Paws" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Store URL Slug</label>
                  <Input required name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. happy-paws" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Contact Email</label>
                  <Input required type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="store@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Contact Phone</label>
                  <Input required name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="10 digit number" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Store Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">City</label>
                    <Input required name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">State</label>
                    <Input required name="state" value={formData.state} onChange={handleChange} placeholder="e.g. MH" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Pincode</label>
                    <Input required name="pincode" value={formData.pincode} onChange={handleChange} placeholder="400001" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 text-lg font-medium">
                {loading ? "Submitting..." : "Submit Application"} <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
