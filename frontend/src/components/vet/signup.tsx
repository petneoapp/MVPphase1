"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api/config";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Poppins } from "next/font/google";
import { FaCamera, FaPen } from "react-icons/fa";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Service = { id: number; name: string };

export default function SignupPageVet() {

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

  // Step 3: Professional Info
  const [professional, setProfessional] = useState({
    qualification: "",
    specialization: "",
    licenseNo: "",
    licenseAuth: "",
    experience: "",
    address: "",
    landmark: "",
    clinicName: "",
    location: "",
    certificate: null as File | null,
  });

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [otherServiceIds, setOtherServiceIds] = useState(""); // manual comma-separated IDs
  const [newServiceName, setNewServiceName] = useState("");

  // Use centralized API_BASE

  // Default (fallback) services — used when API not available or to ensure at least 3 exist
  const defaultServices: Service[] = [
    { id: 1, name: "General Checkup" },
    { id: 2, name: "Vaccination" },
    { id: 3, name: "Minor Surgery" },
  ];

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

  // Helper: deduplicate services by id
  const dedupeServices = (list: Service[]) => {
    const map = new Map<number, Service>();
    list.forEach((s) => {
      if (Number.isInteger(s.id) && s.id > 0 && s.name?.trim()) {
        if (!map.has(s.id)) map.set(s.id, { id: s.id, name: s.name.trim() });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  };

  // Fetch services on mount — fallback to defaultServices if API missing or error
  useEffect(() => {
    const fetchServices = async () => {
      // If API not configured, fallback to defaults
      if (!API_BASE) {
        setServices(dedupeServices(defaultServices));
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/services/`);
        if (!res.ok) {
          console.warn("Failed to fetch services list:", res.status);
          // still set defaults so UI isn't empty
          setServices(dedupeServices(defaultServices));
          return;
        }
        // safe json parse
        let data: any = null;
        try {
          data = await res.json();
        } catch (err) {
          console.warn("Failed to parse services JSON:", err);
          setServices(dedupeServices(defaultServices));
          return;
        }

        if (Array.isArray(data)) {
          const parsed: Service[] = data
            .map((s: any) => {
              const idCandidate = Number(s.id ?? s.service_id ?? s.serviceId ?? s.id_str);
              const nameCandidate = String(s.name ?? s.title ?? s.service_name ?? "").trim();
              return { id: Number.isInteger(idCandidate) ? idCandidate : NaN, name: nameCandidate };
            })
            .filter((s: any) => Number.isInteger(s.id) && s.name);

          // merge with default services (defaults may contain commonly expected service IDs)
          const merged = dedupeServices([...defaultServices, ...parsed]);
          setServices(merged);
        } else {
          console.warn("Unexpected services response shape:", data);
          setServices(dedupeServices(defaultServices));
        }
      } catch (err) {
        console.warn("Error fetching services:", err);
        setServices(dedupeServices(defaultServices));
      }
    };

    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  // --------------------------
  // Phone OTP: send & verify
  // --------------------------
  const handleSendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!phone || phone.length !== 10) throw new Error("Please enter a valid 10-digit phone number");

      if (!API_BASE) {
        // debug-friendly fallback
        setMessage("Development Mode Active — Use OTP 123456 for testing");
        setShowOtp(true);
        return;
      }

      const res = await fetch(`${API_BASE}/sendMobileOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: phone }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.detail?.[0]?.msg || data?.message || "Failed to send OTP");
      }
      setShowOtp(true);
      if (process.env.NODE_ENV === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost")) {
        setMessage("Development Mode Active — Use OTP 123456 for testing");
      } else {
        setMessage("✅ OTP sent to phone successfully!");
      }
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

      if (!API_BASE) {
        // dev fallback - accept any OTP
        setVerified(true);
        setMessage("✅ (dev) Phone number verified!");
        setStep(2);
        return;
      }

      const res = await fetch(`${API_BASE}/verifyMobileOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: phone, otp }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.detail?.[0]?.msg || data?.message || "Invalid OTP");
      }

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

      if (!API_BASE) {
        setMessage("Development Mode Active — Use OTP 123456 for testing");
        setShowEmailOtp(true);
        return;
      }

      const res = await fetch(`${API_BASE}/sendEmailOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: personal.email }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.detail?.[0]?.msg || data?.message || "Failed to send email OTP");
      }
      setShowEmailOtp(true);
      if (process.env.NODE_ENV === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost")) {
        setMessage("Development Mode Active — Use OTP 123456 for testing");
      } else {
        setMessage("✅ Email OTP sent — check your inbox (or spam).");
      }
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

      if (!API_BASE) {
        setEmailVerified(true);
        setMessage("✅ (dev) Email verified!");
        return;
      }

      const res = await fetch(`${API_BASE}/verifyEmailOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: personal.email, otp: emailOtp }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.detail?.[0]?.msg || data?.message || "Invalid email OTP");
      }

      setEmailVerified(true);
      setMessage("✅ Email verified!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a new service (POST /services/)
  const handleCreateService = async () => {
    if (!newServiceName?.trim()) {
      setMessage("❌ Enter a name to create a service.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const name = newServiceName.trim();

      if (!API_BASE) {
        // Local fallback creation (dev mode) - choose next available id
        const highestId = services.reduce((acc, s) => Math.max(acc, s.id), 0);
        const newId = highestId + 1 || Date.now();
        const localService: Service = { id: newId, name };
        setServices((s) => dedupeServices([...s, localService]));
        setSelectedServiceIds((s) => [...s, localService.id]);
        setNewServiceName("");
        setMessage(`✅ Service "${localService.name}" created locally and selected.`);
        return;
      }

      const res = await fetch(`${API_BASE}/services/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.detail?.[0]?.msg || data?.message || "Failed to create service");
      }

      // API returns the created service with id
      const created: Service | null =
        data && (Number.isInteger(Number(data.id)) || Number.isInteger(data.id))
          ? { id: Number(data.id), name: String(data.name ?? name) }
          : null;

      if (created) {
        setServices((s) => dedupeServices([...s, created]));
        setSelectedServiceIds((s) => [...s, created.id]);
        setNewServiceName("");
        setMessage(`✅ Service "${created.name}" created and selected.`);
      } else {
        // If response shape differs, refresh list
        setMessage("✅ Service created — refreshing list.");
        const refresh = await fetch(`${API_BASE}/services/`);
        if (refresh.ok) {
          const list = await refresh.json();
          if (Array.isArray(list)) {
            const parsed: Service[] = list
              .map((s: any) => ({ id: Number(s.id ?? s.service_id ?? s.serviceId), name: String(s.name ?? s.title ?? "") }))
              .filter((s) => Number.isInteger(s.id));
            setServices(dedupeServices([...defaultServices, ...parsed]));
          }
        }
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle service checkbox
  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
      if (!professional.qualification || !professional.licenseNo || !professional.clinicName) {
        throw new Error("Please fill all required professional information fields");
      }

      // build final service IDs list
      // parse otherServiceIds
      const manual = (otherServiceIds || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n)) as number[];

      const finalIds = Array.from(new Set([...selectedServiceIds, ...manual])); // unique

      if (finalIds.length === 0) {
        throw new Error("Please select at least one valid service or add service IDs.");
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
      formData.append("qualification", professional.qualification);
      formData.append("specialization", professional.specialization);
      formData.append("license_number", professional.licenseNo);
      formData.append("license_issuing_authority", professional.licenseAuth);
      formData.append("years_of_experience", String(professional.experience));
      formData.append("address", professional.address);
      formData.append("landmark", professional.landmark);
      formData.append("clinic_name", professional.clinicName);
      formData.append("location", professional.location);

      // important: send validated service ids as comma separated string
      formData.append("service_ids", finalIds.join(","));

      if (professional.certificate) {
        formData.append("certification_document", professional.certificate);
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
      } else {
        console.log("📎 No client extras found to append");
      }

      if (!API_BASE) {
        // dev fallback: simulate successful registration
        const payloadEntries = Object.fromEntries(formData.entries());
        console.log("📡 (dev) FormData submitted:", payloadEntries);
        setMessage("✅ (dev) Registration simulated successfully!");
        alert("Registration Successful");
        router.push("/login");
        return;
      }

      // Log final submit payload
      const payloadEntries = Object.fromEntries(formData.entries());
      console.log("[DEBUG Submit] Final Submit Payload:", payloadEntries);

      const res = await fetch(`${API_BASE}/registerVet`, {
        method: "POST",
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        // helpful suggestions for common errors
        if (data?.detail && typeof data.detail === "string") {
          console.error("Server error detail:", data.detail);
          if (data.detail.toLowerCase().includes("foreign key") || data.detail.toLowerCase().includes("foreignkeyviolation")) {
            throw new Error("Registration failed: one or more service IDs are invalid on the server. Create the missing service(s) or remove invalid IDs.");
          }
        }
        if (data?.message && typeof data.message === "string" && data.message.toLowerCase().includes("email is not verified")) {
          throw new Error("Please verify your email first before completing registration.");
        }
        const serverMsg = data?.message || data?.detail || res.statusText || "Registration failed with server error";
        console.error("Registration error response:", data);
        throw new Error(serverMsg);
      } else if (!data.status) {
         if (data?.message && typeof data.message === "string" && data.message.toLowerCase().includes("user already registered")) {
          throw new Error(data.message);
        }
      }

      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
        console.log("🔑 Received token:", data.token); // check console for token
      } else {
        console.log("✅ Registration response (no token returned):", data);
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
              {[1, 2, 3].map((s) => (
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
                  onClick={() => setStep(3)}
                  disabled={
                    !personal.firstName ||
                    !personal.lastName ||
                    !personal.email ||
                    !personal.password
                  }
                  className="w-full ml-auto py-2 px-4 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section>
              <h2 className="text-xl font-semibold mb-1">Professional Details</h2>
              <p className="text-sm text-gray-600 mb-4">Enter your clinic & license details</p>

              <div className="mb-3">
                <FieldLabel required>Qualification</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.qualification}
                  onChange={(e) => setProfessional({ ...professional, qualification: e.target.value })}
                />
              </div>

              <div className="md:flex md:gap-4">
                <div className="md:flex-1 mb-3">
                  <FieldLabel>Specialization</FieldLabel>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={professional.specialization}
                    onChange={(e) => setProfessional({ ...professional, specialization: e.target.value })}
                  />
                </div>
                <div className="md:flex-1 mb-3">
                  <FieldLabel>Years of Experience</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded-md px-3 py-2"
                    value={professional.experience}
                    onChange={(e) => setProfessional({ ...professional, experience: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <FieldLabel required>License Number</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.licenseNo}
                  onChange={(e) => setProfessional({ ...professional, licenseNo: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <FieldLabel>License Issuing Authority</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.licenseAuth}
                  onChange={(e) => setProfessional({ ...professional, licenseAuth: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <FieldLabel required>Clinic Name</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.clinicName}
                  onChange={(e) => setProfessional({ ...professional, clinicName: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <FieldLabel>Location</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.location}
                  onChange={(e) => setProfessional({ ...professional, location: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <FieldLabel>Address</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.address}
                  onChange={(e) => setProfessional({ ...professional, address: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <FieldLabel>Landmark</FieldLabel>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={professional.landmark}
                  onChange={(e) => setProfessional({ ...professional, landmark: e.target.value })}
                />
              </div>

              {/* Services selection */}
              <div className="mb-3">
                <FieldLabel required>Services (select at least one)</FieldLabel>
                <div className="text-xs text-gray-500 mb-1">Choose from existing services or create a new one.</div>
                {services.length > 0 ? (
                  <div className="max-h-36 overflow-auto border rounded p-2">
                    {services.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm mb-1">
                        <input
                          type="checkbox"
                          checked={selectedServiceIds.includes(s.id)}
                          onChange={() => toggleService(s.id)}
                          className="w-4 h-4"
                        />
                        <span>{s.name} <span className="text-gray-400 text-xs">({s.id})</span></span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-2">No services loaded — you can create one or paste IDs below.</div>
                )}

                <div className="mt-2 text-xs text-gray-600">If a service is missing, create it here:</div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="New service name"
                    className="flex-1 border rounded-md px-3 py-2"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                  <button
                    onClick={handleCreateService}
                    disabled={!newServiceName.trim() || loading}
                    className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-600">Or add other existing service IDs (comma separated):</div>
                <input
                  type="text"
                  placeholder="e.g. 1,2,3"
                  className="w-full border rounded-md px-3 py-2 mt-1"
                  value={otherServiceIds}
                  onChange={(e) => setOtherServiceIds(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {selectedServiceIds.length} {selectedServiceIds.length === 0 ? " (none)" : ""}
                </div>
              </div>

              <div className="mb-4">
                <FieldLabel>Certification Document</FieldLabel>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full border rounded-md px-3 py-2"
                  onChange={(e) => setProfessional({ ...professional, certificate: e.target.files ? e.target.files[0] : null })}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="py-2 px-4 border rounded-md">
                  Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="ml-auto py-2 px-4 bg-green-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden md:flex md:w-1/2 bg-blue-50 items-center justify-center p-12">
        <Image src="/images/signup-illustration.svg" alt="Signup Illustration" width={500} height={500} />
      </div>
    </div>
  );
}
