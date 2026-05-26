"use client";

import { useState } from "react";
import { FaGoogle, FaFacebookF, FaEyeSlash } from "react-icons/fa";
import Image from "next/image";

export default function LoginPage() {
  const [agentTab, setAgentTab] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Dummy login credentials
  const validEmail = "user@example.com";
  const validPassword = "password123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === validEmail && password === validPassword) {
      setMessage("✅ Login successful! Welcome back.");
    } else {
      setMessage("❌ Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen 100vh flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-6xl bg-white shadow-md rounded-md flex overflow-hidden">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 px-8 md:px-12 lg:px-16 py-12">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-pink-600">
              Pet<span className="text-blue-600">neo</span>
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex mb-8">
            <button
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                agentTab ? "bg-pink-500 text-white" : "bg-pink-200 text-gray-600"
              }`}
              onClick={() => setAgentTab(true)}
            >
              Are you an Agent?
            </button>
            <button
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                !agentTab ? "bg-pink-500 text-white" : "bg-pink-200 text-gray-600"
              }`}
              onClick={() => setAgentTab(false)}
            >
              Are you an User?
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Log In</h2>
            <a href="#" className="text-blue-600 text-sm font-medium">
              Signup
            </a>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-3 text-sm focus:outline-pink-400"
              required
            />
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-3 text-sm focus:outline-pink-400"
                required
              />
              <FaEyeSlash className="absolute right-3 top-4 text-gray-500" />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-xs text-gray-500">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded text-white font-medium transition ${
                email && password
                  ? "bg-pink-500 hover:bg-pink-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!email || !password}
            >
              Login
            </button>
          </form>

          {/* Message */}
          {message && (
            <p
              className={`mt-4 text-sm font-medium ${
                message.includes("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          {/* Signup Link */}
          <p className="mt-6 text-sm text-gray-600">
            Don’t Have Account?{" "}
            <a href="#" className="text-blue-600 font-medium">
              Signup
            </a>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <hr className="flex-1 border-gray-300" />
            <span className="text-gray-500 text-sm">Or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center border rounded py-3 gap-2 hover:bg-gray-100">
              <FaGoogle className="text-red-500" /> Google
            </button>
            <button className="w-full flex items-center justify-center border rounded py-3 gap-2 hover:bg-gray-100">
              <FaFacebookF className="text-blue-600" /> Facebook
            </button>
          </div>

          {/* Footer */}
          <p className="mt-16 text-xs text-gray-500">
            © 2025 PatNeo. All Rights Reserved
          </p>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:flex w-1/2 bg-blue-400 items-center justify-center px-8 md:px-12 lg:px-16 py-12 relative">
          <div className="bg-blue-300 bg-opacity-30 p-10 rounded-lg text-white text-center relative max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-8">
              Welcome to PetNeo - <br /> Connecting Pets & Vets
            </h2>
            <Image
              src="/dog.png"
              alt="Dog"
              width={380}
              height={380}
              className="mx-auto relative z-10"
            />
            {/* Carousel dots */}
            <div className="flex justify-center gap-2 mt-6">
              <span className="w-3 h-3 rounded-full bg-white"></span>
              <span className="w-3 h-3 rounded-full bg-white opacity-50"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
