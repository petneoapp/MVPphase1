"use client";

import { useState } from "react";

const mainTabs = ["Appointments", "Emergencies", "Home Visits"];
const subTabs = ["Upcoming", "Completed", "Ongoing", "Reschedule"];

interface TabsProps {
  onChange?: (tab: string, subTab: string) => void;
}

export default function Tabs({ onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState("Appointments");
  const [activeSubTab, setActiveSubTab] = useState("Upcoming");

  const handleMainTabClick = (tab: string) => {
    setActiveTab(tab);
    setActiveSubTab("Upcoming"); // reset sub tab on main tab switch
    onChange?.(tab, "Upcoming");
  };

  const handleSubTabClick = (tab: string) => {
    setActiveSubTab(tab);
    onChange?.(activeTab, tab);
  };

  return (
    <div className="mt-6">
      {/* === Main Tabs === */}
      <div className="flex gap-4">
        {mainTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleMainTabClick(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 
              ${
                activeTab === tab
                  ? "bg-pink-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* === Sub Tabs (only for Appointments) === */}
      {activeTab === "Appointments" && (
        <div className="flex gap-6 mt-4">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleSubTabClick(tab)}
              className={`pb-1 text-sm font-medium transition-colors duration-200
                ${
                  activeSubTab === tab
                    ? "text-pink-600 border-b-2 border-pink-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
