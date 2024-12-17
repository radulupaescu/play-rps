import React, { useEffect, useState } from "react";

const PaperIcon = () => (
    <svg width="100" height="180" viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
        <polygon points="10,20 70,20 90,40 90,120 10,120" fill="#E0E0E0" stroke="#000000" strokeWidth="2"/>

        <polygon points="70,21 89,40 70,40" fill="#C0C0c0" stroke="#000000" strokeWidth="2"/>

        <line x1="20" y1="40" x2="60" y2="40" stroke="#000" strokeWidth="4"/>
        <line x1="20" y1="55" x2="80" y2="55" stroke="#000" strokeWidth="2"/>
        <line x1="20" y1="70" x2="80" y2="70" stroke="#000" strokeWidth="2"/>
        <line x1="20" y1="85" x2="80" y2="85" stroke="#000" strokeWidth="2"/>
        <line x1="20" y1="100" x2="80" y2="100" stroke="#000" strokeWidth="2"/>
    </svg>
);

const RockIcon = () => (
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 70 Q20 50, 40 30 Q50 10, 70 20 Q90 30, 80 50 Q70 70, 50 80 Q40 90, 30 70 Z" fill="#E0E0E0" stroke="#000" strokeWidth="3"/>
    </svg>
);

const ScissorsIcon = () => (
    <svg width="100" height="180" viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
        <circle cx="65" cy="30" r="10" fill="#E0E0E0" stroke="#000" strokeWidth="3"/>
        <circle cx="35" cy="30" r="10" fill="#E0E0E0" stroke="#000" strokeWidth="3"/>
        <line x1="42" y1="35" x2="70" y2="120" stroke="#000" strokeWidth="5"/>
        <line x1="57" y1="35" x2="35" y2="120" stroke="#000" strokeWidth="5"/>
    </svg>
);

const IconDisplay = ({ iconName, match }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, [match]);

    const renderIcon = () => {
        switch (iconName) {
            case "paper":
                return <PaperIcon />;
            case "rock":
                return <RockIcon />;
            case "scissors":
                return <ScissorsIcon />;
            default:
                return null;
        }
    };

    return (
        <div className={`icon-container ${visible ? "zoom-in" : ""}`}>
            {visible && renderIcon()}
        </div>
    );
};

export default IconDisplay;
