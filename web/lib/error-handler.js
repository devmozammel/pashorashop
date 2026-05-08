import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API Error Handler
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (optional)
 * @returns {NextResponse}
 */
export function apiError(error, context = "API Error") {
    console.error(`[${context}]`, error);

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                ok: false,
                message: "Validation Error",
                details: error.errors,
            },
            { status: 400 }
        );
    }

    // Handle known Prisma errors (optional expansion)
    if (error.code === "P2002") {
        return NextResponse.json(
            {
                ok: false,
                message: "Unique constraint violation. A record with this value already exists.",
            },
            { status: 409 }
        );
    }

    return NextResponse.json(
        {
            ok: false,
            message: error.message || "Internal Server Error",
        },
        { status: 500 }
    );
}
