// middleware.ts (at root level, same as app/ folder)
import { NextRequest, NextResponse } from 'next/server';

interface TokenPayload {
    exp: number;
    iat: number;
    [key: string]: any;
}

function isPublicRoute(pathname: string): boolean {
    //custom logic to check the protected routes
    if (pathname.startsWith('/customer')) {
        return pathname === '/customer/signup';
    } else if (pathname.startsWith('/partner')) {
        return pathname === '/partner/signup';
    } else {
        return true;
    }
}

function decodeToken(token: string): TokenPayload | null {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode base64url payload
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded) as TokenPayload;
    } catch (error) {
        console.error('Token decode error:', error);
        return null;
    }
}

function isTokenExpired(payload: TokenPayload): boolean {
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    return currentTime >= expiryTime;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (isPublicRoute(pathname)) {
        // If user is already logged in
        return NextResponse.next();
    }

    // All other routes require valid token
    let token;
    if (pathname.startsWith('/partner')) {
        token = request.cookies.get('partnerAuthToken')?.value;
    } else if (pathname.startsWith('/customer')) {
        token = request.cookies.get('customerAuthToken')?.value;
    }


    // No token found
    if (!token) {
        console.log(`[Middleware] No token found for ${pathname}, redirecting to login`);
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Decode and validate token
    const payload = decodeToken(token);

    if (!payload) {
        console.log(`[Middleware] Invalid token format for ${pathname}, redirecting to login`);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        return response;
    }

    // Check token expiry
    if (isTokenExpired(payload)) {
        console.log(`[Middleware] Token expired for ${pathname}, redirecting to login`);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        return response;
    }

    // Token is valid, add it to request headers (optional, for API routes)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-token-payload', JSON.stringify(payload));

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
