"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { requestNotificationPermission } from "@/lib/firebase/utils";

const RESEND_COOLDOWN = 30;

export function useLogin() {
  const router = useRouter();
  const [agentTab, setAgentTab] = useState(true);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const cooldownRef = useRef<number | null>(null);

  // Persistence of cooldown across refreshes
  useEffect(() => {
    const storedEndTime = localStorage.getItem("otp_cooldown_end");
    if (storedEndTime) {
      const remaining = Math.ceil((parseInt(storedEndTime) - Date.now()) / 1000);
      if (remaining > 0) {
        startCooldown(remaining);
      } else {
        localStorage.removeItem("otp_cooldown_end");
      }
    }

    return () => {
      if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = (seconds = RESEND_COOLDOWN) => {
    const endTime = Date.now() + seconds * 1000;
    localStorage.setItem("otp_cooldown_end", endTime.toString());
    
    setCooldown(seconds);
    if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    
    cooldownRef.current = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            window.clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          localStorage.removeItem("otp_cooldown_end");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setMessage("");
    setLoading(true);

    try {
      if (mobile.length !== 10 || !["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(mobile.charAt(0))) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }

      startCooldown();
      const endpoint = `/${agentTab ? "auth" : "user"}/login/sendOtp?mobile_number=${encodeURIComponent(mobile)}`;
      await api.post(endpoint, {});

      setMessage("✅ OTP sent successfully.");
      setStep("otp");
    } catch (err: any) {
      setMessage(`❌ ${err.message || "Failed to send OTP"}`);
      if (cooldownRef.current) {
        window.clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
      setCooldown(0);
      localStorage.removeItem("otp_cooldown_end");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setMessage("");
    setLoading(true);

    try {
      if (!/^\d{6}$/.test(otp)) throw new Error("Please enter a 6-digit OTP.");

      let device_token;
      if ('serviceWorker' in navigator && 'Notification' in window) {
        try {
          // Add a 3-second timeout so Firebase doesn't hang the login on localhost
          device_token = await Promise.race([
            requestNotificationPermission(),
            new Promise((resolve) => setTimeout(() => resolve(null), 3000))
          ]);
        } catch (e) {
          console.warn("Failed to get device token, proceeding without it", e);
        }
      }
      
      const endpoint = `/${agentTab ? "auth" : "user"}/login/verifyOtp?mobile_number=${encodeURIComponent(mobile)}&otp=${encodeURIComponent(otp)}&device_token=${device_token || ""}`;
      const data = await api.post(endpoint, {});

      // Standardize token storage
      const token = data?.access_token ?? data?.accessToken ?? data?.token ?? null;
      if (token) {
        const storageKey = agentTab ? "partnerAccessToken" : "accessToken";
        localStorage.setItem(storageKey, token);
        
        // Set cookie for middleware
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `${agentTab ? "partner" : "customer"}AuthToken=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
      }

      if (data?.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      if (data?.vet_id) localStorage.setItem("vet_id", String(data.vet_id));

      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => {
        const userType = data?.user_type ?? (agentTab ? "vet" : "user");
        router.push(String(userType).toLowerCase() === "vet" ? "/partner/dashboard" : "/customer/dashboard");
      }, 900);
    } catch (err: any) {
      setMessage(`❌ ${err.message || "Failed to verify OTP"}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    agentTab, setAgentTab,
    mobile, setMobile,
    otp, setOtp,
    step, setStep,
    message, setMessage,
    loading,
    cooldown,
    handleSendOtp,
    handleVerifyOtp
  };
}
