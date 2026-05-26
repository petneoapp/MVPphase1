"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { requestNotificationPermission } from "@/lib/firebase/utils";
import { api } from "@/utils/api";


type LoginResponse = {
  user_type?: string;
  access_token?: string;
  accessToken?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  vet_id?: number | string;
  message?: string;
  success?: boolean;
  [k: string]: any;
};

import { useLogin } from "@/hooks/useLogin";

export default function LoginPage() {
  const router = useRouter();
  const {
    agentTab, setAgentTab,
    mobile, setMobile,
    otp, setOtp,
    step, setStep,
    message, setMessage,
    loading,
    cooldown,
    handleSendOtp,
    handleVerifyOtp
  } = useLogin();

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setMobile(value);
    if (message) setMessage("");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setOtp(value);
    if (message) setMessage("");
  };

  const isValidMobile = mobile.length === 10 && ["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(mobile.charAt(0));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl flex overflow-hidden">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 px-8 md:px-12 lg:px-16 py-12 text-black">
          {/* Logo */}
          <div className="mb-8">
            <div className="relative w-[140px] h-[50px]">
              <Image src="/images/logo.svg" alt="PetNeo Logo" fill className="object-contain" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-pink-50 rounded-full mb-8">
            <button
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${agentTab ? "bg-pink-500 text-white shadow-md" : "text-gray-500 hover:text-pink-600"}`}
              onClick={() => setAgentTab(true)}
              type="button"
            >
              Partner / Vet
            </button>
            <button
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${!agentTab ? "bg-pink-500 text-white shadow-md" : "text-gray-500 hover:text-pink-600"}`}
              onClick={() => setAgentTab(false)}
              type="button"
            >
              Customer / User
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="font-bold text-2xl text-gray-800">Log In</h2>
            <button
              onClick={() => router.push(`/${agentTab ? "partner" : "customer"}/signup`)}
              className="text-sm text-pink-600 font-semibold hover:underline"
              type="button"
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          {step === "mobile" ? (
            <form className="space-y-6" onSubmit={handleSendOtp}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">Mobile Number</label>
                <input
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile"
                  value={mobile}
                  onChange={handleMobileChange}
                  maxLength={10}
                  className="w-full border-gray-200 border-2 rounded-xl px-4 py-3 text-base focus:border-pink-400 focus:ring-0 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl text-white font-bold transition-all shadow-lg ${isValidMobile ? "bg-pink-500 hover:bg-pink-600 hover:scale-[1.02] active:scale-[0.98]" : "bg-gray-300 cursor-not-allowed"}`}
                disabled={!isValidMobile || loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">OTP Code</label>
                <input
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  className="w-full border-gray-200 border-2 rounded-xl px-4 py-3 text-base focus:border-pink-400 focus:ring-0 transition-colors tracking-widest"
                  required
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl text-white font-bold transition-all shadow-lg ${otp.length === 6 ? "bg-pink-500 hover:bg-pink-600 hover:scale-[1.02] active:scale-[0.98]" : "bg-gray-300 cursor-not-allowed"}`}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || cooldown > 0}
                  className="text-sm font-semibold text-pink-600 hover:text-pink-800 disabled:text-gray-400 transition-colors"
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Message */}
          {message && (
            <div role="alert" className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message}
            </div>
          )}

          {/* Footer */}
          <p className="mt-16 text-xs text-gray-400">© 2025 PetNeo Platform. Secure Login.</p>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-pink-500 to-blue-500 items-center justify-center p-12 relative">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg p-10 rounded-3xl text-white text-center relative max-w-md w-full border border-white border-opacity-20">
            <h2 className="text-3xl font-bold mb-8 leading-tight">Connecting <br /> Healthcare & <br /> Pet Happiness</h2>
            <div className="relative w-64 h-64 mx-auto mb-8">
                <Image src="/images/dog.svg" alt="Dog" fill className="object-contain drop-shadow-2xl" />
            </div>
            <div className="flex justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span className="w-2 h-2 rounded-full bg-white opacity-30" />
              <span className="w-2 h-2 rounded-full bg-white opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
