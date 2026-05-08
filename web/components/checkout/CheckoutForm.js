"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function CheckoutForm({ onSubmit, loading }) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [paymentMethod, setPaymentMethod] = useState("COD");

    const onFormSubmit = (data) => {
        onSubmit({ ...data, paymentMethod });
    };

    return (
        <form id="checkout-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h2 className="text-xl font-bold">Shipping Address</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <input
                            {...register("name", { required: "Name is required" })}
                            className="w-full h-10 px-3 rounded-md border focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="John Doe"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <input
                            {...register("phone", { required: "Phone is required" })}
                            className="w-full h-10 px-3 rounded-md border focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="017..."
                        />
                        {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Street Address</label>
                    <input
                        {...register("street", { required: "Address is required" })}
                        className="w-full h-10 px-3 rounded-md border focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="House 123, Road 4, Sector 5..."
                    />
                    {errors.street && <span className="text-red-500 text-xs">{errors.street.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">City</label>
                        <input
                            {...register("city", { required: "City is required" })}
                            className="w-full h-10 px-3 rounded-md border focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Dhaka"
                        />
                        {errors.city && <span className="text-red-500 text-xs">{errors.city.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Zip Code (Optional)</label>
                        <input
                            {...register("zip")}
                            className="w-full h-10 px-3 rounded-md border focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="1230"
                        />
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h2 className="text-xl font-bold">Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod("COD")}
                        className={`p-4 border rounded-lg text-center font-medium transition-colors ${paymentMethod === "COD" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-gray-50"}`}
                    >
                        Cash on Delivery
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod("BKASH")}
                        className={`p-4 border rounded-lg text-center font-medium transition-colors ${paymentMethod === "BKASH" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-gray-50"}`}
                    >
                        bKash
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod("NAGAD")}
                        className={`p-4 border rounded-lg text-center font-medium transition-colors ${paymentMethod === "NAGAD" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-gray-50"}`}
                    >
                        Nagad
                    </button>
                </div>
            </div>
        </form>
    );
}
