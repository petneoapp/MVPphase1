"use client";

import { useState, useEffect, useRef } from "react";
import { api, clearAuth } from "@/utils/api";
import { removeItemById } from "@/utils/common";
import { ErrorAlert } from "@/utils/commonTypes";
import { User, Pet } from "@/app/customer/dashboard/page";

export function useCustomerDashboardData() {
  const [user, setUser] = useState<User | null>(null);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [serviceBackendData, setServiceBackendData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<ErrorAlert[]>([]);
  
  const hasFetched = useRef(false);

  const fetchDashboardData = () => {
    setLoading(true);
    const userHomeFetch = api.get("/user/home");
    const servicesDataFetch = api.get("/services");

    return Promise.all([userHomeFetch, servicesDataFetch])
      .then(([res1, res2]) => {
        if (Array.isArray(res2)) {
          setServiceBackendData(res2);
        }
        
        setUser({
          id: res1?.user?.id,
          name: res1?.user?.name,
          profile_url: res1?.user?.profile_url,
          location: res1?.user?.location || "Hyderabad, TN",
        });

        const pets: Pet[] = res1?.pets || [];
        setUserPets(pets);
      })
      .catch((error) => {
        setErrors((curr) => [
          ...curr,
          {
            id: "home-get-api",
            title: "API Error",
            message: error.message || "Failed to load dashboard data",
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDashboardData();
    }
  }, []);

  const dismissError = (id: string) => {
    setErrors((curr) => curr.filter((e) => e.id !== id));
  };

  return {
    user,
    userPets,
    serviceBackendData,
    loading,
    errors,
    dismissError,
    refetch: fetchDashboardData,
  };
}
