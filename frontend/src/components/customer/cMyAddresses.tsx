"use client";

import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import LocationSelector, { Home_Visit_Address } from "./locationSelector";
import { PageType } from "@/app/customer/dashboard/constants";

interface C_MyAddressesProps {
    onPageTypeChange: (pageType: PageType) => void;
}

export default function C_MyAddresses({ onPageTypeChange }: C_MyAddressesProps) {
    const [selectedAddress, setSelectedAddress] = useState<Home_Visit_Address>({});

    const handleSelectedAddressChange = (address: Home_Visit_Address) => {
        setSelectedAddress(address);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="flex items-center mb-8">
                <button
                    onClick={() => onPageTypeChange(PageType.DASHBOARD)}
                    className="flex items-center text-gray-600 hover:text-pink-500 mr-4"
                >
                    <FaArrowLeft className="mr-2" /> Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="mb-6">
                    <p className="text-gray-600 text-sm">
                        Manage your saved addresses for home visits. The address you select here will be used as your default location for finding nearby vets.
                    </p>
                </div>
                
                <LocationSelector 
                    onSelectedAddressChange={handleSelectedAddressChange}
                    selectedAddressProp={selectedAddress} 
                />
            </div>
        </div>
    );
}
