// src/components/Predict.js
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const Predict = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState('Esperando...');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    });

    const interval = setInterval(() => {
      captureAndPredict();
    }, 1000);

    return () => {
      clearInterval(interval);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const captureAndPredict = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    try {
      const { data } = await axios.post('http://localhost:5000/predict/', { image: imageData });
      setPrediction(data.prediction);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Modo Predicción</h2>
      <video ref={videoRef} style={{ width: '480px' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p><strong>Predicción:</strong> {prediction}</p>
    </div>
  );
};

export default Predict;
