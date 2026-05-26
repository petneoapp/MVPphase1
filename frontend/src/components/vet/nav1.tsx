"use client";

import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { API_BASE } from "@/lib/api/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getAccessToken, setAccessToken, clearAccessToken } from "@/utils/api";

type VetProfile = {
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  avatar?: string | null;
  emergency?: boolean | number;
  [k: string]: any;
};

type DropdownItem = {
  label: string;
  icon: string;
  href?: string;
};

export default function Nav1(): React.JSX.Element {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [vet, setVet] = useState<VetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [updatingEmergency, setUpdatingEmergency] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);

  // Keep a fallback clearAuth that removes many possible keys
  const clearAuth = () => {
    [
      "petneo_token",
      "accessToken",
      "access_token",
      "token",
      "auth_token",
      "vetToken",
      "refreshToken",
      "refresh_token",
      "vet_id",
    ].forEach((k) => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch {}
    });
    // Also clear the centralized helper storage
    try {
      clearAccessToken();
    } catch {}
  };

  // Helper: normalize API response shapes (api.* returns parsed body or throws)
  const unwrap = (resp: any) => {
    if (!resp) return null;
    if (typeof resp !== "object") return resp;
    if (Array.isArray(resp)) return resp;
    // common wrappers: { data: {...} } or { data: [...] }
    if (resp.data !== undefined) return resp.data;
    // sometimes backend nests under result or appointments
    if (resp.result !== undefined) return resp.result;
    if (resp.appointments !== undefined) return resp.appointments;
    return resp;
  };

  // Fetch vet profile & today's count using api helper
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ensure token exists in centralized storage (in case login put it under a different key)
        // If your login already sets "accessToken" via utils.setAccessToken, this is a noop.
        try {
          const token =
            (typeof window !== "undefined" && (localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"))) ||
            (typeof window !== "undefined" && localStorage.getItem("token")) ||
            getAccessToken();

          if (token) {
            // make sure the helper has it in its standard place
            setAccessToken(token);
          }
        } catch (e) {
          // ignore storage errors
        }

        // Profile endpoint (uses api.get -> API_BASE is inside utils/api)
        const profileRaw = await api.get("/vet/myBio");
        if (!mounted) return;

        const profileData = unwrap(profileRaw) ?? {};
        const normalized: VetProfile = {
          first_name: profileData?.first_name ?? profileData?.name ?? profileData?.vet_name ?? undefined,
          last_name: profileData?.last_name ?? profileData?.surname ?? undefined,
          profile_picture: profileData?.profile_picture ?? profileData?.avatar ?? null,
          avatar: profileData?.profile_picture ?? profileData?.avatar ?? null,
          emergency: profileData?.emergency ?? profileData?.is_emergency ?? profileData?.emergency_mode ?? false,
          ...profileData,
        };
        setVet(normalized);

        // Today's appointment summary
        try {
          const summaryRaw = await api.get("/appointments/vetTodaySummary");
          const s = unwrap(summaryRaw);
          const possible =
            s?.total ?? s?.count ?? s?.appointments_count ?? s?.total_requests ?? s?.data?.total ?? s?.data?.count ?? null;
          setTodayCount(typeof possible === "number" ? possible : null);
        } catch (err) {
          // Non-critical — don't block profile render
          setTodayCount(null);
        }
      } catch (err: any) {
        // api.* throws readable Error when server returns HTML or non-OK
        setError(err?.message ?? "Failed to load profile");
        setVet(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // Toggle emergency status using api.put
  const toggleEmergency = async () => {
    if (!vet) return;
    setUpdatingEmergency(true);
    setError(null);
    try {
      const next = !Boolean(vet.emergency);
      const payload = { emergency: next };
      // Use api.put and unwrap the response
      const resRaw = await api.put("/vet/updateEmergency", payload);
      const res = unwrap(resRaw);
      // Try to read new value from response; fallback to requested next
      const newValue = res?.emergency ?? res?.is_emergency ?? next;
      setVet((prev) => ({ ...(prev ?? {}), emergency: newValue }));
    } catch (err: any) {
      setError(err?.message ?? "Failed to update emergency status");
    } finally {
      setUpdatingEmergency(false);
    }
  };

  // Logout: clear auth and redirect
  const handleLogout = () => {
    clearAuth();
    // Push via router or location
    if (typeof window !== "undefined") window.location.href = "/login";
    else router.push("/login");
  };

  const getVetName = () => {
    if (loading) return "Loading...";
    if (!vet) return "Veterinarian";
    const f = vet.first_name?.trim();
    const l = vet.last_name?.trim();
    if (f && l) return `Dr. ${f} ${l}`;
    if (f) return `Dr. ${f}`;
    return "Veterinarian";
  };

  // Build profile image src — prefer absolute URL if provided; otherwise allow relative path via NEXT_PUBLIC_API_BASE
  const getProfileImageSrc = () => {
    const p = vet?.profile_picture ?? vet?.avatar ?? null;
    if (p) {
      if (typeof p === "string" && p.startsWith("http")) return p;
      // fallback to env base or return as-is (relative)
      const base = API_BASE;
      if (base) {
        return `${base.replace(/\/$/, "")}/${(p as string).replace(/^\//, "")}`;
      }
      return p;
    }
    return "/images/d.png";
  };

  const dropdownItems: DropdownItem[] = [
    { label: "Work Status", icon: "🔔" },
    { label: "Manage Time Slots", icon: "⏱", href: "/vet/managetimeslots" },
    { label: "My Bio", icon: "💳", href: "/vet/mybio" },
    { label: "Privacy", icon: "🔒" },
    { label: "Help", icon: "❓" },
    { label: "About", icon: "ℹ️" },
  ];

  return (
    <nav className="flex justify-between items-center bg-white px-6 py-4 shadow-md relative z-40">
      {/* Left - Logo */}
      <div className="flex items-center gap-1">
        <Link href="/vet/dashboard" className="inline-flex items-center">
          <Image src="/images/logo.svg" alt="Petneo Logo" width={140} height={40} priority />
        </Link>
      </div>

      {/* Right - actions */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-white rounded-xl shadow px-4 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">Emergency Requests</span>
            <span className="text-xs text-gray-500">{todayCount !== null ? `${todayCount} today` : "—"}</span>
          </div>
          <button
            onClick={toggleEmergency}
            disabled={updatingEmergency || loading}
            title="Toggle emergency availability"
            className={`ml-3 inline-flex items-center px-3 py-1 rounded-full font-medium text-sm transition ${
              vet?.emergency ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-700"
            } ${updatingEmergency ? "opacity-70 cursor-wait" : ""}`}
          >
            {updatingEmergency ? "Updating..." : vet?.emergency ? "On" : "Off"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 hidden sm:block">{getVetName()}</span>
          <div className="w-9 h-9 relative">
            <Image
              src={getProfileImageSrc()}
              alt="profile"
              width={36}
              height={36}
              className="rounded-full object-cover border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/d.png";
              }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            setMenuOpen((s) => !s);
            setMenuAnimating(true);
            setTimeout(() => setMenuAnimating(false), 350);
          }}
          className="text-gray-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          className={`absolute right-6 top-20 bg-white rounded-2xl shadow-lg w-72 p-4 z-50 ${
            menuAnimating ? "animate-fadeIn" : ""
          }`}
        >
          <ul className="space-y-3">
            {dropdownItems.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-center gap-3 text-gray-800 hover:bg-pink-50 px-3 py-2 rounded-lg ${
                  item.href ? "" : "cursor-pointer"
                }`}
              >
                <span>{item.icon}</span>
                {item.href ? (
                  <Link href={item.href} className="flex-1" onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="flex-1">{item.label}</span>
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-pink-500 text-white py-2 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Logout
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
    </nav>
  );
}
