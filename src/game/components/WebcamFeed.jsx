import React, { forwardRef, useEffect } from 'react';

const WebcamFeed = forwardRef((props, ref) => {
    useEffect(() => {
        async function setupCamera() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (ref.current) {
                ref.current.srcObject = stream;
                await ref.current.play();
            }
        }
        setupCamera();
    }, [ref]);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
            <video
                ref={ref}
                width="640"
                height="480"
                style={{ width: '100%', height: 'auto', display: 'block', border: '2px solid' }}
                playsInline
            />
        </div>
    );
});

export default WebcamFeed;
