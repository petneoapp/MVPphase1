// src/app/vet/appointments/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/utils/api";
import { AdminShell } from "@/components/layout/AdminShell";
import { TimelineView, TimelineEvent } from "@/components/common/TimelineView";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionFooter } from "@/components/form/ActionFooter";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

type AppointmentData = { [k: string]: any };

export default function AppointmentDetailRoute() {
  const params = useParams();
  const { id } = params as { id?: string };
  const router = useRouter();

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const SKIP_NGROK = (process.env.NEXT_PUBLIC_SKIP_NGROK_HEADER || "false").toLowerCase() === "true";

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

  const tryFetchPaths = async (paths: string[], headers: Record<string, string>) => {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE not configured");

    let lastNonOk: { url: string; status: number; body: any } | null = null;
    let lastErr: any = null;

    for (const p of paths) {
      const url = p.startsWith("http") ? p : buildUrl(API_BASE, p);
      try {
        const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
        const text = await res.text();

        let json: any = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }

        if (!res.ok) {
          lastNonOk = { url, status: res.status, body: json ?? text };
          continue;
        }
        return json?.data ?? json;
      } catch (err) {
        lastErr = err;
      }
    }

    if (lastNonOk) {
      throw new Error(`All endpoints failed. Last response: ${lastNonOk.status}`);
    }
    if (lastErr) throw lastErr;
    throw new Error("All attempted endpoints failed (no response).");
  };

  const normalizeAndSet = (data: any) => {
    const normalized = data ?? {};

    if (normalized?.pet) {
      normalized.petName = normalized.pet?.name ?? normalized.petName ?? "Unknown Pet";
      normalized.pet_image = normalized.pet?.profile_picture ?? normalized.pet_image ?? null;
      normalized.breed = normalized.pet?.breed ?? normalized.breed ?? "—";
      normalized.gender = normalized.pet?.gender ?? normalized.gender ?? "—";
      delete normalized.pet;
    }

    normalized.visitType = normalized.visitType ?? normalized.visit_type ?? "—";
    normalized.date = normalized.date ?? normalized.appointment_date ?? "—";
    normalized.time = normalized.time ?? normalized.appointment_time ?? "--:--";
    normalized.status = normalized.status ?? "pending";
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
      if (api && typeof api.get === "function") {
        try {
          const resp = await api.get(`/appointments/${id}`);
          const data = resp?.data ?? resp;
          if (data && Object.keys(data).length > 0) {
            normalizeAndSet(data);
            setLoading(false);
            return;
          }
        } catch (err) {}
      }

      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (SKIP_NGROK) headers["ngrok-skip-browser-warning"] = "69420";

      const candidatePaths = [
        `/appointments/${id}`,
        `/vet/appointments/${id}`,
        `appointments/${id}`,
      ];

      const data = await tryFetchPaths(candidatePaths, headers);
      if (!data) throw new Error("No appointment data returned from server.");

      normalizeAndSet(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load appointment details.");
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAppointment();
  }, [id]);

  if (!id) {
    return (
      <AdminShell title="Invalid Appointment">
        <ErrorState title="Invalid ID" message="No appointment ID was provided." />
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell title="Loading Appointment...">
        <LoadingState />
      </AdminShell>
    );
  }

  if (error || !appointment) {
    return (
      <AdminShell 
        title="Appointment Not Found"
        breadcrumbs={[{ label: "Appointments", href: "/vet/dashboard" }, { label: "Error" }]}
      >
        <ErrorState 
          title="Failed to Load" 
          message={error ?? `No appointment found for ID: ${id}`} 
          onRetry={() => router.back()}
        />
      </AdminShell>
    );
  }

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

  const normalizedStatus = status.toLowerCase() === 'no-show' ? 'danger' 
      : status.toLowerCase() === 'completed' ? 'success'
      : status.toLowerCase() === 'in-progress' ? 'info'
      : 'pending';

  // Construct a dummy timeline based on the existing appointment data
  const timelineEvents: TimelineEvent[] = [
    {
      id: "evt-1",
      title: "Appointment Created",
      description: `Reason: ${reason}`,
      timestamp: date,
      status: "success",
      actor: { name: owner }
    },
    {
      id: "evt-2",
      title: "Appointment Scheduled",
      description: `Scheduled for ${visitType}`,
      timestamp: `${date} ${time}`,
      status: "pending",
    }
  ];

  if (normalizedStatus === 'success') {
    timelineEvents.push({
      id: "evt-3",
      title: "Appointment Completed",
      timestamp: date,
      status: "success"
    });
  } else if (normalizedStatus === 'danger') {
    timelineEvents.push({
      id: "evt-3",
      title: "Patient No-Show / Cancelled",
      timestamp: date,
      status: "danger"
    });
  }

  return (
    <AdminShell 
      title={`Appointment: ${petName}`}
      breadcrumbs={[{ label: "Appointments", href: "/vet/dashboard" }, { label: petName }]}
      actions={
        <div className="flex gap-2">
          <StatusBadge status={normalizedStatus as any} />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--spacing-xl)]">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-[var(--spacing-lg)]">
          <div className="bg-[var(--color-background)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-gray-200 dark:border-gray-800 p-[var(--spacing-lg)]">
            <div className="flex flex-col sm:flex-row gap-[var(--spacing-lg)]">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{petName}</h2>
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  Owner: <span className="font-medium text-gray-900 dark:text-white">{owner}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  Visit: <span className="font-medium text-gray-900 dark:text-white">{visitType}</span>
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <div>{date}</div>
                  <div>•</div>
                  <div>{time}</div>
                </div>
                <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                  <strong>Reason:</strong> {reason}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">Breed</div>
                <div className="font-medium">{breed}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Age</div>
                <div className="font-medium">{age}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Weight</div>
                <div className="font-medium">{weight}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Gender</div>
                <div className="font-medium">{gender}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">Contact</div>
                <div className="font-medium">{contact}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Address</div>
                <div className="font-medium">{address}</div>
              </div>
            </div>
            
            <div className="mt-8">
              <ActionFooter 
                primaryLabel="Reschedule"
                onPrimaryClick={() => router.push(`/vet/appointments/${id}/reschedule`)}
                secondaryLabel="Back to Dashboard"
                onSecondaryClick={() => router.back()}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Timeline */}
        <div className="space-y-[var(--spacing-lg)]">
          <div className="bg-[var(--color-background)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-gray-200 dark:border-gray-800 p-[var(--spacing-lg)]">
            <h3 className="text-lg font-heading font-semibold mb-[var(--spacing-md)] text-gray-900 dark:text-white">Workflow History</h3>
            <TimelineView events={timelineEvents} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
