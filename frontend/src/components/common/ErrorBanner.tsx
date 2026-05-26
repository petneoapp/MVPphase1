'use client';

import React, {useEffect, useRef, useState} from 'react';
import { MdError } from 'react-icons/md';
import { MdClose } from 'react-icons/md';

interface ErrorBannerProps {
    title?: string;
    message: string;
    onDismiss?: () => void;
    visible?: boolean;
}

export function ErrorBanner({
                                title = 'Error',
                                message,
                                onDismiss,
                                visible = true,
                            }: ErrorBannerProps) {

    const [show, setShow] = useState(visible);
    const bannerRef = useRef<HTMLDivElement>(null);

    // Auto-focus banner when it appears
    useEffect(() => {
        if (visible) {
            setShow(true);
            // Focus the banner after it renders
            setTimeout(() => {
                bannerRef.current?.focus();
            }, 0);
        } else {
            setShow(false);
        }
    }, [visible]);

    if (!show) return null;

    return (
        <div
            ref={bannerRef}
            role="alert"
            aria-live="assertive"
            aria-labelledby="error-title"
            tabIndex={-1}
            className="animate-in m-2 slide-in-from-top-2 duration-300 flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
            <MdError className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-700 mb-1">{title}</h3>
                <p className="text-sm text-red-600 break-words">{message}</p>
            </div>
            <button
                onClick={onDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Dismiss error"
            >
                <MdClose className="w-5 h-5" />
            </button>
        </div>
    );
}
