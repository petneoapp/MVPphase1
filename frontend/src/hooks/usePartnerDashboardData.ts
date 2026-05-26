"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";
import { removeItemById } from "@/utils/common";
import { ErrorAlert } from "@/utils/commonTypes";
import { PartnerDetails } from "@/types/partner";


export function usePartnerDashboardData() {
  const [partnerDetails, setPartnerDetails] = useState<PartnerDetails>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<ErrorAlert[]>([]);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      setLoading(true);
      
      api.get("/appointments/vetTodaySummary", undefined, "partner")
        .then((res) => {
          setPartnerDetails(res);
        })
        .catch((error) => {
          setErrors((curr) => [
            ...curr,
            {
              id: "get-appointments-summary-api",
              title: "API Error",
              message: error.message || "Failed to load partner summary",
            },
          ]);
        })
        .finally(() => {
          setLoading(false);
          hasFetched.current = false;
        });
    }
  }, []);

  const dismissError = (id: string) => {
    setErrors((curr) => curr.filter((e) => e.id !== id));
  };

  return {
    partnerDetails,
    loading,
    errors,
    dismissError,
  };
}
