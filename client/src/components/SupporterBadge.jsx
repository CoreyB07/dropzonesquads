import React from 'react';
import { Trophy } from 'lucide-react';

const SupporterBadge = () => {
    return (
        <Trophy
            className="h-3.5 w-3.5 shrink-0 text-premium-gold-soft"
            strokeWidth={2.5}
            title="Premium Supporter"
        />
    );
};

export default SupporterBadge;
