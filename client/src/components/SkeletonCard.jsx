import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="card-tactical space-y-4 p-4 animate-pulse sm:p-6">
            <div className="flex justify-between items-start pt-2">
                <div className="space-y-3 w-2/3">
                    <div className="h-4 bg-military-gray/40 rounded w-1/4"></div>
                    <div className="h-6 bg-military-gray/60 rounded w-3/4"></div>
                </div>
                <div className="h-8 w-24 bg-military-gray/40 rounded-full"></div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-military-gray/40 rounded"></div>
                <div className="h-4 w-12 bg-military-gray/40 rounded"></div>
                <div className="h-4 w-16 bg-military-gray/40 rounded"></div>
            </div>

            <div className="space-y-2 pt-2">
                <div className="h-3 bg-military-gray/30 rounded w-full"></div>
                <div className="h-3 bg-military-gray/30 rounded w-5/6"></div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3">
                <div className="h-4 w-14 bg-military-gray/50 rounded"></div>
                <div className="h-4 w-16 bg-military-gray/50 rounded"></div>
                <div className="h-4 w-20 bg-military-gray/50 rounded"></div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-military-gray/30 pt-4 sm:flex-row">
                <div className="h-11 flex-1 rounded-xl bg-military-gray/20"></div>
                <div className="h-11 w-full rounded-xl bg-military-gray/20 sm:w-24"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;
