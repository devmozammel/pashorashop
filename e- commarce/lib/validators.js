import { z } from "zod";

// Password policy: At least 8 chars, 1 uppercase, 1 number, 1 special character
export const passwordSchema = z.string()
    .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
    .regex(/[A-Z]/, "পাসওয়ার্ডে অন্তত একটি বড় হাতের অক্ষর (A-Z) থাকতে হবে")
    .regex(/[0-9]/, "পাসওয়ার্ডে অন্তত একটি সংখ্যা (0-9) থাকতে হবে")
    .regex(/[^a-zA-Z0-9]/, "পাসওয়ার্ডে অন্তত একটি বিশেষ চিহ্ন (যেমন: @, #, $, %) থাকতে হবে");

export const orderSchema = z.object({
    items: z.array(z.object({
        product: z.object({ id: z.string() }),
        quantity: z.number().min(1),
        variant: z.object({ id: z.string() }).optional().nullable(),
    })).min(1),
    shippingAddress: z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        street: z.string().min(1),
        city: z.string().min(1),
        zip: z.string().optional(),
    }),
    paymentMethod: z.enum(["COD", "BKASH", "NAGAD"]),
    couponCode: z.string().optional().nullable(),
});

export const trackOrderSchema = z.object({
    orderId: z.string().min(1),
    emailOrPhone: z.string().min(1),
});
