"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import Navbar from "@/components/vet/nav1";
import { api, getAccessToken } from "@/utils/api";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* ----------------------
   Types
   ---------------------- */
type APIVet = {
  vet_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  qualification?: string;
  specialization?: string;
  license_number?: string;
  license_issuing_authority?: string;
  years_of_experience?: number | string;
  address?: string;
  landmark?: string;
  clinic_name?: string;
  location?: string;
  profile_picture_url?: string | null;
  certification_document_url?: string | null;
  services?: string[] | string | null;
  supported_pets?: string | null;
  emergency?: boolean;
};

type FormVet = {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  qualification: string;
  specialization: string;
  license_number: string;
  license_issuing_authority: string;
  years_of_experience: number;
  address: string;
  landmark: string;
  clinic_name: string;
  location: string;
  services: string[];
  supported_pets: string[];
  profile_picture_url?: string | null;
  certification_document_url?: string | null;
  emergency: boolean;
};

type ServiceType = {
  id: number;
  name: string;
};

/* ----------------------
   Helpers
   ---------------------- */
const normalizeApiBase = (raw: string | undefined) => (raw || "").replace(/\/+$/, "");

const toFormModel = (api: APIVet | null): FormVet => {
  if (!api) {
    return {
      first_name: "",
      last_name: "",
      email: "",
      mobile_number: "",
      qualification: "",
      specialization: "",
      license_number: "",
      license_issuing_authority: "",
      years_of_experience: 0,
      address: "",
      landmark: "",
      clinic_name: "",
      location: "",
      services: [],
      supported_pets: [],
      profile_picture_url: null,
      certification_document_url: null,
      emergency: false,
    };
  }

  const svc: string[] = Array.isArray(api.services)
    ? api.services.filter(Boolean) as string[]
    : typeof api.services === "string" && api.services.trim().length
      ? api.services.split(",").map((s) => s.trim())
      : [];

  const yoe =
    typeof api.years_of_experience === "number"
      ? api.years_of_experience
      : parseInt(String(api.years_of_experience || 0), 10) || 0;

  return {
    first_name: api.first_name || "",
    last_name: api.last_name || "",
    email: api.email || "",
    mobile_number: api.mobile_number || "",
    qualification: api.qualification || "",
    specialization: api.specialization || "",
    license_number: api.license_number || "",
    license_issuing_authority: api.license_issuing_authority || "",
    years_of_experience: yoe,
    address: api.address || "",
    landmark: api.landmark || "",
    clinic_name: api.clinic_name || "",
    location: api.location || "",
    services: svc,
    supported_pets: api.supported_pets ? api.supported_pets.split(",").map(p => p.trim()).filter(Boolean) : [],
    profile_picture_url: api.profile_picture_url || null,
    certification_document_url: api.certification_document_url || null,
    emergency: !!api.emergency,
  };
};



/* ----------------------
   Component
   ---------------------- */
export default function MyBioPage(): React.JSX.Element {
  const rawApiBase = API_BASE;
  const SKIP_NGROK_HEADER = (process.env.NEXT_PUBLIC_SKIP_NGROK_HEADER || "false").toLowerCase() === "true";
  const apiBase = normalizeApiBase(rawApiBase);
  const myBioEndpoint = useMemo(() => `/vet/myBio`, []);
  const updateBioPath = useMemo(() => `${apiBase}/vet/updateBio`, [apiBase]);
  const updateEmergencyPath = useMemo(() => `${apiBase}/vet/updateEmergency`, [apiBase]);

  const NGROK_HEADER: Record<string, string> = SKIP_NGROK_HEADER ? { "ngrok-skip-browser-warning": "69420" } : {};

  const [servicesAvailable, setServicesAvailable] = useState<ServiceType[]>([]);
  const toServiceIdsString = (services: string[]) => {
      const servicesIDs: number[] = [];
      services.forEach(service => {
          servicesAvailable.forEach(serviceAvailable => {
              if (service === serviceAvailable.name) {
                  servicesIDs.push(serviceAvailable.id);
              }
          })
      })
      return servicesIDs.join(",");
  };

  const [profile, setProfile] = useState<APIVet | null>(null);
  const [form, setForm] = useState<FormVet>(toFormModel(null));
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string, ms = 3500) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Use api wrapper for GET so it handles Authorization + ngrok header (if configured)
        console.log(`[MyBioPage] GET profile endpoint: ${myBioEndpoint}`);
        const data = (await api.get(myBioEndpoint, undefined, "partner")) as APIVet;
        const servicesData = (await api.get("/services", undefined, "partner") as ServiceType[]);
        if (!mounted) return;
        setProfile(data);
        setForm(toFormModel(data));
        setServicesAvailable(servicesData);
      } catch (e: any) {
        console.error("MyBio GET error:", e);
        setError(e?.message || "Failed to fetch profile");
        setProfile(null);
        setForm(toFormModel(null));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = <K extends keyof FormVet>(key: K, val: FormVet[K]) => setForm((p) => ({ ...p, [key]: val }));

  // Save using direct fetch for multipart
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const fd = new FormData();
      fd.append("first_name", form.first_name);
      fd.append("last_name", form.last_name);
      fd.append("qualification", form.qualification);
      fd.append("specialization", form.specialization);
      fd.append("license_number", form.license_number);
      fd.append("license_issuing_authority", form.license_issuing_authority);
      fd.append("years_of_experience", String(Number(form.years_of_experience || 0)));
      fd.append("address", form.address);
      fd.append("landmark", form.landmark);
      fd.append("clinic_name", form.clinic_name);
      fd.append("location", form.location);
      fd.append("service_ids", toServiceIdsString(form.services));
      fd.append("supported_pets", form.supported_pets.join(", "));

      if (profilePic) fd.append("profile_picture", profilePic);
      if (certificate) fd.append("certification_document", certificate);

      // Build headers safely as Record<string,string>
      const tokenRaw = getAccessToken();
      const token = tokenRaw ? tokenRaw.replace(/^Bearer\s+/i, "").trim() : "";
      const headers: Record<string, string> = { ...NGROK_HEADER }; // always string -> no undefined keys
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Call the update endpoint directly (multipart)
      console.log(`[MyBioPage] PUT Request URL: ${updateBioPath}`);
      const res = await fetch(updateBioPath, {
        method: "PUT",
        body: fd,
        headers: headers as HeadersInit, // explicit cast for fetch
      });
      console.log(`[MyBioPage] PUT Response Status: ${res.status}`);

      const contentType = (res.headers.get("content-type") || "").toLowerCase();

      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = contentType.includes("application/json") ? JSON.stringify(await res.json()) : await res.text();
        } catch {
          bodyText = (await res.text().catch(() => "")).slice(0, 300);
        }
        throw new Error(`Update failed (${res.status}) — ${bodyText}`);
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error("Update returned non-JSON response: " + text.slice(0, 400));
      }

      const updated = (await res.json()) as APIVet;
      setProfile(updated);
      setForm(toFormModel(updated));
      setEditing(false);
      setProfilePic(null);
      setCertificate(null);
      showToast("success", "Profile updated successfully.");
    } catch (e: any) {
      console.error("MyBio PUT error:", e);
      setError(e?.message || "Failed to update profile");
      showToast("error", e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // emergency toggle using form-url-encoded
  const handleEmergencyToggle = async (value: boolean) => {
    onChange("emergency", value); // optimistic
    try {
      const tokenRaw = getAccessToken();
      const token = tokenRaw ? tokenRaw.replace(/^Bearer\s+/i, "").trim() : "";
      const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", ...NGROK_HEADER };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body = new URLSearchParams();
      body.append("emergency", String(value));

      console.log(`[MyBioPage] PUT Emergency Request URL: ${updateEmergencyPath}`);
      const res = await fetch(updateEmergencyPath, { method: "PUT", headers: headers as HeadersInit, body: body.toString() });
      console.log(`[MyBioPage] PUT Emergency Response Status: ${res.status}`);
      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = (await res.text()).slice(0, 300);
        } catch {}
        throw new Error(`Emergency update failed (${res.status}) — ${bodyText}`);
      }

      showToast("success", `Emergency ${value ? "enabled" : "disabled"}`);
    } catch (e: any) {
      console.error("Emergency update error:", e);
      showToast("error", e?.message || "Failed to update emergency");
      onChange("emergency", !value); // revert
    }
  };

  const getPreviewSrc = () => {
    if (profilePic) return URL.createObjectURL(profilePic);
    if (form.profile_picture_url) return form.profile_picture_url;
    return "/avatar.png";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="animate-pulse">
              <div className="h-4 w-40 bg-gray-200 rounded mb-6" />
              <div className="bg-white shadow rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/5" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-10 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          role="status"
        >
          {toast.text}
        </div>
      )}

      <div className={`min-h-screen bg-gray-50 p-4 md:p-6 lg:p-10 ${poppins.className}`}>
        <div className="mb-6 text-sm text-gray-600 max-w-6xl mx-auto px-2">
          <Link href="/vet/dashboard" className="hover:underline text-pink-600">
            Home
          </Link>{" "}
          › <span className="text-gray-800">My Bio</span>
        </div>

        <div className="max-w-6xl mx-auto bg-white shadow-lg border border-gray-100 rounded-2xl p-6 md:p-8 lg:p-12">
          {error && <p className="mb-4 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className="relative w-28 h-28 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-2 ring-pink-100">
              <Image src={getPreviewSrc()} alt="Profile" width={112} height={112} className="rounded-full object-cover" unoptimized />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start md:items-center justify-between gap-4">
                <div className="truncate">
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 truncate">
                    {(form.first_name || form.last_name) ? `${form.first_name} ${form.last_name}`.trim() : "N/A"}
                  </h2>
                  <p className="text-gray-600">{form.specialization || "Specialization N/A"}</p>
                  <p className="text-sm text-gray-500 truncate">{form.email || "Email N/A"}</p>
                </div>

                <label className="inline-flex items-center cursor-pointer select-none ml-2">
                  <span className="mr-3 text-sm text-gray-600">Emergency</span>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!form.emergency}
                    onChange={(e) => handleEmergencyToggle(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-pink-400 relative transition-colors">
                    <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
                  </div>
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {(form.services?.length ? form.services : ["No services added"]).map((svc, idx) => (
                  <span
                    key={`${svc}-${idx}`}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      form.services.length ? "bg-pink-50 text-pink-700 border-pink-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                disabled={!editing}
                value={form.first_name}
                onChange={(e) => onChange("first_name", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="First Name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                disabled={!editing}
                value={form.last_name}
                onChange={(e) => onChange("last_name", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Last Name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                disabled={!editing}
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Email"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                type="tel"
                disabled={!editing}
                value={form.mobile_number}
                onChange={(e) => onChange("mobile_number", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="e.g. 9999999999"
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                disabled={!editing}
                value={form.qualification}
                onChange={(e) => onChange("qualification", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Qualification"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                disabled={!editing}
                value={form.specialization}
                onChange={(e) => onChange("specialization", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Specialization"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                step={1}
                disabled={!editing}
                value={form.years_of_experience}
                onChange={(e) => onChange("years_of_experience", Math.max(0, Number(e.target.value || 0)))}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="0"
              />
            </div>

            {/* License No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License No.</label>
              <input
                type="text"
                disabled={!editing}
                value={form.license_number}
                onChange={(e) => onChange("license_number", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="License No."
              />
            </div>

            {/* Issued By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
              <input
                type="text"
                disabled={!editing}
                value={form.license_issuing_authority}
                onChange={(e) => onChange("license_issuing_authority", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Issuing Authority"
              />
            </div>

            {/* Clinic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
              <input
                type="text"
                disabled={!editing}
                value={form.clinic_name}
                onChange={(e) => onChange("clinic_name", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Clinic Name"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                disabled={!editing}
                value={form.location}
                onChange={(e) => onChange("location", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Location"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                disabled={!editing}
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Address"
              />
            </div>

            {/* Landmark */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input
                type="text"
                disabled={!editing}
                value={form.landmark}
                onChange={(e) => onChange("landmark", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 placeholder-[#FADADD] text-black focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors ${editing ? "bg-white" : "bg-[#fff7f9]"}`}
                placeholder="Landmark"
              />
            </div>

            {/* Services */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
              <div className="flex flex-wrap gap-3">
                {servicesAvailable.map((svc) => {
                  const checked = !!form.services.find((item) => item === svc.name);
                  return (
                    <label key={svc.id} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        disabled={!editing}
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(form.services);
                          if (e.target.checked) next.add(svc.name); else next.delete(svc.name);
                          onChange("services", Array.from(next));
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{svc.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Supported Pets */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Supported Pets</label>
              <div className="flex flex-wrap gap-3">
                {["Dogs", "Cats", "Birds", "Rabbits", "Reptiles", "Others"].map((pet) => {
                  const checked = form.supported_pets.some(p => p.toLowerCase() === pet.toLowerCase());
                  return (
                    <label key={pet} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        disabled={!editing}
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(form.supported_pets.map(p => p.toLowerCase()));
                          if (e.target.checked) next.add(pet.toLowerCase()); else next.delete(pet.toLowerCase());
                          // Map back to correct casing
                          const newPets = Array.from(next).map(p => 
                              p.charAt(0).toUpperCase() + p.slice(1)
                          );
                          onChange("supported_pets", newPets);
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{pet}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* File uploads */}
            {editing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files ? e.target.files[0] : null)}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certification Document</label>
                  <input
                    type="file"
                    onChange={(e) => setCertificate(e.target.files ? e.target.files[0] : null)}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                  />
                </div>
              </>
            )}

            {!editing && form.certification_document_url && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certification Document</label>
                <div>
                  <a href={form.certification_document_url} target="_blank" rel="noreferrer" className="text-pink-600 underline">
                    View Document
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all"
                style={{ backgroundColor: "#FFC0CB" }}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setForm(toFormModel(profile)); setProfilePic(null); setCertificate(null); setEditing(false); }}
                  className="px-4 py-2 border rounded-lg font-medium transition-colors"
                  style={{ borderColor: "#FFC0CB", color: "#FF6F91" }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all ${saving ? "opacity-70 cursor-wait" : "hover:scale-[1.02]"}`}
                  style={{ backgroundColor: "#FF9EB5" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
