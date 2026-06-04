"use client";

import React, { useEffect, useState, useRef } from "react";
import { Poppins } from "next/font/google";
import { api } from "@/utils/api";
import { FaClock, FaCoffee, FaCalendarTimes, FaPlus, FaCheck, FaExclamationTriangle, FaTrash } from "react-icons/fa";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

type AvailabilityRow = {
    id?: number;
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    slot_duration: number | null;
    visit_types: string[] | null;
    is_closed: boolean;
};

type BreakRow = {
    id?: number;
    availability_id: number;
    start_time: string;
    end_time: string;
};

type OverrideRow = {
    id?: number;
    date: string;
    is_closed: boolean;
    start_time: string | null;
    end_time: string | null;
    slot_duration: number | null;
    visit_types: string[] | null;
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PartnerManageTimeSlotsPage(): React.JSX.Element {
    const [loading, setLoading] = useState(true);
    const [vetId, setVetId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"weekly" | "breaks" | "overrides">("weekly");

    // States for Weekly Schedule
    const [weeklyList, setWeeklyList] = useState<AvailabilityRow[]>([]);
    
    // States for Breaks
    const [breaksList, setBreaksList] = useState<BreakRow[]>([]);
    const [selectedAvIdForBreak, setSelectedAvIdForBreak] = useState<number | null>(null);
    const [breakStart, setBreakStart] = useState("13:00");
    const [breakEnd, setBreakEnd] = useState("14:00");

    // States for Overrides
    const [overridesList, setOverridesList] = useState<OverrideRow[]>([]);
    const [overrideDate, setOverrideDate] = useState("");
    const [overrideIsClosed, setOverrideIsClosed] = useState(false);
    const [overrideStart, setOverrideStart] = useState("09:00");
    const [overrideEnd, setOverrideEnd] = useState("17:00");
    const [overrideSlotDuration, setOverrideSlotDuration] = useState(30);
    const [overrideVisitTypes, setOverrideVisitTypes] = useState<string[]>(["in-clinic"]);

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showToast = (type: "success" | "error", text: string, ms = 3000) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), ms);
    };

    const hasFetched = useRef(false);

    const loadAllData = async (vid: number) => {
        try {
            // 1. Weekly availabilities
            const avRes = await api.get(`/availability/${vid}`, undefined, "partner") as any;
            const existingAvs = avRes || [];
            
            // Populate all 7 days, merge existing ones
            const initialList: AvailabilityRow[] = Array.from({ length: 7 }, (_, index) => {
                const matches = existingAvs.filter((a: any) => a.day_of_week === index);
                const found = matches.length > 0 ? matches[matches.length - 1] : undefined;
                if (found) {
                    return {
                        id: found.id,
                        day_of_week: index,
                        start_time: found.start_time ? found.start_time.substring(0, 5) : "09:00",
                        end_time: found.end_time ? found.end_time.substring(0, 5) : "17:00",
                        slot_duration: found.slot_duration || 30,
                        visit_types: found.visit_types || ["in-clinic"],
                        is_closed: !!found.is_closed
                    };
                }
                return {
                    day_of_week: index,
                    start_time: "09:00",
                    end_time: "17:00",
                    slot_duration: 30,
                    visit_types: ["in-clinic"],
                    is_closed: false
                };
            });
            setWeeklyList(initialList);

            // Select the first open day for break selection
            const firstOpen = initialList.find(d => !d.is_closed && d.id);
            if (firstOpen) {
                setSelectedAvIdForBreak(firstOpen.id || null);
            }

            // 2. Breaks
            const breaksRes = await api.get(`/availability/${vid}/breaks`, undefined, "partner") as any;
            setBreaksList(breaksRes || []);

            // 3. Overrides
            const overridesRes = await api.get(`/availability/${vid}/overrides`, undefined, "partner") as any;
            const processedOverrides = (overridesRes || []).map((o: any) => ({
                id: o.id,
                date: o.date ? o.date.substring(0, 10) : "",
                is_closed: !!o.is_closed,
                start_time: o.start_time ? o.start_time.substring(0, 5) : null,
                end_time: o.end_time ? o.end_time.substring(0, 5) : null,
                slot_duration: o.slot_duration || null,
                visit_types: o.visit_types || null
            }));
            setOverridesList(processedOverrides);
        } catch (err: any) {
            console.error("Load availability data error:", err);
            showToast("error", "Failed to load availability configurations");
        }
    };

    useEffect(() => {
        (async () => {
            if (!hasFetched.current) {
                try {
                    hasFetched.current = true;
                    setLoading(true);
                    // Fetch vet profile to extract ID
                    const profileData = await api.get("/vet/myBio", undefined, "partner") as any;
                    const vid = profileData?.vet_id || profileData?.id;
                    if (vid) {
                        setVetId(vid);
                        await loadAllData(vid);
                    } else {
                        showToast("error", "Vet ID not identified.");
                    }
                } catch (e: any) {
                    console.error("Fetch profile/availability error:", e);
                    showToast("error", "Initialization failed.");
                } finally {
                    setLoading(false);
                }
            }
        })();
    }, []);

    // --- Actions: Weekly Schedule ---
    const handleWeeklyChange = <K extends keyof AvailabilityRow>(index: number, key: K, value: AvailabilityRow[K]) => {
        setWeeklyList(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [key]: value };
            return copy;
        });
    };

    const handleSaveWeekly = async () => {
        if (!vetId) return;
        setSaving(true);
        try {
            const body = weeklyList.map(row => {
                if (row.is_closed) {
                    return {
                        day_of_week: row.day_of_week,
                        start_time: null,
                        end_time: null,
                        slot_duration: null,
                        visit_types: null,
                        is_closed: true
                    };
                }
                return {
                    day_of_week: row.day_of_week,
                    start_time: row.start_time ? `${row.start_time}:00` : null,
                    end_time: row.end_time ? `${row.end_time}:00` : null,
                    slot_duration: Number(row.slot_duration),
                    visit_types: row.visit_types || ["in-clinic"],
                    is_closed: false
                };
            });

            await api.post(`/availability/${vetId}/defaultAvailability`, body, "partner");
            showToast("success", "Weekly schedule saved successfully.");
            await loadAllData(vetId);
        } catch (e: any) {
            console.error("Save weekly schedule error:", e);
            showToast("error", e?.message || "Failed to save weekly schedule");
        } finally {
            setSaving(false);
        }
    };

    // --- Actions: Breaks ---
    const handleAddBreak = async () => {
        if (!selectedAvIdForBreak) {
            showToast("error", "Please select a valid day for adding a break");
            return;
        }
        if (breakStart >= breakEnd) {
            showToast("error", "Break start time must be before end time");
            return;
        }
        setSaving(true);
        try {
            const body = {
                availability_id: selectedAvIdForBreak,
                start_time: `${breakStart}:00`,
                end_time: `${breakEnd}:00`
            };
            await api.post("/availability/break", body, "partner");
            showToast("success", "Break time added successfully.");
            if (vetId) await loadAllData(vetId);
        } catch (e: any) {
            console.error("Add break error:", e);
            showToast("error", e?.message || "Failed to add break");
        } finally {
            setSaving(false);
        }
    };

    // --- Actions: Overrides ---
    const handleAddOverride = async () => {
        if (!vetId) return;
        if (!overrideDate) {
            showToast("error", "Please choose a specific date");
            return;
        }
        if (!overrideIsClosed && overrideStart >= overrideEnd) {
            showToast("error", "Start time must be before end time");
            return;
        }
        setSaving(true);
        try {
            const body = {
                date: overrideDate,
                is_closed: overrideIsClosed,
                start_time: overrideIsClosed ? null : `${overrideStart}:00`,
                end_time: overrideIsClosed ? null : `${overrideEnd}:00`,
                slot_duration: overrideIsClosed ? null : Number(overrideSlotDuration),
                visit_types: overrideIsClosed ? null : overrideVisitTypes
            };
            await api.post(`/availability/${vetId}/override`, body, "partner");
            showToast("success", "Single-day override created successfully.");
            setOverrideDate("");
            await loadAllData(vetId);
        } catch (e: any) {
            console.error("Add override error:", e);
            showToast("error", e?.message || "Failed to add override");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-blue-50 flex items-center justify-center ${poppins.className}`}>
                <div className="animate-pulse space-y-6 w-full max-w-4xl bg-white p-8 rounded-2xl shadow-lg">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
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

            <div className={`min-h-screen bg-blue-50 p-4 md:p-8 ${poppins.className}`}>
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-800">Manage Practice Schedule</h1>
                        <span className="text-sm text-gray-500 font-medium">Settings &gt; Time Slots</span>
                    </div>

                    {/* Tab Selection */}
                    <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 border border-gray-100 max-w-lg w-full">
                        <button
                            onClick={() => setActiveTab("weekly")}
                            className={`flex-1 py-2.5 px-2 md:px-3 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 md:gap-2 transition-all whitespace-nowrap ${
                                activeTab === "weekly" ? "bg-[#d14d91] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <FaClock className="flex-shrink-0" />
                            <span>Weekly Schedule</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("breaks")}
                            className={`flex-1 py-2.5 px-2 md:px-3 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 md:gap-2 transition-all whitespace-nowrap ${
                                activeTab === "breaks" ? "bg-[#d14d91] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <FaCoffee className="flex-shrink-0" />
                            <span>Break Times</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("overrides")}
                            className={`flex-1 py-2.5 px-2 md:px-3 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 md:gap-2 transition-all whitespace-nowrap ${
                                activeTab === "overrides" ? "bg-[#d14d91] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <FaCalendarTimes className="flex-shrink-0" />
                            <span>Day Overrides</span>
                        </button>
                    </div>

                    {/* Weekly Schedule Panel */}
                    {activeTab === "weekly" && (
                        <div className="space-y-6">
                            <div className="grid gap-4">
                                {weeklyList.map((row, idx) => (
                                    <div
                                        key={row.day_of_week}
                                        className={`bg-white rounded-2xl p-5 shadow-sm border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                            row.is_closed ? "border-gray-200 bg-gray-50/50 opacity-80" : "border-pink-100"
                                        }`}
                                    >
                                        {/* Day Name + Closed Status Toggle */}
                                        <div className="flex items-center justify-between md:justify-start gap-4 min-w-[180px]">
                                            <span className="font-bold text-gray-800 text-base">{WEEKDAYS[row.day_of_week]}</span>
                                            <button
                                                onClick={() => handleWeeklyChange(idx, "is_closed", !row.is_closed)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                                    row.is_closed
                                                        ? "bg-gray-100 text-gray-400 border-gray-200"
                                                        : "bg-green-50 text-green-700 border-green-200"
                                                }`}
                                            >
                                                {row.is_closed ? "CLOSED" : "OPEN"}
                                            </button>
                                        </div>

                                        {/* Timing Fields */}
                                        {!row.is_closed && (
                                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                                                <div>
                                                    <label className="block text-xs text-gray-400 font-medium mb-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={row.start_time || "09:00"}
                                                        onChange={e => handleWeeklyChange(idx, "start_time", e.target.value)}
                                                        className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 font-medium mb-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={row.end_time || "17:00"}
                                                        onChange={e => handleWeeklyChange(idx, "end_time", e.target.value)}
                                                        className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 font-medium mb-1">Slot Duration</label>
                                                    <select
                                                        value={row.slot_duration || 30}
                                                        onChange={e => handleWeeklyChange(idx, "slot_duration", Number(e.target.value))}
                                                        className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                                    >
                                                        <option value={15}>15 Mins</option>
                                                        <option value={30}>30 Mins</option>
                                                        <option value={45}>45 Mins</option>
                                                        <option value={60}>60 Mins</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 font-medium mb-1">Visit Channel</label>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {["in-clinic", "online", "home-visit"].map(vt => {
                                                            const active = (row.visit_types || []).includes(vt);
                                                            return (
                                                                <button
                                                                    key={vt}
                                                                    onClick={() => {
                                                                        const curr = new Set(row.visit_types || []);
                                                                        if (active) curr.delete(vt); else curr.add(vt);
                                                                        handleWeeklyChange(idx, "visit_types", Array.from(curr));
                                                                    }}
                                                                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border transition-all ${
                                                                        active
                                                                            ? "bg-pink-50 text-[#d14d91] border-pink-200"
                                                                            : "bg-gray-50 text-gray-400 border-gray-100"
                                                                    }`}
                                                                >
                                                                    {vt.replace("-", " ")}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {row.is_closed && (
                                            <div className="text-sm text-gray-400 font-medium italic flex-1 text-right">
                                                No booking slots will be generated.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Save Footer */}
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveWeekly}
                                    disabled={saving}
                                    className={`bg-[#d14d91] hover:bg-[#bc3575] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${
                                        saving ? "opacity-75 cursor-wait" : "hover:scale-[1.02]"
                                    }`}
                                >
                                    <FaCheck />
                                    <span>{saving ? "Saving Changes..." : "Save Weekly Schedule"}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Break Times Panel */}
                    {activeTab === "breaks" && (
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Create Break Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 h-fit">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <FaCoffee className="text-[#d14d91]" />
                                    <span>Add Break Time</span>
                                </h3>
                                <div>
                                    <label className="block text-xs text-gray-400 font-medium mb-1">Target Day</label>
                                    <select
                                        value={selectedAvIdForBreak || ""}
                                        onChange={e => setSelectedAvIdForBreak(Number(e.target.value) || null)}
                                        className="w-full text-sm border rounded-lg p-2.5 bg-white text-black"
                                    >
                                        <option value="">-- Choose Day --</option>
                                        {weeklyList.filter(d => !d.is_closed && d.id).map(d => (
                                            <option key={d.id} value={d.id}>{WEEKDAYS[d.day_of_week]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-medium mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={breakStart}
                                            onChange={e => setBreakStart(e.target.value)}
                                            className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-medium mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={breakEnd}
                                            onChange={e => setBreakEnd(e.target.value)}
                                            className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddBreak}
                                    disabled={saving}
                                    className="w-full bg-[#d14d91] hover:bg-[#bc3575] text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <FaPlus size={12} />
                                    <span>Add Break</span>
                                </button>
                            </div>

                            {/* Existing Breaks List */}
                            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Active Break Intervals</h3>
                                {breaksList.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">
                                        No breaks configured for open availability days.
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {breaksList.map(bk => {
                                            const av = weeklyList.find(d => d.id === bk.availability_id);
                                            const dayName = av ? WEEKDAYS[av.day_of_week] : "Unknown Day";
                                            return (
                                                <div
                                                    key={bk.id}
                                                    className="border border-gray-100 rounded-xl p-4 flex items-center justify-between bg-gray-50/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-xs bg-pink-50 text-[#d14d91] border border-pink-100 px-2 py-1 rounded-md uppercase">
                                                            {dayName}
                                                        </span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {bk.start_time.substring(0, 5)} - {bk.end_time.substring(0, 5)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 italic">Managed automatically</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Day Overrides Panel */}
                    {activeTab === "overrides" && (
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Create Override Form */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 h-fit">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <FaCalendarTimes className="text-[#d14d91]" />
                                    <span>Create Date Override</span>
                                </h3>
                                <div>
                                    <label className="block text-xs text-gray-400 font-medium mb-1">Target Date</label>
                                    <input
                                        type="date"
                                        value={overrideDate}
                                        onChange={e => setOverrideDate(e.target.value)}
                                        className="w-full text-sm border rounded-lg p-2.5 bg-white text-black"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-600">Close Clinic on this Date</span>
                                    <button
                                        onClick={() => setOverrideIsClosed(!overrideIsClosed)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                            overrideIsClosed
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-gray-100 text-gray-400 border-gray-200"
                                        }`}
                                    >
                                        {overrideIsClosed ? "CLOSED" : "CUSTOM HOURS"}
                                    </button>
                                </div>
                                {!overrideIsClosed && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-400 font-medium mb-1">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={overrideStart}
                                                    onChange={e => setOverrideStart(e.target.value)}
                                                    className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 font-medium mb-1">End Time</label>
                                                <input
                                                    type="time"
                                                    value={overrideEnd}
                                                    onChange={e => setOverrideEnd(e.target.value)}
                                                    className="w-full text-sm border rounded-lg p-2 bg-white text-black"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-medium mb-1">Slot Duration</label>
                                            <select
                                                value={overrideSlotDuration}
                                                onChange={e => setOverrideSlotDuration(Number(e.target.value))}
                                                className="w-full text-sm border rounded-lg p-2.5 bg-white text-black"
                                            >
                                                <option value={15}>15 Mins</option>
                                                <option value={30}>30 Mins</option>
                                                <option value={45}>45 Mins</option>
                                                <option value={60}>60 Mins</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                <button
                                    onClick={handleAddOverride}
                                    disabled={saving}
                                    className="w-full bg-[#d14d91] hover:bg-[#bc3575] text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <FaPlus size={12} />
                                    <span>Add Override</span>
                                </button>
                            </div>

                            {/* Existing Overrides List */}
                            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Upcoming Active Overrides</h3>
                                {overridesList.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">
                                        No single-day overrides configured.
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {overridesList.map(ov => (
                                            <div
                                                key={ov.id}
                                                className={`border rounded-xl p-4 flex items-center justify-between bg-gray-50/50 ${
                                                    ov.is_closed ? "border-red-100 bg-red-50/20" : "border-gray-100"
                                                }`}
                                            >
                                                <div>
                                                    <span className="font-bold text-sm text-gray-800 block">
                                                        {new Date(ov.date).toLocaleDateString("en-US", {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric"
                                                        })}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-1 block">
                                                        {ov.is_closed ? (
                                                            <span className="text-red-600 font-semibold uppercase">Closed all day</span>
                                                        ) : (
                                                            <span>Custom timings: {ov.start_time} - {ov.end_time} ({ov.slot_duration} min slots)</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400 italic">Override Active</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
