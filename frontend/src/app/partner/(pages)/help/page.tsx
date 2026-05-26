"use client";

import React, { useState } from "react";
import { Poppins } from "next/font/google";
import { FaChevronDown, FaChevronUp, FaEnvelope, FaHeadset } from "react-icons/fa";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

type FAQItem = {
    question: string;
    answer: string;
};

const faqs: FAQItem[] = [
    {
        question: "How do I manage my weekly availability?",
        answer: "Navigate to 'Manage Time Slots' from the main menu. There, you can edit availability timings, slot durations, and allowed visit types for each day of the week."
    },
    {
        question: "How do I toggle Emergency Mode?",
        answer: "Under 'Work Status', toggle the 'Emergency Bookings' switch. This will mark you as available 24/7 for urgent consultations."
    },
    {
        question: "How do I add breaks or overrides?",
        answer: "Open 'Manage Time Slots' and scroll to the bottom sections. You can add recurring breaks for any day of the week, or create single-day overrides (e.g., if you are closed on a specific holiday)."
    },
    {
        question: "How do I update my clinic coordinates on the map?",
        answer: "Go to 'My Bio', click the 'Edit Profile' button, scroll to 'Clinic Location', and drag the map marker to your clinic's precise spot. Then save changes."
    }
];

export default function PartnerHelpPage(): React.JSX.Element {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const copyEmail = () => {
        navigator.clipboard.writeText("info@petneo.in");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`min-h-screen bg-blue-50 p-6 md:p-10 ${poppins.className}`}>
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Hero Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-[#d14d91]">
                        <FaHeadset className="text-4xl animate-bounce" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Help &amp; Support</h1>
                    <p className="text-sm text-gray-500 max-w-md">
                        We are here 24/7 to answer your practice management or pet care questions. Get in touch with us.
                    </p>

                    {/* Contact details */}
                    <button
                        onClick={copyEmail}
                        className="mt-2 bg-pink-50 hover:bg-pink-100 text-[#d14d91] font-bold py-3 px-6 rounded-xl flex items-center gap-2 border border-pink-200 transition-all active:scale-95"
                    >
                        <FaEnvelope />
                        <span>info@petneo.in</span>
                    </button>
                    {copied && <p className="text-xs text-green-600 font-semibold">Email copied to clipboard!</p>}
                </div>

                {/* FAQ section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div key={idx} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                    <button
                                        onClick={() => toggleFAQ(idx)}
                                        className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                                    >
                                        <span>{faq.question}</span>
                                        {isOpen ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                    </button>
                                    {isOpen && (
                                        <p className="mt-2 text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
