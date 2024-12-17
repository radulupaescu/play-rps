import React, { useEffect, useRef, useState } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs';
import WebcamFeed from './WebcamFeed';
import Lifebar from './Lifebar';
import DebugConsole from './DebugConsole';
import TransparentOverlay from './TransparentOverlay';
import IconDisplay from "./Icon";

const GESTURES = ['rock', 'paper', 'scissors'];
const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20]
];

// Game states:
// 'loading' -> models loading
// 'waiting_to_start' -> show "Show PAPER to start"
// 'transitioning_to_countdown' -> 1s cooldown after showing PAPER, then start countdown
// 'countdown' -> "Ready!" -> "3" -> "2" -> "1" -> "Show!"
// 'too_fast' -> user showed gesture before "Show!"
// 'show_result' -> show final result, then back to 'waiting_to_start'
const App = () => {
    const [model, setModel] = useState(null);
    const [handposeModel, setHandposeModel] = useState(null);
    const [result, setResult] = useState(null);
    const [gameState, setGameState] = useState('loading');
    const [countdownStage, setCountdownStage] = useState(null);
    const [prematureGesture, setPrematureGesture] = useState(null);
    const [log, setLog] = useState([]);
    const [playerLife, setPlayerLife] = useState(1);
    const [playerScore, setPlayerScore] = useState(0);
    const [computerLife, setComputerLife] = useState(1);
    const [computerScore, setComputerScore] = useState(0);
    const [playerIcon, setPlayerIcon] = useState(null);
    const [computerIcon, setComputerIcon] = useState(null);
    const [match, setMatch] = useState(0);


    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const modelLoadedRef = useRef(false);
    const currentGameStateRef = useRef(gameState);
    const countdownStageStateRef = useRef(countdownStage);
    const logRef = useRef(log);

    useEffect(() => {
        logRef.current = log;
    }, [log]);

    useEffect(() => {
        currentGameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        countdownStageStateRef.current = countdownStage;
    }, [countdownStage]);

    useEffect(() => {
        if (modelLoadedRef.current) { return; }
        modelLoadedRef.current = true;

        const loadModels = async () => {
            setLog([...logRef.current, 'Loading models...']);

            const hpModel = await handpose.load();
            setLog([...logRef.current, 'Hand Pose model loaded!']);
            setHandposeModel(hpModel);

            const classifier = await tf.loadLayersModel('./rps-classifier/model.json');
            setLog([...logRef.current, 'Rock Paper Scissors classifier loaded!']);
            setModel(classifier);
        };

        loadModels();
    }, []);

    // bind "main loop"
    useEffect(() => {
        if (!handposeModel || !model || !videoRef.current) {
            return;
        }

        const resizeCanvas = () => {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
        };

        if (videoRef.current.readyState >= 1) {
            resizeCanvas();
        } else {
            videoRef.current.addEventListener('loadedmetadata', resizeCanvas);
        }

        // "main loop"
        const intervalId = setInterval(async () => {
            const predictions = await handposeModel.estimateHands(videoRef.current);
            drawHandKeypoints(predictions);

            if (currentGameStateRef.current === 'loading' && model && handposeModel) {
                setGameState('waiting_to_start');
            }

            // we "see" a hand
            if (predictions.length > 0) {
                const userGesture = await predictGesture(predictions[0].landmarks);

                if (currentGameStateRef.current === 'waiting_to_start' && userGesture === 'paper') { // start the round
                    setGameState('transitioning_to_countdown');
                } else if ( // is it too soon?
                    currentGameStateRef.current === 'countdown'          // We're in countdown mode
                    && countdownStageStateRef.current                    // the counter state is defined
                    && countdownStageStateRef.current !== 'show'         // but not the last stage (show)
                    && ['rock','paper','scissors'].includes(userGesture) // and the user has jumped the gun
                ) {
                    setPrematureGesture(userGesture);
                    setGameState('too_fast');
                }
            }
        }, 100);

        return () => {
            clearInterval(intervalId);
            videoRef.current.removeEventListener('loadedmetadata', resizeCanvas);
        };
    }, [handposeModel, model, gameState]);

    // Cool down before starting countdown;
    // otherwise the "paper" shown is interpreted as the user's pick
    useEffect(() => {
        if (currentGameStateRef.current === 'transitioning_to_countdown') {
            const timer = setTimeout(() => { startCountdown(); }, 1000);

            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Handle premature gesture
    useEffect(() => {
        if (currentGameStateRef.current === 'too_fast' && prematureGesture) {

            if (playerLife > 0.21) {
                setPlayerLife(playerLife - 0.2);
            } else {
                setPlayerLife(1);
                setComputerScore(computerScore + 1);
            }

            setResult({
                userGesture: prematureGesture,
                computerGesture: pickWinningGesture(prematureGesture),
                outcome: 'Too fast!',
            });

            setPlayerIcon(prematureGesture);
            setComputerIcon(pickWinningGesture(prematureGesture));
            setMatch(match + 1);

            setPrematureGesture(null);
            setGameState('show_result');
        }
    }, [gameState, prematureGesture]);

    // Handle match
    useEffect(() => {
        if (currentGameStateRef.current === 'show_result' && result) {
            const timer = setTimeout(() => {
                setResult(null);
                setGameState('waiting_to_start');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [gameState, result]);

    const startCountdown = () => {
        setGameState('countdown');
        runCountdownSequence();
    };

    const runCountdownSequence = async () => {
        setCountdownStage('3');
        await delay(1000);

        setCountdownStage('2');
        await delay(1000);

        setCountdownStage('1');
        await delay(1000);

        setCountdownStage('show');
        await delay(500); // This delay is for the user to see otherwise the state is suddenly changed.
        setLog([ ...logRef.current, `Game state: ${currentGameStateRef.current}` ]);

        // Only handle final gesture if we're still in countdown and not "too_fast"
        if (currentGameStateRef.current === 'countdown') {
            handleShowGesture();
        }
    };

    const handleShowGesture = async () => {
        if (!handposeModel || !model || !videoRef.current) {
            return;
        }

        const predictions = await handposeModel.estimateHands(videoRef.current);
        let userGesture = null;
        if (predictions.length > 0) {
            userGesture = await predictGesture(predictions[0].landmarks);
        }

        if (!userGesture) {
            setResult({ userGesture: null, computerGesture: null, outcome: 'No hand detected!' });
        } else {
            // random computer gesture here, to prove the game is not rigged. :)
            const computerGesture = GESTURES[Math.floor(Math.random() * GESTURES.length)];
            setLog([ ...logRef.current, `User gesture at show: ${userGesture}`, `Computer gesture at show: ${computerGesture}` ]);

            const outcome = computeResult(userGesture, computerGesture);

            setResult({ userGesture, computerGesture, outcome });
            setPlayerIcon(userGesture);
            setComputerIcon(computerGesture);
            setMatch(match + 1);
        }

        setGameState('show_result');
    };

    const normalizeKeypoints = (keypoints) => {
        const reshaped = [];
        for (let i = 0; i < keypoints.length; i += 3) {
            reshaped.push([keypoints[i], keypoints[i + 1], keypoints[i + 2]]);
        }

        const meanX = reshaped.reduce((sum, kp) => sum + kp[0], 0) / reshaped.length;
        const meanY = reshaped.reduce((sum, kp) => sum + kp[1], 0) / reshaped.length;

        return reshaped
            .map(kp => [kp[0] - meanX, kp[1] - meanY])
            .flat();
    };

    const predictGesture = async (landmarks) => {
        const keypoints = normalizeKeypoints(landmarks.flat());
        if (!keypoints) {
            return null;
        }

        const inputTensor = tf.tensor2d([keypoints]);
        const prediction = model.predict(inputTensor);
        const gestureIndex = prediction.argMax(-1).dataSync()[0];

        return GESTURES[gestureIndex];
    };

    const computeResult = (userGesture, computerGesture) => {
        if (userGesture === computerGesture) return 'Draw';

        if (
            (userGesture === 'rock' && computerGesture === 'scissors') ||
            (userGesture === 'paper' && computerGesture === 'rock') ||
            (userGesture === 'scissors' && computerGesture === 'paper')
        ) {
            if (computerLife > 0.21) {
                setComputerLife(computerLife - 0.2);
            } else {
                setComputerLife(1);
                setPlayerScore(playerScore + 1);
            }

            return 'You WIN!';
        }

        if (playerLife > 0.21) {
            setPlayerLife(playerLife - 0.2);
        } else {
            setPlayerLife(1);
            setComputerScore(computerScore + 1);
        }

        return 'You LOSE!';
    };

    // If the user jumped the gun, the computer will pick whichever gesture earns a point.
    const pickWinningGesture = (userGesture) => {
        if (userGesture === 'rock') { return 'paper'; }
        if (userGesture === 'paper') { return 'scissors'; }
        if (userGesture === 'scissors') { return 'rock'; }
    };

    const drawHandKeypoints = (predictions) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (predictions.length > 0) {
            predictions.forEach((prediction) => {
                const landmarks = prediction.landmarks;

                // Draw segments
                HAND_CONNECTIONS.forEach(([start, end]) => {
                    const [x1, y1] = landmarks[start];
                    const [x2, y2] = landmarks[end];
                    drawLine(ctx, x1, y1, x2, y2, 'green', 2);
                });

                // Draw points
                for (let i = 0; i < landmarks.length; i++) {
                    const [x, y] = landmarks[i];
                    drawPoint(ctx, x, y, 5, 'red');
                }
            });
        }
    };

    const drawPoint = (ctx, x, y, radius, color) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    };

    const drawLine = (ctx, x1, y1, x2, y2, color, width=2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // Determine overlay text
    let overlayText = '';
    switch (gameState) {
        case 'loading':
            overlayText = 'Loading models...';
            break;
        case 'waiting_to_start':
            overlayText = 'Show PAPER to start';
            break;
        case 'transitioning_to_countdown':
            overlayText = 'Get READY!';
            break;
        case 'countdown':
            switch (countdownStage) {
                case '3':
                    overlayText = '3';
                    break;
                case '2':
                    overlayText = '2';
                    break;
                case '1':
                    overlayText = '1';
                    break;
                case 'show':
                    overlayText = 'Show!';
                    break;
            }
            break;
        case 'too_fast':
            overlayText = 'TOO FAST!';
            break;
        case 'show_result':
            if (result) {
                overlayText = `${result.outcome}`;
            }
            break;
    }

    return (
        <div className="main-container">
            <h1 className="title rock-3d-regular">Rock Paper Scissors Showdown</h1>
            <div className="game-layout">
                <div className="lifebars">
                    <Lifebar label="PLAYER 1" state={{
                        remaining: playerLife,
                        score: playerScore,
                    }} alignment="left" />
                    <span className="vs">VS</span>
                    <Lifebar label="COMPUTER" state={{
                        remaining: computerLife,
                        score: computerScore,
                    }} alignment="right" />
                </div>

                <div className={'icons-overlay'}>
                    <div className="left-icon">
                        { playerIcon && <IconDisplay iconName={playerIcon} match={match} /> }
                    </div>
                    <div className="right-icon">
                        { computerIcon && <IconDisplay iconName={computerIcon} match={match} /> }
                    </div>
                </div>

                <div className="video-stream">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <WebcamFeed ref={videoRef} />
                        <canvas
                            ref={canvasRef}
                            // style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}
                        />
                    </div>
                </div>
                <TransparentOverlay text={overlayText} />
                <span className={'log-label'}>Log (for debugging): </span>
                <DebugConsole messages={log} />
            </div>
            <footer className="footer">Made with &#129504; and &#128400; by Radu Lupaescu in December 2024.</footer>
        </div>
    );
};

export default App;
