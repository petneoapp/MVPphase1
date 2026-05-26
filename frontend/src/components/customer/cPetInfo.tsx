"use client";

import { PageType } from "@/app/customer/dashboard/constants";
import { api } from "@/utils/api";
import { form } from "framer-motion/client";
import React, { useEffect, useRef, useState } from "react";
import FullScreenLoader from "./fullScreenLoader";
import { FaCamera, FaPen } from "react-icons/fa";
import { spec } from "node:test/reporters";
import ConfirmationPopup from "./ConfirmationPopup";
import {ErrorAlert} from "@/utils/commonTypes";
import {ErrorBanner} from "../common/ErrorBanner";
import {removeItemById} from "@/utils/common";

interface C_PetInfoProps {
    petId: number;
    goToMyPets: () => void;
}
interface PetCompleteDetails {
    petId: number;
    name?: string;
    species?: string;
    breeding?: string;
    gender?: string;
    dob?: string;
    weight?: number;
    licence?: string;
    profile_picture?: string;
    profile_picture_file?: File | null; //Extra param for creating the pet
}

interface Breed {
    id: number;
    name: string;
}

interface Species {
    type: string;
    breeds: Breed[];
}

function calculateAge(dob: string): string {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    // Adjust if the current month/day is before the birth month/day
    if (months < 0) {
        years--;
        months += 12;
    } else if (months === 0 && today.getDate() < birthDate.getDate()) {
        years--;
        months = 11;
    } else if (today.getDate() < birthDate.getDate()) {
        months--;
        if (months < 0) {
            years--;
            months = 11;
        }
    }
    let ageString = "NaN";
    if (years) {
        if (months) {
            ageString = years + " years and " + months + " months";
        } else {
            ageString = years + " years";
        }
    } else {
        if (months) {
            ageString = months + " months";
        }
    }

    return ageString;
}


export default function C_PetInfo({ petId, goToMyPets }: C_PetInfoProps) {
    const GENDERS = ["Male", "Female"];

    const [speciesList, setSpeciesList] = useState<Species[]>([]);
    const [petTypes, setPetTypes] = useState<string[]>([]);
    const [breeds, setBreeds] = useState<Breed[]>([]);
    const [petCompleteDetails, setPetCompleteDetails] = useState<PetCompleteDetails>({petId: petId});
    const [isEditMode, setIsEditMode] = useState<boolean>(petCompleteDetails?.petId < 0);

    const [errors, setErrors] = useState<ErrorAlert[]>([]);

    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (!hasFetched.current) {
             hasFetched.current = true;
            setErrors(removeItemById(errors, "pet-info-api-error"));
            //fetching the species
            const speciesResponse = api.get("/user/species");
            let petDetailsResponse;
            if (petId >= 0) {
                //fetching the pet info
                petDetailsResponse = api.get(`/pets/user/${petId}`);
            }

            Promise.all([speciesResponse, petDetailsResponse]).then(([res1, res2]) => {
                if (res2?.pet) {
                    //setting the pet details object
                    setPetCompleteDetails({
                        petId: res2.pet.id,
                        name: res2.pet.name,
                        species: res2.pet.species,
                        breeding: res2.pet.breeding,
                        gender: res2.pet.gender,
                        dob: res2.pet.age,
                        weight: res2.pet.weight,
                        licence: res2.pet.licence,
                        profile_picture: res2.pet.profile_picture
                    });
                }

                const speciesListlocal: Species[] = [];
                const petTypesLocal: string[] = [];
                if (Array.isArray(res1)) {
                    res1.forEach((item) => {
                        speciesListlocal.push({type: item.Type, breeds: item.breeds});
                        petTypesLocal.push(item.Type);
                    });
                    setSpeciesList(speciesListlocal);
                    setPetTypes(petTypesLocal);

                    if (res2?.pet) {
                        setBreeds(speciesListlocal.find((item) => item.type === res2.pet.species)?.breeds || []);
                    }
                }

            }).catch((error) => {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'pet-info-api-error',
                        title: `API Error`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            }).finally(() => {
                hasFetched.current = false;
                setLoading(false);
            });
        }
        
    }, []);

    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setPetCompleteDetails({
             ...petCompleteDetails,
            [e.target.name]: e.target.value
           });
    };

    const today = new Date();

    const profileImageInputRef = useRef<HTMLInputElement | null>(null);
    const handleEditPhotoClick = () => {
        profileImageInputRef.current?.click();
    };
    const handleProfileImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview image
        const previewUrl = URL.createObjectURL(file);
        setPetCompleteDetails({...petCompleteDetails,  profile_picture: previewUrl, profile_picture_file: file});
    };

    function handleSpeciesChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
        //setting breeds on every species change.
        setBreeds(speciesList.find((item) => item.type === event.target.value)?.breeds || []);
        setPetCompleteDetails({
             ...petCompleteDetails,
            [event.target.name]: event.target.value,
            breeding: "" // setting it to default value
           });
    };

    const [isRecoverPopupOpen, setIsRecoverPopupOpen] = useState<boolean>(false);
    const [recoverMessage, setRecoverMessage] = useState<string>("");
    const [recoveredPetId, setRecoveredPetId] = useState<number>();
    const handleRecoverPopupCancel = () => {
        //closer the recover popup
        setIsRecoverPopupOpen(false);
        setRecoveredPetId(undefined);
    }

    const handleRecoverPopupConfirm = async () => {
        try {
            setLoading(true);
            setErrors(removeItemById(errors, "pet-recover-api"));
            const recoverResponse = await api.post(`/pets/recoverPet/${recoveredPetId}`, {});
            setLoading(false);

            if (recoverResponse?.success) {
                //go to myPets page
                goToMyPets();
            } else {
                throw new Error (recoverResponse?.detail || "Unable to recover the pet");
            }

        } catch (error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'pet-recover-api',
                    title: `API Error while recovering your pet`,
                    message: error.message || 'Unknown error'
                }
            ]);
        } finally {
            //closer the confirmation popup
            setIsRecoverPopupOpen(false);
            setLoading(false);
        }
    };

    const onSave = async (): Promise<void> => {
        if (saving) return;
        //constructing the payload
        const formData = new FormData();
        const breed_Id = breeds.find((item) => item.name === petCompleteDetails.breeding)?.id;
        if (petCompleteDetails.name &&
            petCompleteDetails.species &&
            breed_Id &&
            petCompleteDetails.gender
        ) {
            formData.append("name", petCompleteDetails.name);
            formData.append("species", petCompleteDetails.species);
            formData.append("breed_id", breed_Id.toString());
            formData.append("gender", petCompleteDetails.gender);
        } else {
            alert("Provide the necessary details");
            return;
        }

        if (petCompleteDetails.dob) {
            formData.append("date_of_birth", petCompleteDetails.dob);
        }
        if (petCompleteDetails.licence) {
            formData.append("licence", petCompleteDetails.licence);
        }
        if (petCompleteDetails.weight) {
            formData.append("weight", petCompleteDetails.weight.toString());
        }
        if (petCompleteDetails.profile_picture_file) {
            formData.append("profile_picture", petCompleteDetails.profile_picture_file);
        }
        try {
            setSaving(true);
            setLoading(true);
            setErrors(removeItemById(errors, "generic-pet-api"));
            let petIdLocal;
            let isActionSuccess = false;

            if (petCompleteDetails.petId < 0) {
                //creating the pet
                let createPetResponse;
                try {
                    setErrors(removeItemById(errors, "add-pet-api"));
                    createPetResponse = await api.formDatapost("/pets/addPet", formData);
                } catch (e: any) {
                    setErrors(curr => [
                        ...curr,
                        {
                            id: 'add-pet-api',
                            title: `API Error while adding pet`,
                            message: e.message || 'Unknown error'
                        }
                    ]);
                }
                if (createPetResponse?.pet_id) {
                    isActionSuccess = true;
                    petIdLocal = createPetResponse?.pet_id;
                    alert("Pet created successfully!");
                    goToMyPets();
                    return; // exit early on redirect
                } else if (createPetResponse?.deleted) {
                    setRecoverMessage(createPetResponse?.message || "");
                    setRecoveredPetId(createPetResponse?.pet_id);
                    setIsRecoverPopupOpen(true);
                    return;
                }
            } else {
                //editing an existing pet
                let editPetResponse;
                try {
                    setErrors(removeItemById(errors, "update-pet-api"));
                    editPetResponse = await api.formDataPut(`/pets/updatePet/${petCompleteDetails.petId}`, formData);
                } catch (e: any) {
                    setErrors(curr => [
                        ...curr,
                        {
                            id: 'update-pet-api',
                            title: `API Error while updating pet`,
                            message: e.message || 'Unknown error'
                        }
                    ]);
                }
                if (editPetResponse?.pet_id) {
                    isActionSuccess = true;
                    petIdLocal = editPetResponse?.pet_id;
                }
            }

            if (!!petIdLocal && isActionSuccess) {
                //fetch the latest data and assign the required fields
                const petDetailsResponse = await api.get(`/pets/user/${petIdLocal}`);
                if (petDetailsResponse?.pet) {
                    //assigning the required fields
                    setPetCompleteDetails({
                        ...petCompleteDetails,
                        profile_picture: petDetailsResponse.pet?.profile_picture,
                        petId: petDetailsResponse.pet?.id
                    });
                }
                //setting the editmode false
                setIsEditMode(false);
            }
        } catch (e: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'generic-pet-api',
                    title: `API Error not able to get the information requested`,
                    message: e.message || 'Unknown error'
                }
            ]);
        } finally {
            setSaving(false);
            setLoading(false);
        }
    };

    const onEdit = (): void => {
        setIsEditMode(true);
    };

    const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState<boolean>(false);
    const onDelete = () => {
        //open the confirmation popup
        setIsConfirmationPopupOpen(true);
    };
    const handleConfirmationPopupCancel = () => {
        //closer the confirmation popup
        setIsConfirmationPopupOpen(false);
    }

    const handleConfirmationPopupConfirm = async () => {
        try {
            setLoading(true);
            setErrors(removeItemById(errors, "delete-pet-api"));
            const deleteResponse = await api.delete(`/pets/deletePet/${petCompleteDetails.petId}`);
            setLoading(false);

            if (deleteResponse?.success) {
                //go to myPets page
                goToMyPets();
            }

        } catch(error: any) {
            if (errors?.findIndex((item) => item.id === 'delete-pet-api') < 0) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'delete-pet-api',
                        title: `API Error while deleting your pet information`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            }

        } finally {
            //closer the confirmation popup
            setIsConfirmationPopupOpen(false);
            setLoading(false);
        }
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
            <div className="bg-[#eaeaff] min-h-screen flex flex-col items-center pt-8">
                <form className="w-full max-w-sm bg-transparent rounded-lg p-4">
                    {/* Pet Name */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="petName">Pet Name</label>
                        <input
                            type="text"
                            id="petName"
                            name="name"
                            value={petCompleteDetails?.name || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode}
                        />
                    </div>
                    {/* Type */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="type">Type</label>
                        <select
                            id="type"
                            name="species"
                            value={petCompleteDetails?.species || ""}
                            onChange={handleSpeciesChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode || !(petTypes?.length > 0)}
                        >
                            <option value="" disabled hidden>Select</option>
                            {petTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    {/* Breed */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="breed">Breed</label>
                        <select
                            id="breed"
                            name="breeding"
                            value={petCompleteDetails?.breeding || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode || !(petCompleteDetails?.species) || !(breeds?.length > 0)}
                        >
                            <option value="" disabled hidden>Select Breed</option>
                            {breeds.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                        </select>
                    </div>
                    {/* Date Of Birth ? AGE */}
                    {!isEditMode ?
                        <div className="mb-4 relative">
                            <label className="block font-semibold mb-1" htmlFor="dob">Age</label>
                            <input
                                type="text"
                                id="age"
                                name="age"
                                value={calculateAge(petCompleteDetails?.dob || "") || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                                disabled={!isEditMode}
                            />
                        </div> :
                        <div className="mb-4 relative">
                            <label className="block font-semibold mb-1" htmlFor="dob">Date of Birth</label>
                            <input
                                type="date"
                                id="dob"
                                name="dob"
                                value={petCompleteDetails?.dob || ""}
                                onChange={handleChange}
                                max={today.toISOString().split('T')[0]}
                                className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            />
                        </div>}
                    {/* Gender */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="gender">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            value={petCompleteDetails?.gender || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode}
                        >
                            <option value="" disabled hidden>Select</option>
                            {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                        </select>
                    </div>
                    {/* Weight */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="weight">Pet Weight</label>
                        <input
                            type="text"
                            id="weight"
                            name="weight"
                            value={petCompleteDetails?.weight || ""}
                            placeholder="Enter Pet Weight"
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode}
                        />
                    </div>
                    {/*Licence*/}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="licence">Licence</label>
                        <input
                            type="text"
                            id="licence"
                            name="licence"
                            value={petCompleteDetails?.licence || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-white focus:outline-none"
                            disabled={!isEditMode}
                        />
                    </div>
                    {/* Pet Photo */}
                    <div className="mb-4 relative">
                        <label className="block font-semibold mb-1" htmlFor="photo">Pet Photo</label>
                        <div id="photo">
                            {petCompleteDetails?.profile_picture ?
                                <img
                                    src={petCompleteDetails.profile_picture}
                                    alt="pet"
                                    className="w-full h-40 object-cover rounded-md bg-white"
                                /> :
                                <FaCamera className="text-gray-400 text-3xl w-full h-40 object-cover rounded-md bg-white" />}

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
                    {isEditMode ?
                        <button 
                            type="button" 
                            className="w-full bg-[#d14d91] hover:bg-[#bc3575] text-white font-bold py-3 rounded-full mt-6 transition-colors duration-300 disabled:opacity-50" 
                            onClick={onSave}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
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
                {/* Confirmation Popup */}
                <ConfirmationPopup
                    isOpen={isConfirmationPopupOpen}
                    message="Are you sure you want to delete the pet?"
                    onConfirm={handleConfirmationPopupConfirm}
                    onCancel={handleConfirmationPopupCancel}
                    confirmText="Yes, Delete"
                    cancelText="No, Cancel"
                    confirmButtonColor="bg-pink-500 hover:bg-pink-600"
                />

                {/* Recover Popup */}
                <ConfirmationPopup
                    isOpen={isRecoverPopupOpen}
                    message={recoverMessage}
                    onConfirm={handleRecoverPopupConfirm}
                    onCancel={handleRecoverPopupCancel}
                    confirmText="Yes"
                    cancelText="No"
                    confirmButtonColor="bg-pink-500 hover:bg-pink-600"
                />
                <FullScreenLoader loading={loading}/>
            </div>
        </>

    );
}
