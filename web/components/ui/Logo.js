import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({ className, variant = "header" }) {
    const isFooter = variant === "footer";
    const isWhite = variant === "white" || variant === "drawer";

    return (
        <div className={cn("flex items-center gap-1.5 md:gap-2 transition-opacity hover:opacity-90", className)}>
            <Image
                src="/logo.png"
                alt="Authentic Bazar Shop"
                width={isFooter ? 50 : 40}
                height={isFooter ? 50 : 40}
                className={cn("object-contain", isFooter ? "" : "w-8 h-8 md:w-10 md:h-10")}
                priority
            />
            <span className={cn(
                "font-bold tracking-tight whitespace-nowrap",
                isFooter ? "text-2xl text-white" : isWhite ? "text-[15px] sm:text-lg text-white" : "text-[15px] sm:text-lg text-gray-900"
            )}>
                Authentic Bazar Shop
            </span>
        </div>
    );
}

