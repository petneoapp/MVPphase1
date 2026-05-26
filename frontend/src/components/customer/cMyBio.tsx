"use client";

import React, {useEffect, useRef, useState} from "react";
import {api, clearAuth} from "@/utils/api";
import {FaCamera, FaPen} from "react-icons/fa";
import FullScreenLoader from "./fullScreenLoader";
import ConfirmationPopup from "./ConfirmationPopup";
import router from "next/router";
import {ErrorAlert} from "@/utils/commonTypes";
import {removeItemById} from "@/utils/common";
import {ErrorBanner} from "../common/ErrorBanner";

interface UserBio {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    profile_picture_file?: File | null; //Extra param for creating/updating the user bio
    profile_picture_url?: string;
}

interface C_MyBioProps {
    onProfileUpdate?: () => void;
}

export default function C_MyBio({ onProfileUpdate }: C_MyBioProps) {

    const [userBio, setUserBio] = useState<UserBio | null>(null);
    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setErrors(curr => curr.filter(e => e.id !== "get-my-bio-api"));
        
        api.get(`/user/profile`)
            .then((res1) => {
                if (res1?.id) {
                    setUserBio(res1);
                }
            })
            .catch((error: any) => {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'get-my-bio-api',
                        title: `API Error while getting your profile`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const profileImageInputRef = useRef<HTMLInputElement | null>(null);
    const handleEditPhotoClick = () => {
        profileImageInputRef.current?.click();
    };
    const handleProfileImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview image
        const previewUrl = URL.createObjectURL(file);
        setUserBio({...userBio,  profile_picture_url: previewUrl, profile_picture_file: file});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUserBio({...userBio,  [e.target.name]: e.target.value});
    };

    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const onEdit = (): void => {
        setIsEditMode(true);
    };
    const onSave = async (): Promise<void> => {
        //constructing the payload
        const formData = new FormData();
        if (userBio?.first_name &&
            userBio?.email
        ) {
            formData.append("first_name", userBio.first_name);
            formData.append("email", userBio.email);
        } else {
            alert("Provide the necessary details");
            return;
        }

        if (userBio.last_name) {
            formData.append("last_name", userBio.last_name);
        }

        if (userBio.profile_picture_file) {
            formData.append("profile_picture", userBio.profile_picture_file);
        }

        try{
            setLoading(true);
            setErrors(removeItemById(errors, "save-my-bio-api"));
            //editing an existing user
            const editUserResponse = await api.formDataPut(`/user/updateProfile`, formData);
            if (editUserResponse) {
                // Fetch the updated profile to refresh the image and details
                const updatedProfile = await api.get(`/user/profile`);
                if (updatedProfile?.id) {
                    setUserBio(updatedProfile);
                }
                if (onProfileUpdate) {
                    onProfileUpdate();
                }
            }
            //setting the editmode false
            setIsEditMode(false);
        } catch(error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'save-my-bio-api',
                    title: `API Error while updating your profile`,
                    message: error.message || 'Unknown error'
                }
            ]);
        } finally {
            setLoading(false);
        }

    };

    const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState<boolean>(false);
    const onDelete = () => {
        //open the confirmation popup
        setIsConfirmationPopupOpen(true);
    };

    const handleConfirmationPopupConfirm = async () => {
        try {
            //open the loader
            setLoading(true);
            setErrors(removeItemById(errors, "delete-my-account-api"));
            //delete api call
            await api.delete(`/user/deleteAccount`);

            //close the loader
            setLoading(false);

            //closer the confirmation popup
            setIsConfirmationPopupOpen(false);

            //need to clear the auth details and redirect back to login page.
            clearAuth();
            if (typeof window !== "undefined") window.location.href = "/login";
            else router.push("/login")
        } catch(error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'delete-my-account-api',
                    title: `API Error while deleting your account`,
                    message: error.message || 'Unknown error'
                }
            ]);
            setLoading(false);
            //closer the confirmation popup
            setIsConfirmationPopupOpen(false);
        }
    }

    const handleConfirmationPopupCancel = () => {
        //closer the confirmation popup
        setIsConfirmationPopupOpen(false);
    }

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
            <div className="bg-[#eaeaff] min-h-screen flex flex-col items-center pt-8">
                <form className="w-full max-w-md bg-transparent rounded-lg p-4">
                    {/* User Photo */}
                    <div className="mb-4 relative flex items-center justify-center">
                        <div id="photo" className="relative w-25 h-25 rounded-full border bg-white border-gray-300 flex items-center justify-center overflow-hidden">
                            {userBio?.profile_picture_url ?
                                <img
                                    src={userBio.profile_picture_url}
                                    alt="user"
                                    className="w-full h-full object-cover"
                                /> :
                                <FaCamera className="text-gray-400 text-xl w-18 h-18 object-cover rounded-md bg-white" />}

                            {isEditMode &&
                                <>
                                    {/* Edit (pencil) icon */}
                                    <button
                                        type="button"
                                        onClick={handleEditPhotoClick}
                                        className="absolute bottom-2 right-2 bg-pink-500 text-white p-2 rounded-full shadow-md hover:bg-pink-600"
                                    >
                                        <FaPen size={12} />
                                    </button>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={profileImageInputRef}
                                        onChange={handleProfileImageFileChange}
                                    />
                                </>}
                        </div>
                    </div>
                    {/* User First and Last Name */}
                    <div className="mb-4 relative flex flex-row flex-nowrap justify-between">
                        {/* User First Name */}
                        <div className="w-[48%]">
                            <label className="block font-semibold mb-1" htmlFor="userFirstName">First Name</label>
                            <input
                                type="text"
                                id="userFirstName"
                                name="first_name"
                                value={userBio?.first_name || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                                disabled={!isEditMode}
                            />
                        </div>
                        {/* User Last Name */}
                        <div className="w-[48%]">
                            <label className="block font-semibold mb-1" htmlFor="userLastName">Last Name</label>
                            <input
                                type="text"
                                id="userLastName"
                                name="last_name"
                                value={userBio?.last_name || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                                disabled={!isEditMode}
                            />
                        </div>
                    </div>
                    {/* User Email */}
                    <div className="mb-4 relative ">
                        <label className="block font-semibold mb-1" htmlFor="userEmail">Email</label>
                        <input
                            type="email"
                            id="userEmail"
                            name="email"
                            value={userBio?.email || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode}
                        />
                    </div>
                    {/* Mobile Number */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="mobileNumber">Mobile number</label>
                        <input
                            type="text"
                            id="mobileNumber"
                            name="phone_number"
                            value={userBio?.phone_number || ""}
                            placeholder="Enter your 10-digit phone number"
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                if (value.length <= 10) handleChange(e);
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            maxLength={10}
                            disabled
                        />
                    </div>
                    {isEditMode ?
                        <button type="button" className="w-full bg-[#d14d91] hover:bg-[#bc3575] text-white font-bold py-3 rounded-full mt-6 transition-colors duration-300" onClick={onSave}>
                            Save
                        </button> :
                        <div className="flex flex-row justify-between">
                            <button type="button" className="w-[40%] bg-[#d14d91] hover:bg-[#bc3575] text-white font-bold py-3 rounded-full mt-6 transition-colors duration-300" onClick={onEdit}>
                                Edit
                            </button>
                            <button type="button" className="w-[40%] bg-[#d14d91] hover:bg-[#bc3575] text-white font-bold py-3 rounded-full mt-6 transition-colors duration-300" onClick={onDelete}>
                                Delete
                            </button>
                        </div>
                    }
                </form>

                <FullScreenLoader loading={loading}/>
            </div>
            {/* Confirmation Popup */}
            <ConfirmationPopup
                isOpen={isConfirmationPopupOpen}
                message="Are you sure you want to delete the account? This action cannot be undone."
                onConfirm={handleConfirmationPopupConfirm}
                onCancel={handleConfirmationPopupCancel}
                confirmText="Yes, Delete"
                cancelText="No, Cancel"
                confirmButtonColor="bg-pink-500 hover:bg-pink-600"
            />
        </>
    )
}
