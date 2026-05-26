"use client";

import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { PageType } from "@/app/customer/dashboard/constants";

type BreadCrumb = {
  id: PageType;
  label: string;
};

interface DashboardBreadCrumbsProps {
  breadCrumbs: BreadCrumb[];
  handleBreadCrumbsClick: (item: BreadCrumb) => () => void;
  userLocation?: string;
  isOpen: boolean;
}

export default function DashboardBreadCrumbs({
  breadCrumbs,
  handleBreadCrumbsClick,
  userLocation,
  isOpen,
}: DashboardBreadCrumbsProps) {
  return (
    <div
      className={`${
        isOpen ? "blur-sm pointer-events-none" : ""
      } flex items-center justify-between bg-[#d6dafc] px-6 py-2 text-sm text-gray-700 font-semibold select-none sticky top-[60px] z-40`}
    >
      <div className="flex items-center gap-1">
        {breadCrumbs.map((item, index) => {
          const isLast = index === breadCrumbs.length - 1;
          return (
            <div key={item.id} className="flex flex-nowrap items-center">
              {index === 0 && (
                <span
                  className={`${!isLast ? "cursor-pointer hover:text-pink-600" : ""}`}
                  onClick={handleBreadCrumbsClick(item)}
                >
                  {item.label}
                </span>
              )}
              {index > 0 && <IoIosArrowForward />}
              {index > 0 && (
                <span
                  className={`${!isLast ? "cursor-pointer hover:text-pink-600" : ""}`}
                  onClick={handleBreadCrumbsClick(item)}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 text-red-600">
        <FaMapMarkerAlt className="w-5 h-5" />
        {userLocation || "Loading location..."}
      </div>
    </div>
  );
}
