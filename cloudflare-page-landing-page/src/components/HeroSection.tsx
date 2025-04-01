import {Shield} from "lucide-react";

export const HeroSection = () => {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
            <div className="max-w-5xl mx-auto text-center animate-fade-up">
                <div
                    className="inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full bg-secondary/10 backdrop-blur-sm border border-secondary/20">
                    <Shield className="w-4 h-4 mr-2 text-secondary"/>
                    <span className="text-sm font-medium text-secondary">Private & Secure</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text bg-gradient-to-r from-white to-secondary/80">
                    ZKL$OL
                </h1>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text bg-gradient-to-r from-white to-secondary/80">
                    Privacy-First Liquid Staking
                </h1>

                <p className="text-lg md:text-xl text-accent/90 mb-12 max-w-2xl mx-auto">
                    Earn yield on your assets while maintaining complete privacy through zero-knowledge proofs
                </p>
            </div>
        </div>
    );
};
