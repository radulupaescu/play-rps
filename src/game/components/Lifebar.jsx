import React from 'react';

const Lifebar = ({ label, state, alignment }) => {
    return (
        <div className={`lifebar-container ${alignment}`}>
            <span className="label doto-extra-bold">{label}</span>
            <div className="progress-bar">
                <div
                    className="progress"
                    style={{
                        width: `${state.remaining * 100}%`,
                        float: alignment === 'right' ? 'right' : 'left',
                    }}
                ></div>
            </div>
            <span className={`score doto-extra-bold`} style={{ alignSelf: alignment === 'right' ? 'flex-end' : 'flex-start', }}>Score {state.score}</span>
        </div>
    );
};

export default Lifebar;
