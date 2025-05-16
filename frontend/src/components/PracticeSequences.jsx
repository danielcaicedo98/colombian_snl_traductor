// src/components/PracticeSequences.jsx
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const sequences = [
    { label: 'hola', video: '/sequences/hola.mp4' },
    { label: 'gracias', video: '/sequences/gracias.mp4' },
    { label: 'comoestas', video: '/sequences/como_estas.mp4' }
];

const PracticeSequences = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [prediction, setPrediction] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [msgCorrect, setMsgCorrect] = useState('');
    const [isRecopiled, setIsRecopiled] = useState(false);

    const currentSequence = sequences[currentIndex];

    useEffect(() => {
        return () => {
            stopDetection();
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    const startDetection = async () => {
        setPrediction('');
        setMessage(!isRecopiled ? `Recopilando 0/30 frames para "${currentSequence.label}"...` : '');
        setIsCorrect(false);

        if (!streamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            } catch (err) {
                console.error(err);
                setMessage('Error accediendo a la cámara');
                return;
            }
        }

        setIsRunning(true);
        intervalRef.current = setInterval(sendFrame, 200);
    };

    const stopDetection = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
    };

    const sendFrame = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        try {
            const { data } = await axios.post('http://localhost:5000/predict_lstm/', { image: imageData });

            if (data.status === 'collecting' && !isRecopiled) {
                setMessage(`Recopilando ${data.collected}/30…`);
            } else if (data.status === 'predicted') {
                setPrediction(data.label);
                // setMessage('');

                if (data.label.toLowerCase() === currentSequence.label.toLowerCase()) {
                    setIsCorrect(true);
                    stopDetection();
                    setMsgCorrect('¡Correcto! Buen trabajo.');
                    setIsRecopiled(true);
                    setMessage('');
                    //   alert('¡Correcto! Buen trabajo.');
                } else {
                    setMessage(`Predicción: ${data.label}. Intenta de nuevo.`);
                }
            } else if (data.status === 'error') {
                setMessage('Error desde el backend: ' + data.message);
                stopDetection();
            }
        } catch (err) {
            console.error(err);
            setMessage('Error conectando al backend');
            stopDetection();
        }
    };

    const retry = () => {
        startDetection();
    };

    const next = () => {
        if (currentIndex < sequences.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setMsgCorrect('');
            setPrediction('');
            setIsCorrect(false);
            setMessage('');
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setPrediction('');
            setIsCorrect(false);
            setMessage('');
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Práctica de Secuencias</h2>
            <h3>Haz la secuencia: <strong>{currentSequence.label}</strong></h3>
            <h3 style={{ color: 'green' }}>{msgCorrect}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '20px' }}>
                <video ref={videoRef} autoPlay muted style={{ width: '320px', backgroundColor: '#000' }} />
                <video src={currentSequence.video} controls style={{ width: '320px' }} />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {message && <p>{message}</p>}
            {/* {prediction && <p>Predicción: <strong>{prediction}</strong></p>} */}

            <div style={{ marginTop: '20px' }}>
                {!isRunning && !isCorrect && (
                    <button onClick={startDetection}>Iniciar Secuencia</button>
                )}
                {/* {isCorrect && (
          <button onClick={retry}>Intentar de nuevo</button>
        )} */}
                <br /><br />
                <button onClick={prev} disabled={currentIndex === 0}>Anterior</button>
                <button onClick={retry}>Repetir</button>
                <button onClick={next} disabled={!isCorrect || currentIndex === sequences.length - 1}>Siguiente</button>
            </div>
        </div>
    );
};

export default PracticeSequences;
