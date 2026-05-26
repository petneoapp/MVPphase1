import React from "react";
import { FaTimes } from "react-icons/fa";

type PopupProps = {
  open: boolean;
  onCancel: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  children: React.ReactNode;
  primaryIcon?: React.ReactNode; // optional icon for the primary button
};


export default function PopupModel({open, onCancel, onPrimary, primaryLabel, children, primaryIcon,}: PopupProps) {
    if (!open) return null;
    return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Overlay */}
                <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50"></div>
                {/* Modal card */}
                <div className="relative bg-white rounded-lg shadow-lg max-w-[40vw] w-full mx-4 p-6 z-10 flex flex-col max-h-[80vh]">
                    {/* Close icon top right
                    <button
                    type="button"
                    onClick={onCancel}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    >
                    <FaTimes size={18} />
                    </button> */}
                    {/* Custom content */}
                    <div className="mb-6 overflow-y-auto">{children}</div>
                    {/* Footer */}
                    <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onPrimary}
                        className="px-4 py-2 rounded font-semibold text-white bg-pink-600 hover:bg-pink-700 flex items-center gap-2 transition"
                    >
                        {primaryIcon && <span>{primaryIcon}</span>}
                        {primaryLabel}
                    </button>
                    </div>
                </div>
            </div>
        );
 }
