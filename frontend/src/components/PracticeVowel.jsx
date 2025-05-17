import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/system';

const vowels = ['A', 'E', 'I', 'O', 'U'];

const StyledVideoWrapper = styled(Box)(({ theme }) => ({
  border: `4px solid rgba(29, 99, 227, 0.96)`,
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  backgroundColor: '#000',
  margin: 'auto',
  width: 480,
}));

const PracticeVowels = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState('Haz la seña de la vocal mostrada');
  const [prediction, setPrediction] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    });

    startDetection();

    return () => {
      stopDetection();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [currentIndex]);

  const startDetection = () => {
    stopDetection();
    intervalRef.current = setInterval(captureAndPredict, 1000);
  };

  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureAndPredict = async () => {
    if (isCorrect) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    try {
      const { data } = await axios.post('http://localhost:5000/predict/', { image: imageData });
      setPrediction(data.prediction);

      if (data.prediction === vowels[currentIndex]) {
        setFeedback('¡Muy bien! Hiciste la seña correctamente.');
        setIsCorrect(true);
        stopDetection();
      } else {
        setFeedback('Intenta de nuevo...');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const nextVowel = () => {
    if (currentIndex < vowels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetState();
    }
  };

  const prevVowel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetState();
    }
  };

  const retry = () => {
    resetState();
    startDetection();
  };

  const resetState = () => {
    setPrediction('');
    setFeedback('Haz la seña de la vocal mostrada');
    setIsCorrect(false);
  };

  const currentVowel = vowels[currentIndex];
  const imageSrc = `/vowels/${currentVowel.toLowerCase()}.png`;

  return (
    <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mt: 5, px: 2 }}>
      <Paper elevation={5} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Práctica de Vocales
        </Typography>
        <Typography variant="h6" gutterBottom>
          Haz la seña de la vocal:
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, mb: 3 }}>
          <Typography variant="h1" fontWeight="bold" color="primary">
            {currentVowel}
          </Typography>
          <Box
            component="img"
            src={imageSrc}
            alt={currentVowel}
            sx={{ width: 100, height: 100, borderRadius: 2, boxShadow: 3 }}
          />
        </Box>

        <StyledVideoWrapper>
          <video
            ref={videoRef}
            style={{ width: '100%', transform: 'scaleX(-1)', display: 'block' }}
            autoPlay
            muted
          />
        </StyledVideoWrapper>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          <strong>Traducción:</strong> {prediction || '...'}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ mt: 1, color: isCorrect ? 'success.main' : 'error.main', fontWeight: 'medium' }}
        >
          {feedback}
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" onClick={prevVowel} disabled={currentIndex === 0}>
            Anterior
          </Button>
          <Button variant="outlined" onClick={retry}>
            Intentar de nuevo
          </Button>
          <Button variant="contained" onClick={nextVowel} disabled={!isCorrect}>
            Siguiente
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PracticeVowels;
