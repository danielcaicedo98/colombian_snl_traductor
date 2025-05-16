// src/components/PracticeRightHandSequences.jsx
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const sequences = [
  { label: '6', video: '/sequences/hola.mp4' },
  { label: '7', video: '/sequences/gracias.mp4' },
  { label: '9', video: '/sequences/como_estas.mp4' },
  { label: '10', video: '/sequences/como_estas.mp4' },

];

const PracticeRightHandSequences = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [msgCorrect, setMsgCorrect] = useState('');

  const currentSequence = sequences[currentIndex];

  useEffect(() => {
    return () => stopSession();
  }, []);

  const stopSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    setIsRunning(false);
  };

  const sendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || isCorrect) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const res = await axios.post('http://localhost:5000/predict_lstm_right/', { image: imageData });
      const data = res.data;

      if (data.status === 'collecting') {
        setMessage(`Recopilando ${data.collected}/50…`);
      } else if (data.status === 'predicted') {
        setLabel(data.label);
        if (data.label.toLowerCase() === currentSequence.label.toLowerCase()) {
          setIsCorrect(true);
          setMsgCorrect('¡Correcto! Buen trabajo.');
          setMessage('');
          stopSession();
        } else {
          setMessage(`Predicción: ${data.label}. Intenta de nuevo.`);
        }
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
    stopSession();
    setLabel(null);
    setIsCorrect(false);
    setMsgCorrect('');
    setMessage('Inicializando cámara…');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRunning(true);
        setMessage('Recopilando 0/50…');
        intervalRef.current = setInterval(sendFrame, 200);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al acceder a la cámara: ' + err.message);
    }
  };

  const retry = () => {
    startSession();
  };

  const next = () => {
    if (currentIndex < sequences.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetStates();
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetStates();
    }
  };

  const resetStates = () => {
    setLabel(null);
    setIsCorrect(false);
    setMsgCorrect('');
    setMessage('');
    setIsRunning(false);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Práctica Mano Derecha</h2>
      <h3>Haz la secuencia: <strong>{currentSequence.label}</strong></h3>
      <h3 style={{ color: 'green' }}>{msgCorrect}</h3>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
        <video ref={videoRef} autoPlay muted style={{ width: '320px', backgroundColor: '#000' }} />
        <video src={currentSequence.video} controls style={{ width: '320px' }} />
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {message && <p>{message}</p>}

      <div style={{ marginTop: '20px' }}>
        {!isRunning && !isCorrect && (
          <button onClick={startSession}>Iniciar Secuencia</button>
        )}
        <br /><br />
        <button onClick={prev} disabled={currentIndex === 0}>Anterior</button>
        <button onClick={retry}>Repetir</button>
        <button onClick={next} disabled={!isCorrect || currentIndex === sequences.length - 1}>Siguiente</button>
      </div>
    </div>
  );
};

export default PracticeRightHandSequences;
