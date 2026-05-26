"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Nav1 from "@/components/vet/nav1";
import { api } from "@/utils/api";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* -------------------------
   Types
   ------------------------- */
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Availability = {
  id?: number;
  day_of_week: DayOfWeek;
  start_time: string; // we keep HH:MM:SS in form, but will send API datetimes as 'YYYY-MM-DD HH:MM:SS'
  end_time: string;
  slot_duration: number;
  visit_types: string[];
  is_closed: boolean;
  vet_id?: number;
};

type BreakItem = {
  id?: number;
  availability_id: number;
  start_time: string; // API expects formatted datetime string
  end_time: string; // API expects formatted datetime string
};

type OverrideItem = {
  id?: number;
  date: string; // YYYY-MM-DD
  start_time?: string; // API formatted datetime
  end_time?: string; // API formatted datetime
  is_closed: boolean;
  slot_duration?: number;
  visit_types?: string[];
  vet_id?: number;
};

type VetProfile = {
  id?: number;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string | null;
  clinic_name?: string | null;
  location?: string | null;
};

/* -------------------------
   Helpers
   ------------------------- */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * return next date (YYYY-MM-DD) for given day_of_week (0..6) starting from today
 * if today is that day, returns today.
 */
function nextDateForDayOfWeek(targetDow: number): string {
  const today = new Date();
  const todayDow = today.getDay();
  const diff = (targetDow + 7 - todayDow) % 7; // 0..6
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Combine a date (YYYY-MM-DD) and a time (HH:MM:SS or HH:MM) to ISO string in UTC.
 * (Kept for compatibility if you still need an ISO.)
 */
function combineDateAndTimeToISOString(dateYYYYMMDD: string, timeHHMMSS: string): string {
  // Accept "HH:MM" too
  let hhmm = timeHHMMSS;
  if (/^\d{2}:\d{2}$/.test(timeHHMMSS)) hhmm = timeHHMMSS + ":00";
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const [hh, mm, ss] = hhmm.split(":").map(Number);
  // Build Date in local timezone then convert to ISO string
  const dt = new Date(y, m - 1, d, hh, mm, ss, 0);
  return dt.toISOString();
}

/**
 * Format date (YYYY-MM-DD) + time (HH:MM:SS or HH:MM) into "YYYY-MM-DD HH:MM:SS"
 * This matches the API's expected format (no 'T', no 'Z', no milliseconds).
 */
function formatDateTimeForApi(dateYYYYMMDD: string, timeHHMMSS: string): string {
  let hhmm = timeHHMMSS;
  if (/^\d{2}:\d{2}$/.test(timeHHMMSS)) hhmm = `${timeHHMMSS}:00`;
  // drop milliseconds if present
  hhmm = hhmm.split(".")[0];
  return `${dateYYYYMMDD} ${hhmm}`;
}

/* -------------------------
   Component
   ------------------------- */

export default function ManageTimeSlotsPage(): React.JSX.Element {
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null);
  const [vetId, setVetId] = useState<number | null>(null);

  const [availability, setAvailability] = useState<Availability[]>([]);
  const [breaks, setBreaks] = useState<BreakItem[]>([]);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);

  const [visitTypes] = useState<string[]>(["Consultation", "Emergency", "Vaccination"]);
  const [selectedVisitType, setSelectedVisitType] = useState<string>("Consultation");

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // show toast helper
  const showToast = (type: "success" | "error", text: string, ms = 3500) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  // API endpoints use api wrapper which uses your NEXT_PUBLIC_API_BASE
  // Fetch vet profile
  const fetchVetProfile = async (): Promise<number | null> => {
    try {
      const res = await api.get("/vet/myBio");
      // backend sometimes returns wrapped object; prefer data if present
      const profile = (res && (res.data ?? res)) || null;
      setVetProfile(profile);
      const id = profile?.vet_id ?? profile?.id ?? null;
      setVetId(id);
      return id;
    } catch (err: any) {
      console.error("fetchVetProfile error:", err);
      showToast("error", "Failed to load vet profile. Please login.");
      return null;
    }
  };

  // Fetch availability, breaks, overrides
  const fetchAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const id = await fetchVetProfile();
      if (!id) {
        setLoading(false);
        return;
      }

      const [availRes, breaksRes, overridesRes] = await Promise.allSettled([
        api.get(`/availability/${id}`),
        api.get(`/availability/${id}/breaks`),
        api.get(`/availability/${id}/overrides`),
      ]);

      // Normalize results
      const availData = availRes.status === "fulfilled" ? (availRes.value ?? []) : [];
      const breaksData = breaksRes.status === "fulfilled" ? (breaksRes.value ?? []) : [];
      const overridesData = overridesRes.status === "fulfilled" ? (overridesRes.value ?? []) : [];

      // If no availability returned, initialize a sensible default for weekly availability
      if (!availData || (Array.isArray(availData) && availData.length === 0)) {
        const defaultAvail: Availability[] = (Array.from({ length: 7 }).map((_, i) => ({
          day_of_week: i as DayOfWeek,
          start_time: "09:00:00",
          end_time: "17:00:00",
          slot_duration: 30,
          visit_types: [selectedVisitType],
          is_closed: i === 0 || i === 6, // default weekend closed
        }))) as Availability[];
        setAvailability(defaultAvail);
      } else {
        // The API may return ISO times - convert to HH:MM:SS for display if needed
        const mapped = (availData as any[]).map((a) => {
          // If API returned start_time like "2025-09-30T09:00:00Z", extract hh:mm:ss
          const extractTime = (t: any) => {
            if (!t) return "09:00:00";
            const m = String(t).match(/T(\d{2}:\d{2}:\d{2})/);
            if (m) return m[1];
            if (/^\d{2}:\d{2}(:\d{2})?$/.test(String(t))) {
              return t.length === 5 ? `${t}:00` : t;
            }
            return "09:00:00";
          };
          return {
            id: a.id,
            day_of_week: Number(a.day_of_week) as DayOfWeek,
            start_time: extractTime(a.start_time),
            end_time: extractTime(a.end_time),
            slot_duration: Number(a.slot_duration || 30),
            visit_types: Array.isArray(a.visit_types) ? a.visit_types : (a.visit_types ? String(a.visit_types).split(",").map(s => s.trim()) : [selectedVisitType]),
            is_closed: !!a.is_closed,
            vet_id: a.vet_id ?? a.vetId ?? undefined,
          } as Availability;
        });
        setAvailability(mapped);
      }

      setBreaks(Array.isArray(breaksData) ? (breaksData as BreakItem[]) : []);
      setOverrides(Array.isArray(overridesData) ? (overridesData as OverrideItem[]) : []);
    } catch (err: any) {
      console.error("fetchAll error:", err);
      setMessage("Failed to load availability data.");
      showToast("error", "Failed to load availability data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle open/closed
  const toggleDay = (dow: DayOfWeek) => {
    setAvailability((prev) => prev.map((d) => (d.day_of_week === dow ? { ...d, is_closed: !d.is_closed } : d)));
  };

  // Update time for a given day (time in HH:MM)
  const updateDayTime = (dow: DayOfWeek, field: "start_time" | "end_time", hhmm: string) => {
    const hhmmss = hhmm.length === 5 ? `${hhmm}:00` : hhmm;
    setAvailability((prev) => prev.map((d) => (d.day_of_week === dow ? { ...d, [field]: hhmmss } : d)));
  };

  // Save default weekly availability:
  // We send an array of availability objects. For safety we send datetimes formatted for the API (YYYY-MM-DD HH:MM:SS).
  const saveDefaultAvailability = async () => {
    if (!vetId) {
      showToast("error", "Vet ID unavailable");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // Prepare payload: map each availability to server schema
      const payload = availability.map((a) => {
        // find next date for that weekday (so API receives full datetimes)
        const dateForDay = nextDateForDayOfWeek(a.day_of_week);
        // Use API formatting (no T, no Z, no millis)
        const startApi = formatDateTimeForApi(dateForDay, a.start_time);
        const endApi = formatDateTimeForApi(dateForDay, a.end_time);
        return {
          day_of_week: a.day_of_week,
          start_time: startApi,
          end_time: endApi,
          slot_duration: Number(a.slot_duration || 30),
          visit_types: a.visit_types && a.visit_types.length ? a.visit_types : [selectedVisitType],
          is_closed: !!a.is_closed,
        };
      });

      // POST to /availability/{vet_id}/defaultAvailability
      await api.post(`/availability/${vetId}/defaultAvailability`, payload);

      showToast("success", "Default availability saved");
      setMessage("✅ Availability saved successfully.");
      // refresh to get IDs assigned by server
      await fetchAll();
    } catch (err: any) {
      console.error("saveDefaultAvailability error:", err);
      showToast("error", err?.message || "Failed to save availability");
      setMessage(`❌ ${err?.message || "Failed to save availability"}`);
    } finally {
      setSaving(false);
    }
  };

  // Add a break for a given availability id (uses midday default or derived from availability)
  const addBreakForAvailability = async (availabilityId: number) => {
    try {
      // find availability in state to derive default break times (if available)
      const a = availability.find((x) => x.id === availabilityId);
      let dateForDay = new Date().toISOString().slice(0, 10);
      if (a) dateForDay = nextDateForDayOfWeek(a.day_of_week);

      // default break: 12:00 -> 13:00 (can be improved to prompt user)
      const startApi = formatDateTimeForApi(dateForDay, "12:00:00");
      const endApi = formatDateTimeForApi(dateForDay, "13:00:00");

      const body = {
        availability_id: availabilityId,
        start_time: startApi,
        end_time: endApi,
      };

      const res = await api.post("/availability/break", body);
      // API returns created break object
      setBreaks((prev) => [...prev, (res.data ?? res)]);
      showToast("success", "Break added");
      setMessage("✅ Break added successfully.");
    } catch (err: any) {
      console.error("addBreakForAvailability error:", err);
      showToast("error", err?.message || "Failed to add break");
      setMessage(`❌ ${err?.message || "Failed to add break"}`);
    }
  };

  // Add override for selectedDate with default times (10:00 - 16:00)
  const addOverrideForDate = async () => {
    if (!vetId) {
      showToast("error", "Vet ID unavailable");
      return;
    }
    try {
      const startApi = formatDateTimeForApi(selectedDate, "10:00:00");
      const endApi = formatDateTimeForApi(selectedDate, "16:00:00");

      const payload = {
        date: selectedDate,
        is_closed: false,
        start_time: startApi,
        end_time: endApi,
        slot_duration: 30,
        visit_types: [selectedVisitType],
      };

      const res = await api.post(`/availability/${vetId}/override`, payload);
      setOverrides((prev) => [...prev, (res.data ?? res)]);
      showToast("success", "Override added");
      setMessage("✅ Override added successfully.");
    } catch (err: any) {
      console.error("addOverrideForDate error:", err);
      showToast("error", err?.message || "Failed to add override");
      setMessage(`❌ ${err?.message || "Failed to add override"}`);
    }
  };

  // Render helpers
  const getVetName = () => {
    const f = vetProfile?.first_name ?? "";
    const l = vetProfile?.last_name ?? "";
    return (f || l) ? `Dr. ${f} ${l}`.trim() : "Dr. Veterinarian";
  };

  const getClinicInfo = () => [
    vetProfile?.clinic_name ?? "",
    vetProfile?.location ?? "",
  ].filter(Boolean).join(", ") || "Clinic information not available";

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white to-pink-50 ${poppins.className}`}>
      <Nav1 />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-700">
            <span className="text-pink-500">Home</span>
            <span className="mx-2">›</span>
            <span className="font-semibold">Manage Time Slots</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column: profile */}
          <div className="md:w-1/4 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 mb-3 relative rounded-full overflow-hidden shadow-inner">
                <Image
                  src={vetProfile?.profile_picture_url || "/images/d.png"}
                  alt="Vet"
                  width={112}
                  height={112}
                  className="rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/d.png"; }}
                />
              </div>
              <div className="text-lg font-semibold text-gray-900">{getVetName()}</div>
              <div className="text-sm text-gray-600 mt-1">📍 {getClinicInfo()}</div>

              <div className="mt-4 w-full">
                <div className="text-xs text-gray-500">Selected visit type</div>
                <div className="mt-2">
                  <div className="px-3 py-2 rounded bg-gray-50 border border-gray-100 text-sm font-medium text-gray-800">{selectedVisitType}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: management */}
          <div className="flex-1">
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
                <span className="ml-3 text-gray-600">Loading…</span>
              </div>
            ) : (
              <>
                {/* Services */}
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="font-semibold mb-2 text-gray-900">Pick Visit Type</div>
                  <div className="flex flex-wrap gap-2">
                    {visitTypes.map((vt) => (
                      <button
                        key={vt}
                        onClick={() => setSelectedVisitType(vt)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-shadow border ${selectedVisitType === vt ? "bg-pink-500 text-white shadow-lg" : "bg-white text-black border-gray-200 hover:shadow"}`}
                      >
                        {vt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overrides picker */}
               <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
  <div className="flex-1 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
    <label className="block text-sm text-gray-700 mb-1">Select date for override</label>
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-200 text-black"
    />
  </div>

  <div className="mt-2 sm:mt-0">
    <button
      onClick={addOverrideForDate}
      className="px-4 py-2 bg-white text-black border-2 border-pink-500 rounded-md shadow hover:bg-pink-50 transition"
    >
      + Add Override
    </button>
  </div>
</div>

{/* Weekly availability list */}
<div className="space-y-3 mb-6">
  {availability.map((day) => (
    <div
      key={day.day_of_week}
      className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!day.is_closed}
            onChange={() => toggleDay(day.day_of_week)}
            className="sr-only"
          />

          <div
            className={`w-12 h-6 rounded-full relative flex items-center transition ${
              !day.is_closed ? "bg-pink-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                !day.is_closed ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
        </label>

        <div className="w-20 font-medium text-gray-900">
          {DAY_NAMES[day.day_of_week]}
        </div>
        <div
          className={`text-sm ${day.is_closed ? "text-gray-500" : "text-pink-600 font-medium"}`}
        >
          {day.is_closed ? "Closed" : "Open"}
        </div>
      </div>

      {!day.is_closed ? (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={day.start_time.slice(0, 5)}
            onChange={(e) => updateDayTime(day.day_of_week, "start_time", e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-100 text-black"
          />
          <span className="text-black">to</span>
          <input
            type="time"
            value={day.end_time.slice(0, 5)}
            onChange={(e) => updateDayTime(day.day_of_week, "end_time", e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-100 text-black"
          />
          <div>
            <input
              type="number"
              min={5}
              value={day.slot_duration}
              onChange={(e) =>
                setAvailability((prev) =>
                  prev.map((d) =>
                    d.day_of_week === day.day_of_week
                      ? { ...d, slot_duration: Math.max(5, Number(e.target.value || 30)) }
                      : d
                  )
                )
              }
              className="w-20 border rounded px-2 py-1 text-black"
            />
          </div>

          {/* Add break (only if availability has id) */}
          {day.id ? (
            <button
              onClick={() => addBreakForAvailability(day.id!)}
              className="px-3 py-1 bg-white text-black border border-yellow-400 rounded-md text-xs ml-2 hover:bg-yellow-50"
            >
              + Break
            </button>
          ) : (
            <span className="text-xs text-gray-500 ml-2">Save availability to add break</span>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">—</div>
      )}
    </div>
  ))}
</div>


                {/* Save availability */}
                <div className="mb-6">
                  <button
                    onClick={saveDefaultAvailability}
                    disabled={saving}
                    className="w-full py-3 bg-white text-black border-2 border-pink-500 rounded-md font-semibold shadow hover:bg-pink-50 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Confirm Availability"}
                  </button>
                </div>

                {/* Overrides & Breaks listing */}
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">Overrides</h3>
                    <div className="space-y-2">
                      {overrides.length ? overrides.map((ov) => (
                        <div key={ov.id ?? ov.date} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                          <div className="font-medium">{ov.date}</div>
                          <div className="text-sm text-gray-600">
                            {ov.is_closed ? "Closed" : `${(ov.start_time ?? "").slice(11, 16)} - ${(ov.end_time ?? "").slice(11, 16)}`}
                          </div>
                        </div>
                      )) : <div className="text-sm text-gray-500">No overrides</div>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">Breaks</h3>
                    <div className="space-y-2">
                      {breaks.length ? breaks.map((b) => (
                        <div key={b.id ?? `${b.availability_id}-${b.start_time}`} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                          <div className="text-sm text-gray-600">{(b.start_time ?? "").slice(11, 16)} - {(b.end_time ?? "").slice(11, 16)}</div>
                          <div className="text-xs text-gray-500">Availability ID: {b.availability_id}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">No breaks</div>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
