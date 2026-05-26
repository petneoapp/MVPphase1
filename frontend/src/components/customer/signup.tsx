"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Poppins } from "next/font/google";
import { FaCamera, FaPen } from "react-icons/fa";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Service = { id: number; name: string };

import { api } from "@/utils/api";

export default function SignupPageUser() {

  const [step, setStep] = useState(1);
  const router = useRouter();

  // Step 1: Phone Verification
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [verified, setVerified] = useState(false);

  // Step 1/2 loading & message
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Step 2: Personal Info
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    profile_picture: null as File | null,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP states
  const [emailOtp, setEmailOtp] = useState("");
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Utility: read cookie
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // collect extras from localStorage & cookies (only if present)
  const collectExtraClientData = () => {
    const extras: Record<string, string> = {};
    if (typeof window === "undefined") return extras;

    const candidateKeys = [
      "__NEXT_DISMISS_PRERENDER_INDICATOR",
      "__nextjs-dev-tools-position",
      "_grecaptcha",
      "ally-supports-cache",
      "epr_suggested",
      "knownTransactions",
      "utm_params",
    ];

    try {
      candidateKeys.forEach((k) => {
        try {
          const v = localStorage.getItem(k);
          if (v !== null && v !== undefined && v !== "null") extras[k] = v;
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }

    const grecaptchaCookie = getCookie("_grecaptcha");
    if (grecaptchaCookie) extras["_grecaptcha"] = grecaptchaCookie;

    return extras;
  };

  // --------------------------
  // Phone OTP: send & verify
  // --------------------------
  const handleSendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!phone || phone.length !== 10) throw new Error("Please enter a valid 10-digit phone number");

      await api.post("/user/sendMobileOtp", { mobile_number: phone });
      
      setShowOtp(true);
      setMessage("✅ OTP sent to phone successfully!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!otp) throw new Error("Please enter the OTP");

      await api.post("/user/verifyMobileOtp", { mobile_number: phone, otp });

      setVerified(true);
      setMessage("✅ Phone number verified!");
      setStep(2);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Email OTP: send & verify
  // --------------------------
  const handleSendEmailOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!personal.email) throw new Error("Please enter an email to send OTP");

      await api.post("/user/sendEmailOtp", { email: personal.email });

      setShowEmailOtp(true);
      setMessage("✅ Email OTP sent — check your inbox (or spam).");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!emailOtp) throw new Error("Please enter the email OTP");

      await api.post("/user/verifyEmailOtp", { email: personal.email, otp: emailOtp });

      setEmailVerified(true);
      setMessage("✅ Email verified!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Final submit (register)
  // --------------------------
  const handleFinalSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      // basic validation
      if (!personal.firstName || !personal.lastName || !personal.email || !personal.password) {
        throw new Error("Please fill all required personal information fields");
      }

      const formData = new FormData();
      formData.append("mobile_number", phone);
      formData.append("email", personal.email);
      formData.append("password", personal.password);
      formData.append("first_name", personal.firstName);
      formData.append("last_name", personal.lastName);
      if (personal.profile_picture) {
        formData.append("profile_picture", personal.profile_picture);
      }
      
      // extras
      const extras = collectExtraClientData();
      if (Object.keys(extras).length > 0) {
        Object.entries(extras).forEach(([k, v]) => {
          try {
            formData.append(k, String(v));
          } catch {
            // ignore
          }
        });
        console.log("📎 Appended client extras to formData:", extras);
      }

      // Log final submit payload
      const payloadEntries = Object.fromEntries(formData.entries());
      console.log("[DEBUG Submit] Final Submit Payload:", payloadEntries);

      const data = await api.formDatapost("/user/registerUser", formData);

      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
      }

      setMessage("✅ Registration successful!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert("Registration Successful");
      router.push("/login");
    } catch (err: any) {
      console.error("[DEBUG Submit] Error on submit:", err);
      setMessage(`❌ ${err.message}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert(err.message || "Please fill all required fields");
    } finally {
      setLoading(false);
    }
  };


  // Reusable field label
  const FieldLabel = ({ children, required }: { children: any; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const [profileImage, setProfileImage] = useState<string>();
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPersonal({ ...personal, profile_picture: file })

    // Preview image
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
  };

  const handleEditPhotoClick = () => {
    profileImageInputRef.current?.click();
  };
  return (
    <div className={`flex flex-col md:flex-row min-h-screen ${poppins.className}`}>
      {/* Left Section */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-16 bg-white text-black">
        <div className="mb-6">
          <Image src="/images/logo.svg" alt="PetNeo Logo" width={140} height={50} />
        </div>

        <div className="w-full max-w-md">
          {/* stepper */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {[1, 2].map((s) => (
                <div key={s} className={`h-2 w-8 rounded-full ${step >= s ? "bg-pink-500" : "bg-gray-300"}`} />
              ))}
            </div>
            <div className="text-sm text-gray-500">Step {step} of 3</div>
          </div>

          {/* Message display */}
          {message && (
            <div
              className={`mb-4 p-3 rounded text-sm ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {message}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <section>
              <h2 className="text-xl font-semibold mb-1">Sign Up</h2>
              <p className="text-sm text-gray-600 mb-4">Phone verification — enter your phone number</p>

              <div className="mb-4">
                <FieldLabel required>Phone Number</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter your 10-digit phone number"
                    className="flex-1 border rounded-md px-3 py-2 placeholder-gray-400"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) setPhone(value);
                    }}
                    maxLength={10}
                    disabled={verified}
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || verified || loading}
                    className="px-3 py-2 rounded-md bg-blue-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <FieldLabel required>OTP</FieldLabel>
                <div className="relative">
                  <input
                    type={showOtp ? "text" : "password"}
                    placeholder="Enter OTP"
                    className="w-full border rounded-md px-3 py-2 placeholder-gray-400"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setOtp(value);
                    }}
                    disabled={verified}
                  />
                  <button type="button" onClick={() => setShowOtp(!showOtp)} className="absolute right-2 top-2 text-gray-500">
                    {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {verified && (
                <div className="flex items-center text-green-600 mb-4">
                  <CheckCircle2 className="mr-2" /> Verified
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={!otp || verified || loading}
                className="w-full py-2 rounded-md bg-blue-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Next"}
              </button>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section>
                <div className="flex flex-row items-center justify-center">
                    <div className="flex-1 flex-col">
                        <h2 className="text-xl font-semibold mb-1">Personal Details</h2>
                        <p className="text-sm text-gray-600 mb-4">Enter your personal information</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        {/* Circle container */}
                        <div className="relative w-25 h-25 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden">
                            {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                            <FaCamera className="text-gray-400 text-3xl" />
                            )}

                            {/* Edit (pencil) icon */}
                            <button
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
                        </div>
                    </div>
                </div>
              

              <div className="mb-4">
                <FieldLabel required>First Name</FieldLabel>
                <input
                type="text"
                placeholder="First name"
                className="w-full border rounded-md px-3 py-2"
                value={personal.firstName}
                onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <FieldLabel required>Last Name</FieldLabel>
                <input
                type="text"
                placeholder="Last name"
                className="w-full border rounded-md px-3 py-2"
                value={personal.lastName}
                onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <FieldLabel required>Email</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 border rounded-md px-3 py-2"
                    value={personal.email}
                    onChange={(e) => {
                      setPersonal({ ...personal, email: e.target.value });
                      setEmailVerified(false);
                      setEmailOtp("");
                    }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <FieldLabel required>Password</FieldLabel>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="w-full border rounded-md px-3 py-2"
                    value={personal.password}
                    onChange={(e) => setPersonal({ ...personal, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-gray-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleFinalSubmit}
                  disabled={
                    !personal.firstName ||
                    !personal.lastName ||
                    !personal.email ||
                    !personal.password || loading
                  }
                  className="w-full ml-auto py-2 px-4 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

        {/* Right Side - Image */}
        <div className="hidden md:flex w-1/2 bg-blue-400 items-center justify-center px-8 md:px-12 lg:px-16 py-12 relative">
            <div className="bg-blue-300 bg-opacity-30 p-10 rounded-lg text-white text-center relative max-w-md w-full">
                <h2 className="text-2xl font-semibold mb-8">Welcome to PetNeo - <br /> Connecting Pets & Vets</h2>
                <Image src="/images/dog1.svg" alt="Dog" width={380} height={380} className="mx-auto relative z-10" />
                <div className="flex justify-center gap-2 mt-6">
                    <span className="w-3 h-3 rounded-full bg-white" />
                    <span className="w-3 h-3 rounded-full bg-white opacity-50" />
                </div>
            </div>
        </div>
    </div>
  );
}
