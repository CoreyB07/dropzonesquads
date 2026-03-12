import React from 'react';

const SQUAD_TAG_PATTERN = /^\s*\[([^\]]+)\]\s*(.*)$/;

const SquadNameText = ({
    name,
    className = '',
    accentClassName = 'text-squad-name',
}) => {
    const value = String(name || '').trim();
    const match = value.match(SQUAD_TAG_PATTERN);

    if (!match) {
        const shortName = value.slice(0, 5);
        return (
            <span className={className}>
                <span className={accentClassName}>{shortName}</span>
            </span>
        );
    }

    const [, tag] = match;
    const shortTag = tag.slice(0, 5);

    return (
        <span className={className}>
            <span className={accentClassName}>{shortTag}</span>
        </span>
    );
};

export default SquadNameText;
