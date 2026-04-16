import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, ArrowRight, MapPin, Phone } from "lucide-react";

export default function Footer({ settings = {} }) {
    const currentYear = new Date().getFullYear();
    const siteName = settings.site_name || "Fashion House";

    return (
        <footer className="bg-muted/20 border-t pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Logo variant="footer" />
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Elevating your style with premium quality fashion. Authentic products, sustainable practices, and exceptional service.
                        </p>
                        <div className="flex gap-4 pt-2">
                            {[Facebook, Instagram, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Link Columns */}
                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Shop</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            {['Men', 'Women', 'Kids', 'New Arrivals', 'Flash Sale'].map((item) => (
                                <li key={item}>
                                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="hover:text-primary transition-colors flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Support</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            {[
                                { name: 'Track Order', href: '/track' },
                                { name: 'Returns & Exchange', href: '/return-refund' },
                                { name: 'Shipping Policy', href: '/shipping' }, // Ensure page exists or map to privacy/terms if not
                                { name: 'Terms & Conditions', href: '/terms' },
                                { name: 'Privacy Policy', href: '/privacy' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="hover:text-primary transition-colors flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter & Contact */}
                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Stay Connected</h3>
                        <div className="space-y-6">
                            <form className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full h-12 pl-4 pr-12 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                                <button className="absolute right-1 top-1 h-10 w-10 bg-primary text-primary-foreground rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors">
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>123 Fashion Street, Design District, NY 10001</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Phone className="w-5 h-5 text-primary shrink-0" />
                                    <span>{settings.support_phone || "+1 (555) 123-4567"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Mail className="w-5 h-5 text-primary shrink-0" />
                                    <span>{settings.support_email || "hello@fashionhouse.com"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <p>&copy; {currentYear} {siteName}. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            {/* Payment icons placeholder text or images */}
                            <span>Secure Payment</span>
                            <div className="flex gap-2 opacity-60">
                                {/* Ideally use SVGs or Images */}
                                <div className="w-8 h-5 bg-gray-200 rounded" />
                                <div className="w-8 h-5 bg-gray-200 rounded" />
                                <div className="w-8 h-5 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
