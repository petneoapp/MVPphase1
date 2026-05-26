"use client";

import React from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export default function PartnerPrivacyPage(): React.JSX.Element {
    return (
        <div className={`min-h-screen bg-blue-50 p-6 md:p-10 ${poppins.className}`}>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
                {/* Header */}
                <div className="border-b border-gray-100 pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Privacy Policy &amp; Terms</h1>
                    <p className="text-sm text-gray-500 mt-1">Last Updated: May 2026</p>
                </div>

                {/* Content */}
                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-[#00695C] mb-2">Welcome to PetNeo</h2>
                        <p className="text-sm">
                            These Terms and Conditions (&quot;Terms&quot;) govern your use of the PetNeo mobile application and website. 
                            By registering as a partner or user, you agree to comply with our policies regarding pet healthcare information, privacy, and user security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[#00695C] mb-2">1. Acceptance of Terms</h2>
                        <p className="text-sm">
                            By creating an account, accessing, or using the Platform, you confirm that you can form a binding contract 
                            with PetNeo, that you accept these Terms, and that you agree to comply with them.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[#00695C] mb-2">2. Services Offered</h2>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>Veterinary telehealth and video consultations.</li>
                            <li>Booking management for in-clinic, grooming, and training appointments.</li>
                            <li>Digital health record storage and management for pets.</li>
                            <li>Integrated communication platform between pet parents and professional vets.</li>
                        </ul>
                    </section>

                    {/* Alert banner for Disclaimer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs font-semibold">
                        Important Disclaimer: PetNeo is a platform connecting users with third-party veterinary professionals. 
                        PetNeo does not provide medical services directly and is not responsible for veterinary advice given.
                    </div>

                    <section>
                        <h2 className="text-lg font-bold text-[#00695C] mb-2">3. User Accounts &amp; Responsibilities</h2>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            <li><strong>Eligibility:</strong> Vets must hold active practice licenses from recognized veterinary authorities.</li>
                            <li><strong>Account Security:</strong> Keep credentials confidential; notify support if unauthorized access is suspected.</li>
                            <li><strong>Information Accuracy:</strong> All listed clinical schedules, qualifications, and certifications must be authentic.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[#00695C] mb-2">4. Contact Information</h2>
                        <p className="text-sm">
                            If you have questions, concerns, or requests regarding this Privacy Policy or the terms of services, 
                            please contact our compliance officer at <a href="mailto:support@petneo.com" className="text-pink-600 underline font-semibold">support@petneo.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
