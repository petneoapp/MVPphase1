"use client";

import React from "react";
import { Poppins } from "next/font/google";
import { FaHeart, FaShieldAlt, FaAward, FaMapMarkerAlt } from "react-icons/fa";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export default function PartnerAboutPage(): React.JSX.Element {
    return (
        <div className={`min-h-screen bg-blue-50 p-6 md:p-10 ${poppins.className}`}>
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Hero / Brand Intro */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-3">
                    <img src="/images/logo.svg" alt="PetNeo" className="h-14 mx-auto mb-2" />
                    <h1 className="text-2xl font-bold text-gray-800">About PetNeo</h1>
                    <p className="text-sm text-gray-500 max-w-lg mx-auto">
                        PetNeo is India&apos;s leading platform dedicated to bringing premium, convenient, and reliable healthcare services to pets and their owners.
                    </p>
                </div>

                {/* Mission & Vision Row */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-2">
                        <h2 className="text-[#00695C] font-bold text-lg">Our Mission</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            At PetNeo, our mission is to revolutionize the pet care experience in India by bridging the gap between clinical vets and loving pet parents.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-2">
                        <h2 className="text-[#00695C] font-bold text-lg">Our Vision</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Our vision is to build India&apos;s most trusted and indispensable network for pet wellness, clinical management, and emergency response.
                        </p>
                    </div>
                </div>

                {/* Value Pillars Grid */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">Why Choose PetNeo?</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-pink-50 rounded-xl text-[#d14d91]">
                                <FaAward className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">Verified Professionals</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Every veterinary practitioner on PetNeo is verified through active licensing and medical registry audits.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-pink-50 rounded-xl text-[#d14d91]">
                                <FaHeart className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">Patient-Centric Care</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Full digital health records, prescription management, and reminders help ensure pets get optimal care.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-pink-50 rounded-xl text-[#d14d91]">
                                <FaShieldAlt className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">Secure &amp; Compliant</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    All data, billing credentials, and client histories are securely backed up with industry-standard encryption.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-pink-50 rounded-xl text-[#d14d91]">
                                <FaMapMarkerAlt className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">Built for India</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Tailored options for home visits, digital billing, local address helpers, and community boards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Join Card */}
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 text-center">
                    <p className="text-[#d14d91] font-bold text-sm">
                        Join the PetNeo family and experience a smarter, simpler, and more joyful way to manage your veterinary practice.
                    </p>
                    <p className="text-xs text-gray-400 mt-3">Version 1.0.0 &bull; &copy; 2026 PetNeo Inc.</p>
                </div>

            </div>
        </div>
    );
}
