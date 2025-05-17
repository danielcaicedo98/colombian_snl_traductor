import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/system';

const sequences = [
    { label: 'hola', video: '/sequences/hola.mp4' },
    { label: 'gracias', video: '/sequences/gracias.mp4' },
    { label: 'comoestas', video: '/sequences/como_estas.mp4' }
];

const VideoWrapper = styled(Box)(({ theme }) => ({
    border: `3px solid rgba(29, 99, 227, 0.96)`,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backgroundColor: '#000',
    width: 320,
    height: 240,
}));

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
        setMsgCorrect('');
        setIsRecopiled(false);

        if (!streamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
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

                if (data.label.toLowerCase() === currentSequence.label.toLowerCase()) {
                    setIsCorrect(true);
                    stopDetection();
                    setMsgCorrect('¡Correcto! Buen trabajo.');
                    setIsRecopiled(true);
                    setMessage('');
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
            resetState();
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            resetState();
        }
    };

    const resetState = () => {
        setMsgCorrect('');
        setPrediction('');
        setIsCorrect(false);
        setMessage('');
        setIsRecopiled(false);
    };

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', mt: 6, px: 2, textAlign: 'center' }}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Práctica de Gestos
                </Typography>
                <Typography variant="h5" mb={2}>
                    Haz la secuencia: <strong>{currentSequence.label}</strong>
                </Typography>
                {msgCorrect && (
                    <Typography variant="h6" color="success.main" mb={2}>
                        {msgCorrect}
                    </Typography>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 5,
                        mb: 3,
                        // flexWrap: 'wrap',
                    }}
                >
                    <VideoWrapper>
                        <video
                            src={currentSequence.video}
                            controls
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                    </VideoWrapper>
                    <VideoWrapper>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            style={{ width: '100%', height: '100%', transform: 'scaleX(-1)', display: 'block' }}
                        />
                    </VideoWrapper>


                </Box>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {message && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {message}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                    {!isRunning && !isCorrect && (
                        <Button variant="contained" onClick={startDetection}>
                            Iniciar Secuencia
                        </Button>
                    )}
                    <Button variant="outlined" onClick={retry} disabled={!isCorrect && !isRunning}>
                        Repetir
                    </Button>
                    <Button
                        variant="contained"
                        onClick={next}
                        disabled={!isCorrect || currentIndex === sequences.length - 1}
                    >
                        Siguiente
                    </Button>
                    <Button variant="outlined" onClick={prev} disabled={currentIndex === 0}>
                        Anterior
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default PracticeSequences;
