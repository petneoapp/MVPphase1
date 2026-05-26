// src/app/vet/appointments/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/vet/nav1";
import { api } from "@/utils/api";

type AppointmentData = { [k: string]: any };

export default function AppointmentDetailRoute() {
  const params = useParams();
  const { id } = params as { id?: string };
  const router = useRouter();

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use centralized API_BASE
  const SKIP_NGROK =
    (process.env.NEXT_PUBLIC_SKIP_NGROK_HEADER || "false").toLowerCase() ===
    "true";

  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("petneo_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      null
    );
  };

  const buildUrl = (base: string, path: string) => {
    if (!base) return path;
    const b = base.replace(/\/+$/, "");
    const p = path.replace(/^\/+/, "");
    return `${b}/${p}`;
  };

  /**
   * tryFetchPaths
   * Tries the list of candidate paths and returns parsed JSON (data || json).
   * If all fail, throws an Error containing useful debug info.
   */
  const tryFetchPaths = async (
    paths: string[],
    headers: Record<string, string>
  ) => {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE not configured");

    let lastNonOk: { url: string; status: number; body: any } | null = null;
    let lastErr: any = null;

    for (const p of paths) {
      const url = p.startsWith("http") ? p : buildUrl(API_BASE, p);
      try {
        console.log("[AppointmentDetails Route] Trying URL:", url);
        const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
        console.log(`[AppointmentDetails Route] Response Status for ${url}: ${res.status}`);
        const text = await res.text();

        // parse JSON when possible
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }

        if (!res.ok) {
          lastNonOk = { url, status: res.status, body: json ?? text };
          console.warn(`[AppointmentDetails] non-OK from ${url}`, lastNonOk);
          continue; // try next candidate
        }

        // success: return data (prefer .data)
        return json?.data ?? json;
      } catch (err) {
        console.warn("[AppointmentDetails] Fetch error for", p, err);
        lastErr = err;
      }
    }

    // build helpful message
    if (lastNonOk) {
      const bodyPreview =
        typeof lastNonOk.body === "string"
          ? lastNonOk.body.slice(0, 200)
          : JSON.stringify(lastNonOk.body).slice(0, 600);
      throw new Error(
        `All endpoints failed. Last response: ${lastNonOk.status} from ${lastNonOk.url} — ${bodyPreview}`
      );
    }

    if (lastErr) throw lastErr;
    throw new Error("All attempted endpoints failed (no response).");
  };

  const normalizeAndSet = (data: any) => {
    const normalized = data ?? {};

    if (normalized?.pet) {
      normalized.petName =
        normalized.pet?.name ?? normalized.petName ?? "Unknown Pet";
      normalized.pet_image =
        normalized.pet?.profile_picture ?? normalized.pet_image ?? null;
      normalized.breed = normalized.pet?.breed ?? normalized.breed ?? "—";
      normalized.gender = normalized.pet?.gender ?? normalized.gender ?? "—";
      // keep pet.id if you need it: normalized.petId = normalized.pet.id ?? normalized.petId
      delete normalized.pet;
    }

    normalized.visitType = normalized.visitType ?? normalized.visit_type ?? "—";
    normalized.date = normalized.date ?? normalized.appointment_date ?? "—";
    normalized.time = normalized.time ?? normalized.appointment_time ?? "--:--";
    normalized.status = normalized.status ?? "—";
    normalized.owner = normalized.owner ?? normalized.owner_name ?? "—";
    normalized.contact = normalized.contact ?? normalized.contact_number ?? "—";
    normalized.address = normalized.address ?? "—";
    normalized.reason = normalized.reason ?? normalized.notes ?? "—";
    normalized.age = normalized.age ?? "—";
    normalized.weight = normalized.weight ?? "—";

    setAppointment(normalized);
  };

  const fetchAppointment = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      // 1) Prefer the centralized helper (it may already include ngrok header & token)
      if (api && typeof api.get === "function") {
        try {
          console.debug("[AppointmentDetails] Trying api.get(`/appointments/${id}`)");
          const resp = await api.get(`/appointments/${id}`);
          const data = resp?.data ?? resp;
          if (data && Object.keys(data).length > 0) {
            normalizeAndSet(data);
            return;
          }
          console.warn("[AppointmentDetails] api.get returned empty; falling back.");
        } catch (err) {
          console.warn("[AppointmentDetails] api.get failed:", err);
        }
      }

      // 2) Manual fetch fallback
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (SKIP_NGROK) headers["ngrok-skip-browser-warning"] = "69420";

      // NOTE: Try the path that worked for list endpoints first (no '/vet/')
      const candidatePaths = [
        `/appointments/${id}`, // most likely
        `/vet/appointments/${id}`, // fallback
        `appointments/${id}`, // tolerate missing leading slash
      ];

      const data = await tryFetchPaths(candidatePaths, headers);
      if (!data) throw new Error("No appointment data returned from server.");

      normalizeAndSet(data);
    } catch (err: any) {
      console.error("Appointment fetch error:", err);
      setError(err?.message ?? "Failed to load appointment details.");
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // UI states
  if (!id) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-6 text-center text-gray-600">Invalid appointment id.</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400" />
          <p className="ml-3 text-gray-500">Loading appointment...</p>
        </div>
      </main>
    );
  }

  if (error || !appointment) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-600">
          <p className="mb-4">{error ?? `No appointment found for ID: ${id}`}</p>
          <div className="text-xs text-gray-400 mb-3">
            Tip: verify `NEXT_PUBLIC_API_BASE` in .env.local and ensure the token is in localStorage.
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 rounded-lg bg-pink-400 text-white hover:bg-pink-500"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  // render normalized appointment
  const {
    petName,
    breed,
    age,
    weight,
    gender,
    owner,
    contact,
    address,
    visitType,
    date,
    time,
    status,
    pet_image,
    reason,
  } = appointment;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <section className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row gap-6">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {pet_image ? (
              <Image
                src={pet_image}
                alt={petName ?? "Pet Image"}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{petName}</h2>
                <div className="text-gray-600 mt-1">
                  Owner: <span className="font-medium">{owner}</span>
                </div>
                <div className="text-gray-600 mt-1">
                  Visit: <span className="font-medium">{visitType}</span>
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <div>{date}</div>
                  <div>•</div>
                  <div>{time}</div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Reason: <span className="font-medium">{reason}</span>
                </div>
              </div>

              <div className="mt-2 sm:mt-0">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                  {status}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="text-xs text-gray-500">Breed</div>
                <div className="font-medium">{breed}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Age</div>
                <div className="font-medium">{age}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Weight</div>
                <div className="font-medium">{weight}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Gender</div>
                <div className="font-medium">{gender}</div>
              </div>

              <div className="sm:col-span-2 mt-2">
                <div className="text-xs text-gray-500">Address</div>
                <div className="font-medium">{address}</div>
              </div>

              <div className="sm:col-span-2 mt-2">
                <div className="text-xs text-gray-500">Contact</div>
                <div className="font-medium">{contact}</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.back()}
                className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => router.push(`/vet/appointments/${id}/reschedule`)}
                className="flex-1 py-2 rounded-lg bg-pink-400 hover:bg-pink-500 text-white font-medium"
              >
                Reschedule
              </button>
            </div>

            <details className="mt-6 text-xs text-gray-400">
              <summary className="cursor-pointer">Raw data</summary>
              <pre className="bg-gray-50 p-3 rounded mt-2 text-xs overflow-auto">
                {JSON.stringify(appointment, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
