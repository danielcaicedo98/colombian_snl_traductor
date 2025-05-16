import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const PredictRightHand = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [message, setMessage] = useState('Pulsa "Iniciar Predicción"');
  const [label, setLabel] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [translation, setTranslation] = useState('');

  const stopSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
  };

  const sendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || label) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const res = await axios.post('http://localhost:5000/predict_lstm_right/', {
        image: imageData
      });

      const data = res.data;

      if (data.status === 'collecting') {
        setMessage(`Recopilando ${data.collected}/50…`);
      } else if (data.status === 'predicted') {
        setLabel(data.label);
        setMessage(`✅ Traducción: ${data.label}`);
        setTranslation(`¡Listo! Traducción: ${data.label}`);
        stopSession(); // detener al completar predicción
      } else if (data.status === 'error') {
        setMessage('❌ Error: ' + data.message);
        stopSession();
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error al conectar al backend');
      stopSession();
    }
  };

  const startSession = async () => {
    stopSession(); // reiniciar todo
    setLabel(null);
    setMessage('Inicializando cámara…');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      // Esperar a que el videoRef esté montado
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRunning(true);
        setMessage('Recopilando 0/50…');
        intervalRef.current = setInterval(sendFrame, 200); // cada 200ms
      } else {
        setMessage('Error: cámara no inicializada.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al acceder a la cámara: ' + err.message);
    }
  };

  useEffect(() => {
    return () => stopSession(); // limpiar al desmontar
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Reconocimiento con Mano Derecha (LSTM 50 frames)</h2>
      {translation && (
        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50' }}>
          {translation}
        </div>
      )}

      <video ref={videoRef} style={{ width: '480px', marginBottom: '10px' }} />

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <p>{message}</p>

      <button onClick={startSession}>
        {isRunning ? 'Reiniciar' : 'Iniciar Predicción'}
      </button>
    </div>
  );
};

export default PredictRightHand;
