"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Search, Filter, History } from "lucide-react";
import Image from "next/image";
import { AlertBanner } from "@/components/common/AlertBanner";

export default function PetArchivePage() {
    const router = useRouter();
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [errors, setErrors] = useState<{ id: string; title: string; message: string }[]>([]);

    useEffect(() => {
        setLoading(true);
        api.get("/vet/treated_pets", undefined, "partner")
            .then(res => setPets(res || []))
            .catch(err => setErrors([{ id: 'fetch', title: 'Error', message: err.message || 'Failed to fetch pets' }]))
            .finally(() => setLoading(false));
    }, []);

    const filteredPets = pets.filter(pet => {
        const term = searchQuery.toLowerCase();
        return (pet.name?.toLowerCase() || "").includes(term) || (pet.owner_name?.toLowerCase() || "").includes(term);
    });

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-6 h-6 text-pink-500" />
                            Pet Archive
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">View and manage history of all pets you have treated</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by pet or owner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {errors.map(err => (
                    <AlertBanner 
                        key={err.id} 
                        type="danger" 
                        title={err.title} 
                        message={err.message} 
                        onDismiss={() => setErrors(curr => curr.filter(e => e.id !== err.id))} 
                    />
                ))}

                {/* Content Section */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
                    </div>
                ) : filteredPets.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No pets found</h3>
                        <p className="text-gray-500 text-sm mt-1">You haven't treated any pets matching this search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPets.map(pet => (
                            <div 
                                key={pet.id}
                                onClick={() => router.push(`/partner/myAppointments/petDetails/${pet.id}`)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                        {pet.profile_picture ? (
                                            <Image 
                                                src={pet.profile_picture} 
                                                alt={pet.name || "Pet"} 
                                                fill 
                                                className="object-cover group-hover:scale-110 transition-transform duration-300" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-pink-50 text-pink-300 font-bold text-xl">
                                                {pet.name?.charAt(0) || "P"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 truncate">{pet.name}</h3>
                                            {pet.is_deleted && (
                                                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded border border-red-200">
                                                    Deleted
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{pet.species || "Unknown Species"}</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium text-gray-700">Owner:</span> {pet.owner_name}
                                    </div>
                                    <div className="text-xs font-semibold text-pink-600 group-hover:text-pink-700 transition-colors">
                                        View History →
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
