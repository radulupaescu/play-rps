import React from 'react';

const DebugConsole = ({ messages }) => {
    return (
        <div className="debug-console">
            {messages.slice(0).reverse().map((msg, index) => (
                <div key={index} className="debug-message">
                    {msg}
                </div>
            ))}
        </div>
    );
};

export default DebugConsole;
