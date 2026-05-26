import { api } from "@/utils/api";
import React, { useEffect, useRef, useState } from "react";
import { FaHome, FaPlus } from "react-icons/fa";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import FullScreenLoader from "./fullScreenLoader";
import PopupModel from "./popupModel";
import ConfirmationPopup from "./ConfirmationPopup";
import {MapSelector} from "./MapSelector";
import {removeItemById} from "@/utils/common";
import {ErrorAlert} from "@/utils/commonTypes";
import {ErrorBanner} from "../common/ErrorBanner";

export interface Home_Visit_Address {
  address?: string;
  address_details?: string;
  contact_name?: string;
  contact_number?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number,
  id?: number
}

interface LocationSelectorProps {
  onSelectedAddressChange: (selectedAddress: Home_Visit_Address) => void;
  selectedAddressProp: Home_Visit_Address | object;
}

export default function LocationSelector({onSelectedAddressChange, selectedAddressProp} : LocationSelectorProps) {
  const [selectedAddress, setSelectedAddress] = useState<Home_Visit_Address>(selectedAddressProp);

  // Add new location on click
  const handleAdd = () => {
    setIsPopupOpen(true);
  };

  const [addresses, setAddresses] = useState<Home_Visit_Address[]>([]);

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

  const hasFetched = useRef(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAndSetAddresses = () => {
    setLoading(true);
      setErrors(curr => removeItemById(curr, "get-my-address-api"));
    const fetchUserAddresses = api.get("/user/address/myAddresses");
    Promise.all([fetchUserAddresses]).then(([res1]) => {
        setLoading(false);
        if (Array.isArray(res1)) {
          //setting the address
          const localAddresses: Home_Visit_Address[] = [];
          res1.forEach((item) => {
            localAddresses.push({
              address: item.address,
              address_details: item.address_details,
              contact_name: item.contact_name,
              contact_number: item.contact_number,
              location_name: item.location_name,
              latitude: item.latitude,
              longitude: item.longitude,
              id: item.id,
            });
          });
            setAddresses(localAddresses);
        }
    }).catch((error) => {
        setErrors(curr => [
            ...curr,
            {
                id: 'get-my-address-api',
                title: `API Error while fetching your saved addresses`,
                message: error.message || 'Unknown error'
            }
        ]);
        setLoading(false);
    });
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAndSetAddresses();
    }
  }, []);

  useEffect(() => {
      onSelectedAddressChange(selectedAddress);
  }, [selectedAddress]);

  const handleAddressSelection = (address: Home_Visit_Address) => {
    return () => {
        if (selectedAddress.id === address.id) {
            //deselecting
            setSelectedAddress({});
        } else {
            setSelectedAddress(address);
        }

    };

  };

  const [isPopupOpen,setIsPopupOpen] = useState<boolean>(false);
  const handlePopupCancel = () => {
    //resetting the address form details
    setAddressFormDetails({});
    setIsPopupOpen(false);
  };
  const handlePrimaryAction = async () => {
    if (addressFormDetails?.contact_name && addressFormDetails?.contact_number &&
        addressFormDetails?.address && addressFormDetails?.location_name &&
        addressFormDetails?.latitude && addressFormDetails?.longitude
    ) {
      try{
          //closing the popup
          setIsPopupOpen(false);
        setLoading(true);
        if (addressFormDetails?.id) {
            try {
                setErrors(curr => removeItemById(curr, "updating-my-addresses-api"));
                //updating
                await api.put(`/user/address/${addressFormDetails.id}`, addressFormDetails);
                //fetching and assiging the addresses again
                fetchAndSetAddresses();
            } catch(error: any) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'updating-my-addresses-api',
                        title: `API Error while updating my address changes`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            }
        } else {
            try {
                setErrors(curr => removeItemById(curr, "creating-my-addresses-api"));
                //creating
                await api.post("/user/address/add", addressFormDetails);
                //fetching and assiging the addresses again
                fetchAndSetAddresses();
            } catch(error: any) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'creating-my-addresses-api',
                        title: `API Error while creating a new address`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            }
        }
        //resetting the address form details
          setAddressFormDetails({});
        setLoading(false);
      } catch(error) {
        setLoading(false);
      }
    } else {
      alert("Please provide all the required details");
    }
  };

  const [addressFormDetails, setAddressFormDetails] = useState<Home_Visit_Address>();

  const handleAddressDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddressFormDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

    const handleEditLocation = (address: Home_Visit_Address) => {
        return (e: React.MouseEvent) => {
            e.stopPropagation();
            setAddressFormDetails(address);
            setIsPopupOpen(true);
        };
    };
    const [toBeDeletedAddressId, setToBeDeletedAddressId] = useState<number | null>();
    const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState<boolean>(false);
    const handleDeleteLocation = (address: Home_Visit_Address) => {
        return (e: React.MouseEvent) => {
            e.stopPropagation();
            setToBeDeletedAddressId(address.id);
            //open the confirmation popup
            setIsConfirmationPopupOpen(true);
        };
    };

    const handleConfirmationPopupConfirm = async () => {
        try {
            //open the loader
            setLoading(true);

            setErrors(curr => removeItemById(curr, "deleting-my-address-api"));
            //delete api call
            await api.delete(`/user/address/${toBeDeletedAddressId}`);

            //reload the locations
            fetchAndSetAddresses();
        } catch(error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'deleting-my-address-api',
                    title: `API Error while deleting the selected address`,
                    message: error.message || 'Unknown error'
                }
            ]);
        } finally {
            //close the loader
            setLoading(false);

            //closer the confirmation popup
            setIsConfirmationPopupOpen(false);

            //setting the setToBeDeletedAddressId to empty
            setToBeDeletedAddressId(null);
        }
    }

    const handleConfirmationPopupCancel = () => {
        //closer the confirmation popup
        setIsConfirmationPopupOpen(false);

        //setting the setToBeDeletedAddressId to empty
        setToBeDeletedAddressId(null);
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
          <div className="flex items-center grid grid-cols-3 gap-4">
              {addresses.map((loc) => {
                  const isSelected = selectedAddress?.id === loc.id;
                  return (
                      <div
                          key={loc.id}
                          className={`rounded-2xl p-4 w-34 h-full relative shadow-md cursor-pointer transition grid grid-cols-1 content-between
            ${isSelected ? "bg-pink-500 text-white" : "bg-white text-black"}`}
                          onClick={handleAddressSelection(loc)}
                      >
                          {/* Top Row */}
                          <div className="flex justify-between items-start">
              <span
                  className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-black"
                  }`}
              >
                {loc.contact_name}{" "}
                  {/* {loc.subtitle && (
                  <span
                    className={`${
                      isSelected ? "text-pink-100" : "text-gray-500"
                    } font-normal`}
                  >
                    {loc.subtitle}
                  </span>
                )} */}
              </span>
                              {isSelected ? (
                                  <FaCheckSquare
                                      className={`${
                                          isSelected ? "text-white" : "text-gray-500"
                                      } text-lg`}
                                  />
                              ) : (
                                  <FaRegSquare className="text-gray-500 text-lg" />
                              )}
                          </div>

                          {/* Bottom Row */}
                          {loc.location_name && (
                              <p
                                  className={`mt-2 text-xs font-semibold ${
                                      isSelected ? "text-white" : "text-black"
                                  }`}
                              >
                                  {loc.location_name}
                                  {/* {loc.details && (
                  <span
                    className={`ml-1 ${
                      isSelected ? "text-pink-100" : "text-gray-500"
                    } font-normal`}
                  >
                    {loc.details}
                  </span>
                )} */}
                              </p>
                          )}

                          <div
                              key={`${loc.id}-buttons`}
                              className="flex flex-row justify-between items-center pt-3">
                              <button className="w-1/2 text-white bg-blue-500 rounded-lg py-1 me-2 cursor-pointer text-sm font-semibold transition hover:bg-blue-600"
                                      onClick={handleEditLocation(loc)}>
                                  Edit
                              </button>
                              <button className="w-1/2 text-white bg-blue-500 rounded-lg py-1 cursor-pointer text-sm font-semibold transition hover:bg-blue-600"
                                      onClick={handleDeleteLocation(loc)}>
                                  Delete
                              </button>
                          </div>
                      </div>
                  );
              })}

              {/* Add Button */}
              <button
                  className="bg-pink-500 rounded-full p-3 w-10 shadow-md hover:bg-pink-600 transition cursor-pointer"
                  onClick={handleAdd}
              >
                  <FaPlus className="text-white text-lg" />
              </button>
              <FullScreenLoader loading={loading}/>
              <PopupModel open={isPopupOpen} onCancel={handlePopupCancel} onPrimary={handlePrimaryAction} primaryLabel={addressFormDetails?.id ? "Save": "Add"}>
                  <form className="w-full max-w-lg bg-white rounded-xl px-8 py-10 shadow-lg">
                      <h2 className="text-base font-bold mb-8 text-center">Enter Address Details</h2>
                      <div className="mb-3 text-sm">
                          <label htmlFor="contact_name" className="block font-semibold mb-1">Contact Name *</label>
                          <input
                              type="text"
                              id="contact_name"
                              name="contact_name"
                              value={addressFormDetails?.contact_name || ""}
                              onChange={handleAddressDetailsChange}
                              required
                              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                          />
                      </div>
                      <div className="mb-3 text-sm">
                          <label htmlFor="contact_number" className="block font-semibold mb-1">Contact Number *</label>
                          <input
                              type="tel"
                              id="contact_number"
                              name="contact_number"
                              value={addressFormDetails?.contact_number || ""}
                              onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  e.target.value = value;
                                  if (value.length <= 10) handleAddressDetailsChange(e);
                              }}
                              required
                              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                          />
                      </div>
                      <div className="mb-3 text-sm">
                          <label htmlFor="address" className="block font-semibold mb-1">Address *</label>
                          <textarea
                              id="address"
                              name="address"
                              value={addressFormDetails?.address || ""}
                              onChange={handleAddressDetailsChange}
                              required
                              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                              rows={2}
                          />
                      </div>
                      {/* <div className="mb-5">
            <label htmlFor="address_details" className="block font-semibold mb-1">Address Details</label>
            <input
              type="text"
              id="address_details"
              name="address_details"
              value={addressFormDetails?.address_details}
              onChange={handleAddressDetailsChange}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
              placeholder="Flat, Landmark, etc."
            />
          </div> */}
                      <div className="mb-3 text-sm">
                          <label htmlFor="location_name" className="block font-semibold mb-1">Location Name *</label>
                          <input
                              type="text"
                              id="location_name"
                              name="location_name"
                              value={addressFormDetails?.location_name || ""}
                              onChange={handleAddressDetailsChange}
                              required
                              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                          />
                      </div>
                      <div className="mb-3 text-sm">
                          <MapSelector lat={addressFormDetails?.latitude} lng={addressFormDetails?.longitude} onChange={(lat, lng) => setAddressFormDetails(prev => ({
                              ...prev,
                              latitude: lat,
                              longitude: lng
                          }))} />
                      </div>
                  </form>
              </PopupModel>
              {/* Confirmation Popup */}
              <ConfirmationPopup
                  isOpen={isConfirmationPopupOpen}
                  message="Are you sure you want to delete this item? This action cannot be undone."
                  onConfirm={handleConfirmationPopupConfirm}
                  onCancel={handleConfirmationPopupCancel}
                  confirmText="Yes, Delete"
                  cancelText="No, Cancel"
                  confirmButtonColor="bg-pink-500 hover:bg-pink-600"
              />
          </div>
      </>

  );
}
