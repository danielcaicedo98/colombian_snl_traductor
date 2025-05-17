import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/system';

const items = [
  { label: '1', type: 'static' },
  { label: '2', type: 'static' },
  { label: '3', type: 'static' },
  { label: '4', type: 'static' },
  { label: '6', type: 'dynamic', video: '/numbers/6.mp4' },
  { label: '7', type: 'dynamic', video: '/numbers/7.mp4' },
  { label: '8', type: 'dynamic', video: '/numbers/8.mp4' },
  { label: '9', type: 'dynamic', video: '/numbers/9.mp4' },
];

const VideoWrapper = styled(Box)(({ theme }) => ({
  border: `3px solid rgba(29, 99, 227, 0.96)`,
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  backgroundColor: '#000',
  width: 320,
  height: 240,
}));

const ImgWrapper = styled(Box)(({ theme }) => ({
  border: `3px solid rgba(29, 99, 227, 0.96)`,
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  width: 120,
  height: 120,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
}));

const PracticeNumbers = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [message, setMessage] = useState('Haz la seña del número mostrado');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (currentItem.type === 'static') {
      startStaticDetection();
    } else {
      reset();
    }

    return () => {
      stopDetection();
      stopStream();
    };
  }, [currentIndex]);

  const startStaticDetection = async () => {
    stopDetection();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      intervalRef.current = setInterval(captureAndPredictStatic, 1000);
      setIsRunning(true);
      setMessage('Haz la seña del número mostrado');
    } catch (err) {
      console.error(err);
      setMessage('Error al acceder a la cámara');
    }
  };

  const captureAndPredictStatic = async () => {
    if (isCorrect || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const { data } = await axios.post('http://localhost:5000/predict_static/', { image: imageData });
      setPrediction(data.prediction);
      if (data.prediction === currentItem.label) {
        setMessage('¡Muy bien! Hiciste la seña correctamente.');
        setIsCorrect(true);
        stopDetection();
        setIsRunning(false);
      } else {
        setMessage('Intenta de nuevo...');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al predecir la seña');
    }
  };

  const captureAndPredictDynamic = async () => {
    if (!videoRef.current || isCorrect) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const res = await axios.post('http://localhost:5000/predict_lstm_right/', { image: imageData });
      const data = res.data;

      if (data.status === 'collecting') {
        setMessage(`Recopilando ${data.collected}/50…`);
      } else if (data.status === 'predicted') {
        if (data.label.toLowerCase() === currentItem.label.toLowerCase()) {
          setMessage('¡Correcto! Buen trabajo.');
          setIsCorrect(true);
          stopDetection();
          setIsRunning(false);
        } else {
          setMessage(`Predicción: ${data.label}. Intenta de nuevo.`);
        }
      } else if (data.status === 'error') {
        setMessage('❌ Error: ' + data.message);
        stopDetection();
        setIsRunning(false);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al conectar con el backend');
    }
  };

  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const startDynamicSession = async () => {
    setIsCorrect(false);
    setMessage('Inicializando cámara...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsRunning(true);
      intervalRef.current = setInterval(captureAndPredictDynamic, 200);
      setMessage('Recopilando 0/50…');
    } catch (err) {
      setMessage('Error al acceder a la cámara');
      console.error(err);
    }
  };

  const next = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      reset();
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      reset();
    }
  };

  const retry = () => {
    reset();
    if (currentItem.type === 'static') {
      startStaticDetection();
    } else {
      startDynamicSession();
    }
  };

  const reset = () => {
    setPrediction('');
    setMessage('Haz la seña del número mostrado');
    setIsCorrect(false);
    setIsRunning(false);
    stopDetection();
    stopStream();
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', mt: 6, px: 2, textAlign: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Práctica de Números en Lengua de Señas
        </Typography>
        <Typography variant="h8" mb={2}>
          Haz la seña del número: <strong>{currentItem.label}</strong>
        </Typography>

        {isCorrect && (
          <Typography variant="h6" color="success.main" mb={2}>
            ✅ ¡Correcto!
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
            mb: 3,
            alignItems: 'center',
            flexWrap: 'nowrap',        // <-- evitar que se envuelvan
          }}
        >
          <VideoWrapper>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ width: '320px', height: '240px', transform: 'scaleX(-1)', display: 'block' }}
            />
          </VideoWrapper>

          {currentItem.type === 'static' ? (
            <ImgWrapper>
              <img
                src={`/numbers/${currentItem.label}.png`}
                alt={currentItem.label}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </ImgWrapper>
          ) : (
            <VideoWrapper>
              <video
                src={currentItem.video}
                controls
                style={{ width: '320px', height: '240px', display: 'block' }}
              />
            </VideoWrapper>
          )}
        </Box>


        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Traducción:</strong> {prediction || '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {!isRunning && !isCorrect && currentItem.type === 'dynamic' && (
            <Button variant="contained" onClick={startDynamicSession}>
              Iniciar Secuencia
            </Button>
          )}
          <Button variant="outlined" onClick={prev} disabled={currentIndex === 0}>
            Anterior
          </Button>
          <Button variant="outlined" onClick={retry}>Reintentar</Button>
          <Button variant="contained" onClick={next} disabled={!isCorrect || currentIndex === items.length - 1}>
            Siguiente
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PracticeNumbers;
