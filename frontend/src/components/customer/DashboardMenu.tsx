"use client";

import React from "react";
import { FaChevronRight } from "react-icons/fa";
import SimpleOverlay from "@/components/customer/simpleOverlay";
import { PageType } from "@/app/customer/dashboard/constants";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  id: PageType;
}

interface DashboardMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuItems: MenuItem[];
  handleMenuClick: (item: MenuItem) => void;
  handleLogOut: () => void;
}

export default function DashboardMenu({
  isOpen,
  setIsOpen,
  menuButtonRef,
  menuItems,
  handleMenuClick,
  handleLogOut,
}: DashboardMenuProps) {
  return (
    <SimpleOverlay
      targetRef={menuButtonRef}
      placement="bottom"
      show={isOpen}
      offset={40}
      offSetY={350}
      onHide={() => setIsOpen(false)}
    >
      <div className="w-90 max-w-xs rounded-xl shadow-md p-4 bg-white">
        <div className="mb-4">
          {menuItems.map((menuItem) => (
            <div
              key={menuItem.id}
              className="cursor-pointer border-0 px-0 py-2"
              onClick={() => handleMenuClick(menuItem)}
            >
              <div className="flex flex-row flex-nowrap items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg">
                    {menuItem.icon}
                  </div>
                  <span className="font-semibold text-black">{menuItem.label}</span>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
        <button
          className="w-full h-10 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg transition"
          onClick={handleLogOut}
        >
          Logout
        </button>
      </div>
    </SimpleOverlay>
  );
}
