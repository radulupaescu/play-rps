import React, { forwardRef, useEffect } from 'react';

const WebcamFeed = forwardRef((props, ref) => {
    useEffect(() => {
        async function setupCamera() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (ref.current) {
                ref.current.srcObject = stream;
                ref.current.play();
            }
        }
        setupCamera();
    }, [ref]);

    return (
        <div>
            <video ref={ref} width={640} height={480} style={{ border: '1px solid #ccc' }} />
        </div>
    );
});

export default WebcamFeed;
