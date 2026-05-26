"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSearch, FiMapPin, FiFilter } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FaArrowLeft } from "react-icons/fa";
import { Vet } from "@/app/customer/dashboard/page";
import { api } from "@/utils/api";
import FullScreenLoader from "./fullScreenLoader";
import {VISIT_ID} from "./cVetAppointmentBooking";
import PopupModel from "./popupModel";
import LocationSelector, {Home_Visit_Address} from "./locationSelector";
import DistanceSlider from "./DistanceSlider";
import {removeItemById} from "@/utils/common";
import { EmptyDoctors } from "../common/EmptyStates";
import {ErrorAlert} from "@/utils/commonTypes";
import {ErrorBanner} from "../common/ErrorBanner";


interface C_VetDetailsProps {
    selectedServiceVisitType: VISIT_ID | null;
    selectedServiceId: string | null;
    onVetSelection: (vet: Vet) => void;
}

interface C_VetCardProp {
    vet : Vet;
    onBookAppointmentClick: () => void;
}

function C_VetCard({vet, onBookAppointmentClick}: C_VetCardProp) {
    return (
        <>
            <div
                key={vet.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col"
            >
                <div className="flex items-center gap-4 mb-4">
                <img
                    src={vet.image}
                    alt={vet.name}
                    className="w-16 h-16 rounded-full object-cover border border-gray-300"
                />
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{vet.name}</h3>
                    <p className="text-gray-500 text-sm">{vet.experience}</p>
                    <div className="flex items-center text-yellow-500 text-sm mt-1">
                    <AiFillStar className="mr-1" />
                    <span className="font-semibold">{vet.rating.toFixed(1)}</span>
                    <span className="text-gray-400 ml-2">({vet.ratingCount} Ratings)</span>
                    </div>
                    {vet.availableToday && (
                    <span className="inline-block mt-2 text-pink-600 text-xs font-semibold bg-pink-100 rounded px-2 py-0.5">
                        Available Today
                    </span>
                    )}
                </div>
                </div>

                <div className="flex items-center text-gray-400 text-sm mb-4">
                <FiMapPin className="mr-1" />
                <span>{vet?.clinic?.address}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                {vet.tags.map((tag, i) => (
                    <span
                    key={i}
                    className="text-pink-600 text-xs font-semibold bg-pink-100 rounded px-3 py-1"
                    >
                    {tag.name}
                    </span>
                ))}
                </div>

                <button
                type="button"
                className="mt-auto bg-pink-600 hover:bg-pink-700 focus:ring-4 focus:ring-pink-300 text-white font-semibold text-sm rounded-md py-3 transition"
                onClick={onBookAppointmentClick}
                >
                Book Appointment
                </button>
            </div>
        </>
    );
}

const defaultNearByRadius = 10;

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
  error?: string | null;
  loading?: boolean;
};

export function useBrowserCoordinates() {
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoordinates({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setCoordinates({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        });
      }
    );
  }, []);

  return coordinates;
}

export default function C_VetDetails({ selectedServiceVisitType, selectedServiceId, onVetSelection }: C_VetDetailsProps) {

    const coordinates = useBrowserCoordinates();
    const [addressCoordinates, setAddressCoordinates] = useState<Coordinates>();
    const [nearbyRadius, setNearbyRadius] = useState<number>(defaultNearByRadius);
    const [actualNearByRadius, setActualNearByRadius] = useState<number>(defaultNearByRadius);

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };
    const [vets, setVets] = useState<Vet[]>([]);
    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        const latitude = addressCoordinates?.latitude || coordinates.latitude || 17.385;
        const longitude = addressCoordinates?.longitude || coordinates.longitude || 78.4867 ;
        if (!coordinates.loading && !hasFetched.current) {
            hasFetched.current = true;
            //fetching the nearby vets data.
            setLoading(true);
            let queryParams: any = {
                user_lat: latitude,
                user_lon: longitude,
                radius_km: actualNearByRadius
            };
            if (selectedServiceVisitType) {
                if (selectedServiceId) {
                    queryParams = {
                        user_lat: latitude,
                        user_lon: longitude,
                        radius_km: actualNearByRadius,
                        visit_type: selectedServiceVisitType,
                        service_ids: selectedServiceId
                    }
                } else {
                    queryParams = {
                        user_lat: latitude,
                        user_lon: longitude,
                        radius_km: actualNearByRadius,
                        visit_type: selectedServiceVisitType
                    };
                }
            } else {
                if (selectedServiceId) {
                    queryParams = {
                        user_lat: latitude,
                        user_lon: longitude,
                        radius_km: actualNearByRadius,
                        service_ids: selectedServiceId
                    }
                }
            }

            setErrors(removeItemById(errors, "get-near-by-vets-api"));
            const fetchNearByVets = api.get("/user/nearby-vets", queryParams);
            Promise.all([fetchNearByVets]).then(([res1]) => {
                const vetsLocal: Vet[] = [];
                res1?.forEach((item: any) => {
                    vetsLocal.push({
                        id: item?.vet_id,
                        name: item.name,
                        experience: item.experience,
                        rating: item.rating?.average,
                        ratingCount: item.rating?.count,
                        availableToday: item.availability_status === "Available",
                        clinic: item?.clinic,
                        tags: item.services,
                        image: item.profile_picture,
                        weekly_schedule: item.weekly_schedule
                    });
                });
                setVets(vetsLocal);
                setLoading(false);
                hasFetched.current = false;
            }).catch((error) => {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'get-near-by-vets-api',
                        title: `API Error while fetching near by Vets`,
                        message: error.message || 'Unknown error'
                    }
                ]);
                setLoading(false);
                hasFetched.current = false;
            });
        }
    }, [coordinates, addressCoordinates, actualNearByRadius]);

    const handleBookAppointmentClick = (vet: Vet) => {
        return () => onVetSelection(vet);
    };

    const [selectedAddress, setSelectedAddress] = useState<Home_Visit_Address>({});
    const [localSelectedAddress, setLocalSelectedAddress] = useState<Home_Visit_Address>({});
    const handleSelectedAddressChange = (selectedAddress: Home_Visit_Address) => {
        setSelectedAddress(selectedAddress);
    };

    const handleNearByRadiusChange = (nearbyRadius: number) => {
        setNearbyRadius(nearbyRadius);
    };

    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleFilterButtonClick = () => {
        setIsPopupOpen(true);
    };

    const handlePopupCancel = () => {
        //reverting the selectedAddress to localSelected address
        setSelectedAddress(localSelectedAddress);
        setNearbyRadius(actualNearByRadius);
        setIsPopupOpen(false);
    };
    const handlePrimaryAction =  () => {
        setLocalSelectedAddress(selectedAddress);
        setActualNearByRadius(nearbyRadius);
        setAddressCoordinates({
            latitude: selectedAddress?.latitude || null,
            longitude: selectedAddress?.longitude || null
        });
        setIsPopupOpen(false);
    };

    return (
        <>
            {/* Show all visible error banners */}
            {errors.map(e => (
                <ErrorBanner
                    key={e.id}
                    title={e.title}
                    message={e.message}
                    visible={true}
                    onDismiss={() => handleDismiss(e.id)}
                />
            ))}
            <div className="bg-gray-50 min-h-screen p-6">
                {/* Header with count, search, and filter */}
                <div className="flex flex-wrap items-center mb-8 gap-4">
                    <button 
                        onClick={() => onPageTypeChange(PageType.DASHBOARD)}
                        className="flex items-center text-gray-600 hover:text-pink-500 mr-2"
                    >
                        <FaArrowLeft className="mr-2" /> Back
                    </button>
                    <div className="text-gray-600 font-semibold text-sm">
                    Showing <span className="font-bold text-gray-900">{vets.length}</span> Vets
                    </div>
                    <div className="flex items-center w-full max-w-md relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search for Appointments"
                        className="pl-10 pr-8 py-2 w-[85%] left-3 rounded-md border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-700 text-sm"
                    />
                    <button
                        type="button"
                        aria-label="Filter"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-md transition"
                        onClick={handleFilterButtonClick}
                    >
                        <FiFilter size={18} />
                    </button>
                    </div>
                </div>

                <PopupModel open={isPopupOpen} onCancel={handlePopupCancel} onPrimary={handlePrimaryAction} primaryLabel="Select">
                    <div className="flex flex-col">
                        <div className="mb-4">
                            <DistanceSlider
                                min={0}
                                max={100}
                                initialValue={nearbyRadius}
                                unit="km"
                                size={150}
                                onChange={handleNearByRadiusChange}
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <label className="block text-sm font-semibold mb-2">Addresses</label>
                            <LocationSelector onSelectedAddressChange={handleSelectedAddressChange}
                                              selectedAddressProp={selectedAddress} />
                        </div>
                    </div>
                </PopupModel>

                {vets.length === 0 && <EmptyDoctors />}
                {/* Vet cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-20 gap-y-10 px-10">
                    {vets.map((vet) => (
                    <C_VetCard key={vet.id} vet={vet} onBookAppointmentClick={handleBookAppointmentClick(vet)}/>
                    ))}
                </div>
            </div>
            <FullScreenLoader loading={loading}/>
        </>
    );
}
