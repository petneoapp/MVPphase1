'use client';

import {
    FaChevronRight,
    FaExclamationTriangle, FaInfoCircle,
    FaLock,
    FaQuestionCircle,
    FaUserCircle,
    FaUserFriends
} from "react-icons/fa";
import {Menu, X} from "lucide-react";
import SimpleOverlay from "@/components/customer/simpleOverlay";
import React, {useEffect, useRef, useState, useCallback} from "react";
import { LoadingState } from "@/components/common/LoadingState";
import {api, clearAuth} from "@/utils/api";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {PiClockCountdownBold} from "react-icons/pi";
import {IoMdNotifications} from "react-icons/io";
import {Poppins} from "next/font/google";
import {ErrorAlert, PartnerAppointment} from "@/utils/commonTypes";
import {removeItemById} from "@/utils/common";
import { AlertBanner } from "@/components/common/AlertBanner";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

import { PartnerMenuItemType, PartnerDetails } from "@/types/partner";


export default function PartnerLayout({ children }: { children: React.ReactNode; }) {
    const router = useRouter();

    const [partnerDetails, setPartnerDetails] = useState<PartnerDetails>({});

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const [loading, setLoading] = useState<boolean>(true);

    const fetchPartnerDetails = useCallback((showLoader = true) => {
        if (showLoader) setLoading(true);
        setErrors(curr => curr.filter(e => e.id !== "home-get-api"));
        api.get("/appointments/vetTodaySummary", undefined, "partner")
            .then((res: any) => {
                if (res && res.profile_picture_url) {
                    res.profile_picture_url = `${res.profile_picture_url.split("?")[0]}?t=${Date.now()}`;
                }
                setPartnerDetails(res);
                setLoading(false);
            })
            .catch((error) => {
                setLoading(false);
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'home-get-api',
                        title: `API Error while getting your information`,
                        message: error.message || 'Unknown error'
                    }
                ]);
                if (error?.message?.includes("403")) {
                    handleLogOut();
                }
            });
    }, []);

    useEffect(() => {
        fetchPartnerDetails(true);

        const handleUpdate = () => {
            fetchPartnerDetails(false);
        };

        if (typeof window !== "undefined") {
            window.addEventListener("vet-profile-updated", handleUpdate);
            return () => {
                window.removeEventListener("vet-profile-updated", handleUpdate);
            };
        }
    }, [fetchPartnerDetails]);

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const menuButtonRef = useRef(null);

    const menuItems = [
        { icon: <IoMdNotifications />, label: "Work Status", id: PartnerMenuItemType.WORK_STATUS },
        { icon: <PiClockCountdownBold />, label: "Manage Time Slots", id: PartnerMenuItemType.MANAGE_TIME_SLOTS },
        { icon: <FaUserFriends />, label: "Consultation Chats", id: "CHAT" as PartnerMenuItemType },
        { icon: <FaUserCircle />, label: "My Bio", id: PartnerMenuItemType.MY_BIO },
        { icon: <FaLock />, label: "Privacy", id: PartnerMenuItemType.PRIVACY },
        { icon: <FaQuestionCircle />, label: "Help", id: PartnerMenuItemType.HELP },
        { icon: <FaInfoCircle />, label: "About", id: PartnerMenuItemType.ABOUT },
    ];

    function handleMenuClick(menuItem: { icon: React.JSX.Element; label: string; id: PartnerMenuItemType; }): void {
        setIsOpen(false);
        // routing to different pages
        if (menuItem.id === "CHAT" as PartnerMenuItemType) {
            router.push(`/partner/chat`);
        } else if (menuItem.id === PartnerMenuItemType.MY_BIO) {
            router.push(`/partner/myBio`);
        } else if (menuItem.id === PartnerMenuItemType.MANAGE_TIME_SLOTS) {
            router.push(`/partner/manageTimeSlots`);
        } else if (menuItem.id === PartnerMenuItemType.WORK_STATUS) {
            router.push(`/partner/workStatus`);
        } else if (menuItem.id === PartnerMenuItemType.PRIVACY) {
            router.push(`/partner/privacy`);
        } else if (menuItem.id === PartnerMenuItemType.HELP) {
            router.push(`/partner/help`);
        } else if (menuItem.id === PartnerMenuItemType.ABOUT) {
            router.push(`/partner/about`);
        }
    }

    function handleLogOut(): void {
        setIsOpen(false);
        clearAuth("partner");
        if (typeof window !== "undefined") window.location.href = "/login";
        else router.push("/login")
    }
    return (
        <div className={`min-h-screen bg-blue-50 text-gray-900 font-sans ${poppins.className}`}>
            <div className="sticky top-0 z-50">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 bg-white shadow">
                    {/* Left: Logo only */}
                    <Link href="/partner/dashboard" className="inline-flex items-center">
                        <img src="/images/logo.svg" alt="PetNeo" className="h-10" />
                    </Link>

                    <nav className="flex items-center space-x-4 text-sm font-semibold">
                        {/*<button*/}
                        {/*    type="button"*/}
                        {/*    className="flex items-center gap-2 bg-yellow-400 rounded-md px-4 py-2 font-semibold shadow hover:bg-yellow-500 transition"*/}
                        {/*>*/}
                        {/*    <FaExclamationTriangle className="w-6 h-6" />*/}
                        {/*    Emergency*/}
                        {/*</button>*/}
                        <div className="flex items-center space-x-2">
                            <span>Hello,</span>
                            <span className="font-semibold text-pink-600">Dr.{partnerDetails?.vet_name}</span>
                            <img
                                src={partnerDetails?.profile_picture_url}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        </div>
                        <button
                            aria-label="Menu"
                            className="text-2xl transition font-bold focus:outline-none"
                            type="button"
                            ref={menuButtonRef}
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </nav>
                </header>
            </div>
            {/* user menu popup */}
            {isOpen && <SimpleOverlay
                targetRef={menuButtonRef}
                placement="bottom"
                show={isOpen}
                offset={40}
                offSetY={350}
                onHide={() => {setIsOpen(false)}}
            >
                <div className="w-90 max-w-xs rounded-xl shadow-md p-4 bg-white">
                    <div className="mb-4">
                        {menuItems.map((menuItem) => (
                            <div
                                key={menuItem.id}
                                className="cursor-pointer border-0 px-0 py-2"
                                onClick={() => handleMenuClick(menuItem)}
                            >
                                <div className="flex flex-row flex-nowrap items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg">
                                            {menuItem.icon}
                                        </div>
                                        <span className="font-semibold text-black">{menuItem.label}</span>
                                    </div>
                                    <FaChevronRight className="text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="w-full h-10 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg"
                        onClick={handleLogOut}>
                        Logout
                    </button>
                </div>
            </SimpleOverlay>}

            <main className={`${isOpen ? "blur-sm pointer-events-none" : ""} overflow-auto`}>
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
                {children}
            </main>
            {loading && <LoadingState fullScreen message="Loading..." />}
        </div>
    );
}
