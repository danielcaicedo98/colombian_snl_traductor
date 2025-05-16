import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const vowels = ['A', 'E', 'I', 'O', 'U'];

const PracticeVowels = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState('Haz la seña de la vocal mostrada');
  const [prediction, setPrediction] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    });

    startDetection();

    return () => {
      stopDetection();
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, [currentIndex]);

  const startDetection = () => {
    stopDetection();
    intervalRef.current = setInterval(() => {
      captureAndPredict();
    }, 1000);
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
    }
    resetState();
  };

  const prevVowel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    resetState();
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
    <div style={{ textAlign: 'center' }}>
      <h2>Práctica de Vocales</h2>
      <h3>Haz la seña de la vocal:</h3>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '64px' }}>{currentVowel}</div>
        <img src={imageSrc} alt={currentVowel} style={{ width: '100px', height: '100px' }} />
      </div>

      <video ref={videoRef} style={{ width: '480px' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p><strong>Predicción:</strong> {prediction}</p>
      <p style={{ color: isCorrect ? 'green' : 'red' }}>{feedback}</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={prevVowel} disabled={currentIndex === 0}>Anterior</button>
        <button onClick={retry}>Intentar de nuevo</button>
        <button onClick={nextVowel} disabled={!isCorrect}>Siguiente</button>
      </div>
    </div>
  );
};

export default PracticeVowels;
