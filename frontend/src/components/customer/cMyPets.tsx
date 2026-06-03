"use client";

import {Pet} from "@/app/customer/dashboard/page";
import {api} from "@/utils/api";
import React, {useEffect, useRef, useState} from "react";
import {FaPlus} from "react-icons/fa";
import { LoadingState } from "@/components/common/LoadingState";
import {ErrorAlert} from "@/utils/commonTypes";
import {removeItemById} from "@/utils/common";
import { AlertBanner } from "@/components/common/AlertBanner";
import { EmptyPets } from "../common/EmptyStates";

interface C_MyPetsProps {
    onViewPetDetails: (petId: number) => void;
    onViewPetHistory: (petId: number) => void;
}


export default function C_MyPets({ onViewPetDetails, onViewPetHistory }: C_MyPetsProps) {
    const [myPets, setMyPets] = useState<Pet[]>([]);
    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };
    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            setLoading(true);
            setErrors(removeItemById(errors, "get-my-pets-api"));
            //fetching my pets
            const fetchMyPets = api.get("/pets/myPets");
            Promise.all([fetchMyPets]).then(([res1]) => {
                setMyPets(Array.isArray(res1) ? res1 : []);
                setLoading(false);
            }).catch((error) => {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'get-my-pets-api',
                        title: `API Error while getting your pets information`,
                        message: error.message || 'Unknown error'
                    }
                ]);
                setLoading(false);
            })
        }
        
    }, []);

    const handleAddButtonClick = () => {
        onViewPetDetails(-1);
    }

    return (
        <>
            {/* Show all visible error banners */}
            {errors.map(e => (
                <div key={e.id} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                    <AlertBanner
                        type="danger"
                        title={e.title}
                        message={e.message}
                        onDismiss={() => handleDismiss(e.id)}
                    />
                </div>
            ))}
            <div className="min-h-screen bg-[#eaeaff] flex flex-col items-center py-6">
                <h2 className="font-medium text-center mb-6 text-grey-100">My Pets</h2>
                <div className="flex flex-col gap-6 w-full max-w-xs">
                    {myPets.length === 0 && <EmptyPets />}
                    {myPets.map((pet) => (
                        <div key={pet.id} className="bg-white rounded-xl shadow flex flex-col items-center">
                            <img
                                src={pet.profile_picture || pet.profile_url || "/images/placeholder-pet.png"}
                                alt={pet.name}
                                className="w-full h-48 object-cover rounded-t-xl"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/placeholder-pet.png"; // Use a local generic placeholder or icon path here if placeholder-pet.png doesn't exist
                                }}
                            />
                            <div className="w-full flex justify-center gap-3 py-3">
                                <button className="bg-pink-500 text-white rounded px-4 py-1 transition hover:bg-pink-600 text-sm font-semibold"
                                        onClick={() => onViewPetDetails(pet.id)}>
                                    View Details
                                </button>
                                <button className="bg-pink-500 text-white rounded px-4 py-1 transition hover:bg-pink-600 text-sm font-semibold"
                                        onClick={() => onViewPetHistory(pet.id)}>
                                    Pet History
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold w-full max-w-xs py-3 mt-8 rounded-lg flex items-center justify-center gap-3 text-base transition"
                        onClick={handleAddButtonClick}>
                    <FaPlus />
                    Add Pets
                </button>
                {loading && <LoadingState fullScreen message="Loading..." />}
            </div>
        </>

    );
}
