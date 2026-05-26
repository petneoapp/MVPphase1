"use client";


// appointmentHelper.ts
import {ErrorAlert} from "@/utils/commonTypes";

export function isAppointmentInFuture(
    appointmentDate: string, // "2025-11-14"
    appointmentTime: string  // "09:00 AM"
): boolean {
    // Convert 12-hour format to 24-hour format
    const timeRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i;
    const match = appointmentTime.match(timeRegex);

    if (!match) {
        console.error('Invalid time format. Use "HH:MM AM/PM"');
        return false;
    }

    const [, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    // Convert to 24-hour format
    if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
    }

    // Create appointment Date object (in local timezone)
    const appointment = new Date(`${appointmentDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);

    // Validate date
    if (Number.isNaN(appointment.getTime())) {
        console.error('Invalid date format. Use "YYYY-MM-DD"');
        return false;
    }

    const now = new Date();

    // Return true if appointment is in the future
    return appointment.getTime() > now.getTime();
}

export function getRemainingTime(date: string, time: string): string {
    // Combine date and time to construct a full Date object
    const datetimeStr = `${date} ${time}`;
    // Parse datetime string to Date object
    const target = new Date(datetimeStr);

    // Get current date-time
    const now = new Date();

    // Calculate difference in milliseconds
    const diffMs = target.getTime() - now.getTime();

    // If time has already passed
    if (diffMs <= 0) {
        return "Time has already passed";
    }

    // Convert milliseconds difference into seconds
    let diffSeconds = Math.floor(diffMs / 1000);

    // Calculate days, hours, minutes, and seconds
    const days = Math.floor(diffSeconds / (24 * 3600));
    diffSeconds %= 24 * 3600;
    const hours = Math.floor(diffSeconds / 3600);
    diffSeconds %= 3600;
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;

    // Build result string with two largest non-zero units
    if (days > 0) {
        return `${days} days`;
    } else if (hours > 0) {
        return `${hours} hours`;
    } else {
        return `${minutes} minutes`;
    }
}

export function formatDate1(dateStr: string): string {
    const date = new Date(dateStr);

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
}

export function removeItemById (errorArray: ErrorAlert[], id: string) {
    const idx = errorArray.findIndex((item) => item.id === id);
    if (idx > -1) {
        errorArray.splice(idx, 1)
        return errorArray;
    }
    return errorArray;
}

