import React from 'react';
import { MagicCard } from './MagicBento';

const TimelineEvent = ({ date, title, subtitle, isLast }) => (
    <div className="relative pl-8 pb-8 z-10">
        {!isLast && (
            <div className="absolute top-2 left-[11px] h-full w-px bg-white/10"></div>
        )}
        <div className="absolute top-2 left-1 w-2.5 h-2.5 rounded-full bg-[#11141a] border border-emerald-500 z-10"></div>

        <div className="text-xs font-mono text-gray-500 mb-1">{date}</div>
        <div className="text-sm font-medium text-white mb-0.5">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
);

const VerificationTimeline = () => {
    return (
        <MagicCard
            enableStars={false}
            enableTilt={false}
            className="!bg-[#11141a]/80"
        >
            <h3 className="text-sm font-medium text-white mb-6 relative z-10">Verification Epochs</h3>

            <div className="mt-2 relative z-10">
                <TimelineEvent
                    date="2024-12-14 09:21 UTC"
                    title="Epoch #402 Finalized"
                    subtitle="142k tons Carbon issued. Validators reached 99.8% consensus."
                />
                <TimelineEvent
                    date="2024-12-07 09:21 UTC"
                    title="Epoch #401 Finalized"
                    subtitle="138k tons Carbon issued. 2 new forests onboarded."
                />
                <TimelineEvent
                    date="2024-11-30 09:21 UTC"
                    title="Epoch #400 Finalized"
                    subtitle="140k tons Carbon issued. System upgrade v2.1."
                    isLast={true}
                />
            </div>

            <button className="w-full mt-2 py-2 text-xs font-mono text-center text-gray-500 hover:text-white border border-white/5 hover:border-white/10 rounded transition-all relative z-10">
                VIEW FULL HISTORY
            </button>
        </MagicCard>
    );
};

export default VerificationTimeline;
