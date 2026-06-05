"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function ContactClient() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    // Load contact info from DB settings
    const [info, setInfo] = useState({
        phone: "",
        email: "",
        address: "",
        whatsapp: "",
    });

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(data => {
                // Settings are stored as JSON in store_settings key
                if (data.store_settings) {
                    try {
                        const s = JSON.parse(data.store_settings);
                        setInfo({
                            phone: s.whatsapp || "",
                            email: s.supportEmail || "",
                            address: s.address || "",
                            whatsapp: s.whatsapp || "",
                        });
                    } catch (_) { }
                }
            })
            .catch(() => { });
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Message sent successfully! We will get back to you soon.");
                setFormData({ name: "", email: "", message: "" });
            } else {
                toast.error(data.error || "Failed to send message");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 flex items-center justify-center py-20 min-h-[calc(100vh-80px)]">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Get in <span className="text-primary">Touch</span></h1>
                    <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">We'd love to hear from you. Whether you have a question about products, pricing, or anything else, our team is ready to answer all your questions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                    {/* Left Info Panel */}
                    <div className="bg-gray-900 text-white p-10 md:col-span-1 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <MessageSquare className="w-6 h-6 text-primary" />
                                Contact Information
                            </h2>
                            <p className="text-gray-400 mb-10 leading-relaxed">Fill up the form and our team will get back to you within 24 hours.</p>

                            <div className="space-y-6 text-sm">
                                {info.phone && (
                                    <div className="flex items-start gap-4">
                                        <Phone className="w-5 h-5 text-primary mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-200">WhatsApp / Phone</p>
                                            <p className="text-gray-400 mt-1">{info.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {info.email && (
                                    <div className="flex items-start gap-4">
                                        <Mail className="w-5 h-5 text-primary mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-200">Email</p>
                                            <p className="text-gray-400 mt-1">{info.email}</p>
                                        </div>
                                    </div>
                                )}
                                {info.address && (
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 text-primary mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-200">Office</p>
                                            <p className="text-gray-400 mt-1">{info.address}</p>
                                        </div>
                                    </div>
                                )}
                                {!info.phone && !info.email && !info.address && (
                                    <p className="text-gray-500 text-sm">Configure contact info in Admin → Settings.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Form Panel */}
                    <div className="p-10 md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Your Name</label>
                                    <input
                                        required type="text" name="name" value={formData.name}
                                        onChange={handleChange} placeholder="Your name"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-gray-50 focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                    <input
                                        required type="email" name="email" value={formData.email}
                                        onChange={handleChange} placeholder="your@email.com"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-gray-50 focus:bg-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Message</label>
                                <textarea
                                    required name="message" value={formData.message}
                                    onChange={handleChange} placeholder="How can we help you?"
                                    rows={5}
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none bg-gray-50 focus:bg-white"
                                />
                            </div>
                            <Button type="submit" disabled={loading}
                                className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
                            </Button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
