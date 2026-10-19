import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({ className, variant = "header" }) {
    const isFooter = variant === "footer";
    const isWhite = variant === "white" || variant === "drawer";

    return (
        <div className={cn("flex items-center gap-1.5 md:gap-2 transition-opacity hover:opacity-90", className)}>
            <Image
                src="/logo.png"
                alt="Pashora Shop"
                width={isFooter ? 48 : 38}
                height={isFooter ? 48 : 38}
                className={cn("object-contain rounded-xl shadow-xs border border-gray-200/60 dark:border-white/10", isFooter ? "w-10 h-10 md:w-11 md:h-11" : "w-8 h-8 md:w-9 md:h-9")}
                priority
            />
            <span className={cn(
                "font-bold tracking-tight whitespace-nowrap",
                isFooter ? "text-2xl text-white" : isWhite ? "text-[15px] sm:text-lg text-white" : "text-[15px] sm:text-lg text-gray-900"
            )}>
                Pashora Shop
            </span>
        </div>
    );
}

