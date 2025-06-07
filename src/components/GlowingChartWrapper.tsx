import { useState, ReactNode } from 'react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

interface GlowingChartWrapperProps {
    children: ReactNode;
    className?: string;
}

export function GlowingChartWrapper({ children, className = "" }: GlowingChartWrapperProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`relative group ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Aceternity Glowing Effect */}
            <div className="relative">
                <GlowingEffect
                    blur={20}
                    proximity={100}
                    spread={60}
                    glow={isHovered}
                    className="absolute inset-0"
                    disabled={!isHovered}
                    movementDuration={2}
                    borderWidth={2}
                />

                {/* Chart Content */}
                <div className="relative bg-black border border-gray-800/50 rounded-2xl transition-all duration-500 group-hover:border-gray-700/30">
                    {children}

                    {/* Inner glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 to-pink-500/2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                </div>
            </div>
        </div>
    );
}