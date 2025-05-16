// src/App.js
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Predict from './components/Predict';
import Capture from './components/Capture';
import PredictLSTM from './components/PredictLSTM';
import PracticeVowels from './components/PracticeVowel';
import PracticeSequences from './components/PracticeSequences';
import PredictRightHand from './components/PredictRightHand';
import PracticeRightHandSequences from './components/PracticeRightHandSequence';

function App() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Hand Gesture App</h1>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/predict')} style={{ marginRight: '1rem' }}>
          Predecir (estático)
        </button>
        <button onClick={() => navigate('/predictrighthand')} style={{ marginLeft: '1rem' }}>
          Predecir Numeros
        </button>
        <button onClick={() => navigate('/predict_lstm')}>
          Predecir LSTM
        </button>
        <button onClick={() => navigate('/capture')} style={{ marginRight: '1rem' }}>
          Capturar Datos
        </button>        
        <button onClick={() => navigate('/practicevowel')} style={{ marginLeft: '1rem' }}>
          Práctica de Vocales
        </button>
        <button onClick={() => navigate('/practicegestures')} style={{ marginLeft: '1rem' }}>
          Práctica de Gestos
        </button>        
        <button onClick={() => navigate('/practicerighthand')} style={{ marginLeft: '1rem' }}>
          Práctica de Numeros
        </button> 
      </div>

      <Routes>
        <Route path="/predict" element={<Predict />} />
        <Route path="/practicevowel" element={<PracticeVowels />} />
        <Route path="/practicegestures" element={<PracticeSequences />} />
        <Route path="/predictrighthand" element={<PredictRightHand />} />
        <Route path="/practicerighthand" element={<PracticeRightHandSequences />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/predict_lstm" element={<PredictLSTM />} />
        <Route path="*" element={<p>Selecciona una opción arriba</p>} />
      </Routes>
    </div>
  );
}

export default App;
