export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
            
            {/* Main Container */}
            <div className="w-full max-w-md relative z-10 px-4 py-8">
                {/* Logo or Branded Element could go here if needed */}
                <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl p-8 md:p-10">
                    {children}
                </div>
                
                {/* Branding Footer */}
                <div className="mt-8 text-center">
                    <p className="text-neutral-600 text-[11px] font-medium tracking-[0.2em] uppercase">
                        Authentic Bazar • Premium Secure Identity
                    </p>
                </div>
            </div>
        </div>
    );
}
