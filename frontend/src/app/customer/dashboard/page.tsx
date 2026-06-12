"use client";

import React, {useEffect, useRef, useState, Suspense} from "react";

import {
    FaChevronRight,
    FaExclamationTriangle,
    FaInfoCircle,
    FaLock,
    FaMapMarkerAlt,
    FaQuestionCircle,
    FaUserCircle,
    FaUserFriends
} from "react-icons/fa";
import {IoIosArrowForward} from "react-icons/io";
import C_DashboardMain, {Service} from "@/components/customer/cDashboard";
import C_VetDetails from "@/components/customer/cVetDetails";
import C_PetInfo from "@/components/customer/cPetInfo";
import C_MyAppointments from "@/components/customer/cMyAppointments";
import SimpleOverlay from "@/components/customer/simpleOverlay";
import C_VetProfile from "@/components/customer/cVetProfile";
import C_VetAppointmentBooking, {VISIT_ID} from "@/components/customer/cVetAppointmentBooking";
import {api, clearAuth} from "@/utils/api";
import { LoadingState } from "@/components/common/LoadingState";
import C_MyPets from "@/components/customer/cMyPets";
import {Menu, X} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {PageType} from "./constants";
import C_PetHistory from "@/components/customer/cPetHistory";
import C_MyBio from "@/components/customer/cMyBio";
import {setupForegroundNotifications} from "@/lib/firebase/utils";
import {ErrorBanner} from "@/components/common/ErrorBanner";
import {ErrorAlert} from "@/utils/commonTypes";
import {Poppins} from "next/font/google";
import {removeItemById} from "@/utils/common";

import DashboardHeader from "@/components/customer/DashboardHeader";
import DashboardBreadCrumbs from "@/components/customer/DashboardBreadCrumbs";
import DashboardMenu from "@/components/customer/DashboardMenu";

import { useCustomerDashboardData } from "@/hooks/useCustomerDashboardData";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export interface DayStatus {
    day: string;
    status: string;
}

export interface Clinic {
    address: string,
    name: string,
    latitude: number,
    longitude:  number
}

export interface VetTag {
    id: number;
   name: string;
}

export interface Vet {
    id: number;
    name: string;
    experience: string;
    rating: number;
    ratingCount: number;
    availableToday: boolean;
    tags: VetTag[];
    image: string;
    weekly_schedule: DayStatus[];
    clinic: Clinic;
}

export interface User {
    id: number;
    name: string;
    profile_url: string;
    location?: string;
}

export interface Pet {
    id: number;
    name: string;
    profile_url: string;
    profile_picture?: string;
    age?: string
}

function CustomerDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { 
        user, 
        userPets, 
        serviceBackendData, 
        loading, 
        errors, 
        dismissError,
        refetch
    } = useCustomerDashboardData();

    type BreadCrumb = {
        id: PageType;
        label: string;
    };

    const BreadCrumbsData: BreadCrumb[] = [
        { id: PageType.DASHBOARD, label: "Home"},
        {id: PageType.VET_DETAILS, label: "Vet Details"},
        {id: PageType.VET_PROFILE, label: "Vet Profile"},
        {id: PageType.VET_APPOINTMENT_BOOKING, label: "Appointments"},
        {id: PageType.MY_PETS, label: "My Pets"},
        {id: PageType.PET_INFO, label: "Pet Details"},
        {id: PageType.PET_HISTORY, label: "Pet History"},
        {id: PageType.MY_BIO, label: "My Bio"},
        {id: PageType.PRIVACY, label: "Privacy"},
        {id: PageType.HELP, label: "Help"},
        {id: PageType.ABOUT, label: "About"},
        {id: PageType.MY_APPOINTMENTS, label: "My Appointments"}
    ];

    const [breadCrumbs, setBreadCrumbs] = useState<BreadCrumb[]>([BreadCrumbsData[0]]);
    const [pageType, setPageType] = useState(PageType.DASHBOARD);

    // Sync state with URL
    useEffect(() => {
        const view = searchParams.get("view");
        if (view && Object.values(PageType).includes(view as PageType)) {
            handlePageTypeChange(view as PageType);
        }
    }, [searchParams]);

    const handlePageTypeChange = (pageType: PageType) => {
        let breadCrumbsLocal: BreadCrumb[] = [];
        let disabled = false;
        if (pageType === PageType.MY_APPOINTMENTS) {
             breadCrumbsLocal = [{ id: PageType.DASHBOARD, label: "Home"}, {id: PageType.MY_APPOINTMENTS, label: "My Appointments"}];
        } else if (pageType === PageType.MY_PETS) {
            breadCrumbsLocal = [{ id: PageType.DASHBOARD, label: "Home"}, {id: PageType.MY_PETS, label: "My Pets"}];
        } else if (pageType === PageType.MY_BIO) {
            breadCrumbsLocal = [{ id: PageType.DASHBOARD, label: "Home"}, {id: PageType.MY_BIO, label: "My Bio"}];
        } else if (pageType === PageType.PRIVACY) {
            breadCrumbsLocal = [{ id: PageType.DASHBOARD, label: "Home"}, {id: PageType.PRIVACY, label: "Privacy"}];
        } else if (pageType === PageType.HELP) {
            breadCrumbsLocal = [{ id: PageType.DASHBOARD, label: "Home"}, {id: PageType.HELP, label: "Help"}];
        } else if (pageType === PageType.ABOUT) {
            breadCrumbsLocal = [{ id: PageType.DASHBOARD, label: "Home"}, {id: PageType.ABOUT, label: "About"}];
        } else {
            const bcIndex = breadCrumbs.findIndex((item) => item.id === pageType);
            if (bcIndex >= 0) {
                breadCrumbsLocal = breadCrumbs.slice(0, bcIndex + 1);
            } else {
                const breadCrumb = BreadCrumbsData.find((item) => item.id === pageType);
                if (breadCrumb) {
                    breadCrumbsLocal = [...breadCrumbs, breadCrumb];
                }
            }
        }
        
        if (!disabled){
            setBreadCrumbs(breadCrumbsLocal);
            setPageType(pageType);
            // Update URL search params only if it changed to prevent infinite loops with useSearchParams
            const currentParams = new URLSearchParams(window.location.search);
            if (currentParams.get("view") !== pageType) {
                currentParams.set("view", pageType);
                window.history.pushState(null, "", `?${currentParams.toString()}`);
            }
        }  
    };

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const menuItems = [
        { icon: <FaUserFriends />, label: "My Pets", id: PageType.MY_PETS },
        { icon: <FaUserCircle />, label: "My Bio", id: PageType.MY_BIO },
        { icon: <FaExclamationTriangle />, label: "Consultation Chats", id: "CHAT" as PageType },
        { icon: <FaLock />, label: "Privacy", id: PageType.PRIVACY },
        { icon: <FaQuestionCircle />, label: "Help", id: PageType.HELP },
        { icon: <FaInfoCircle />, label: "About", id: PageType.ABOUT },
    ];

    const [selectedVet, setSelectedVet] = useState<Vet | null>(null);

    const handleVetSelection = (vet: Vet) => {
        setSelectedVet(vet);
        handlePageTypeChange(PageType.VET_PROFILE);
    }


    const handleBreadCrumbsClick = (item: BreadCrumb) => {
        return () => {
            handlePageTypeChange(item.id);
        };
    };

    useEffect(() => {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            setupForegroundNotifications();
        }
    }, []);


    function handleMenuClick(menuItem: { icon: React.ReactNode; label: string; id: PageType; }): void {
        setIsOpen(false);
        if (menuItem.id === "CHAT" as PageType) {
            router.push(`/customer/chat`);
        } else {
            handlePageTypeChange(menuItem.id);
        }
    }

    function handleLogOut(): void {
        setIsOpen(false);
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        else router.push("/login")
    }

    const [selectedPetId, setSelectedPetId] = useState<number>(-1);

    function viewPetDetails(petId: number): void {
        setSelectedPetId(petId);
        handlePageTypeChange(PageType.PET_INFO);
    }
    function goToMyPets() {
        handlePageTypeChange(PageType.MY_PETS);
    }
    const viewPetHistory = (petId: number): void => {
        setSelectedPetId(petId);
        handlePageTypeChange(PageType.PET_HISTORY);
    };

    const [selectedServiceVisitType, setSelectedServiceVisitType] = useState<VISIT_ID | null>(null);
    const [selectedServiceId, SetSelectedServiceId] = useState<string | null>(null);
    const handleServiceSelection = (service: Service): void => {
        setSelectedServiceVisitType(service.visit_type || null);
        SetSelectedServiceId(serviceBackendData?.find((item) => item.name === service.serviceName)?.id);
    }


  return (
    <div className={`min-h-screen bg-[#e1e5f8] text-gray-900 font-sans ${poppins.className}`}>
      <DashboardHeader
        userName={user?.name}
        userProfileUrl={user?.profile_url}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        menuButtonRef={menuButtonRef}
      />

      <DashboardBreadCrumbs
        breadCrumbs={breadCrumbs}
        handleBreadCrumbsClick={handleBreadCrumbsClick}
        userLocation={user?.location}
        isOpen={isOpen}
      />

      <DashboardMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        menuButtonRef={menuButtonRef}
        menuItems={menuItems}
        handleMenuClick={handleMenuClick}
        handleLogOut={handleLogOut}
      />

      <main className={`${isOpen ? "blur-sm pointer-events-none" : ""} overflow-auto`}>
        {/* Show all visible error banners */}
        {errors.map(e => (
          <ErrorBanner
            key={e.id}
            title={e.title}
            message={e.message}
            visible={true}
            onDismiss={() => dismissError(e.id)}
          />
        ))}

        {pageType === PageType.DASHBOARD && (
          <C_DashboardMain
            user={user}
            pets={userPets}
            onViewPetDetails={viewPetDetails}
            onPageTypeChange={handlePageTypeChange}
            onServiceSelection={handleServiceSelection}
          />
        )}
        {pageType === PageType.VET_DETAILS && (
          <C_VetDetails
            onVetSelection={handleVetSelection}
            selectedServiceVisitType={selectedServiceVisitType}
            selectedServiceId={selectedServiceId}
            onPageTypeChange={handlePageTypeChange}
          />
        )}
        {pageType === PageType.VET_PROFILE && (
          <C_VetProfile selectedVet={selectedVet} onPageTypeChange={handlePageTypeChange} />
        )}
        {pageType === PageType.VET_APPOINTMENT_BOOKING && (
          <C_VetAppointmentBooking
            user={user}
            vet={selectedVet}
            userPets={userPets}
            onPageTypeChange={handlePageTypeChange}
            selectedServiceVisitType={selectedServiceVisitType}
            selectedServiceId={selectedServiceId}
          />
        )}
        {pageType === PageType.MY_PETS && (
          <C_MyPets onViewPetDetails={viewPetDetails} onViewPetHistory={viewPetHistory} />
        )}
        {pageType === PageType.PET_INFO && <C_PetInfo petId={selectedPetId} goToMyPets={goToMyPets} />}
        {pageType === PageType.PET_HISTORY && <C_PetHistory petId={selectedPetId} />}
        {pageType === PageType.MY_APPOINTMENTS && <C_MyAppointments onPageTypeChange={handlePageTypeChange} />}
        {pageType === PageType.MY_BIO && <C_MyBio onProfileUpdate={refetch} />}
        {pageType === PageType.PRIVACY && <div className="p-8 text-center text-gray-600 bg-white m-4 rounded-xl shadow"><h2 className="text-2xl font-bold mb-4 text-gray-800">Privacy Policy</h2><p>Your privacy is important to us. We will update this section soon.</p></div>}
        {pageType === PageType.HELP && <div className="p-8 text-center text-gray-600 bg-white m-4 rounded-xl shadow"><h2 className="text-2xl font-bold mb-4 text-gray-800">Help & Support</h2><p>Our support system is under construction. Please check back later.</p></div>}
        {pageType === PageType.ABOUT && <div className="p-8 text-center text-gray-600 bg-white m-4 rounded-xl shadow"><h2 className="text-2xl font-bold mb-4 text-gray-800">About PetNeo</h2><p>PetNeo is your complete pet care companion platform.</p></div>}
      </main>

      {loading && <LoadingState fullScreen message="Loading dashboard..." />}
    </div>
  );
}

export default function CustomerDashboard() {
    return (
        <Suspense fallback={<LoadingState fullScreen />}>
            <CustomerDashboardContent />
        </Suspense>
    );
}
