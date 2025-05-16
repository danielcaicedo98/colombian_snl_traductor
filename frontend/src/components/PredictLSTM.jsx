// src/components/PredictLSTM.jsx
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const PredictLSTM = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);

    const [message, setMessage] = useState('Pulse "Iniciar LSTM" para comenzar');
    const [label, setLabel] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [translation, setTranslation] = useState('');


    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    const startPredict = async () => {
        // Reset estado
        setLabel(null);
        setMessage('Inicializando cámara…');

        // Pide cámara una sola vez
        if (!streamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            } catch (err) {
                console.error(err);
                setMessage('Error cámara: ' + err.message);
                return;
            }
        }

        setMessage('Recopilando 0/30 frames…');
        setIsRunning(true);

        // Lanza el loop de envío
        intervalRef.current = setInterval(sendFrame, 200);
    };

    const stopPredict = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
    };

    const sendFrame = async () => {
        // Protecciones básicas
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0) return;

        // Dibuja frame
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        try {
            const { data } = await axios.post('http://localhost:5000/predict_lstm/', { image: imageData });

            if (data.status === 'collecting') {
                setMessage(`Recopilando ${data.collected}/30…`);
                // setTranslation(''); // Limpiar traducción mientras recopila
            } else if (data.status === 'predicted') {
                setLabel(data.label);
                setMessage(''); // Ocultar mensaje de recopilación
                setTranslation(`¡Listo! Traducción: ${data.label}`);
                stopPredict();
            }
            else if (data.status === 'error') {
                setMessage('Error backend: ' + data.message);
                stopPredict();
            }
        } catch (err) {
            console.error(err);
            setMessage('Error conectando al backend');
            stopPredict();
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Modo LSTM Gestos</h2>

            {/* Mensaje de traducción arriba del video */}
            {translation && (
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50' }}>
                    {translation}
                </div>
            )}

            <video
                ref={videoRef}
                style={{ width: '480px', background: '#000' }}
                autoPlay
                muted
            />

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Mensaje de recopilación debajo del video */}
            {message && (
                <p style={{ marginTop: '0.5rem', color: '#555' }}>{message}</p>
            )}

            {!isRunning && !label && (
                <button onClick={startPredict}>
                    Iniciar LSTM
                </button>
            )}

            {label && (
                <button onClick={startPredict} style={{ marginTop: '1rem' }}>
                    Reiniciar Predicción
                </button>
            )}
        </div>
    );
};

export default PredictLSTM;
