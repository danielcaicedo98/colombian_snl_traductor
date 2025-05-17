import base64
import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp
from flask import Blueprint, request, jsonify
from collections import deque
import os

# Blueprint
lstm_bp = Blueprint('lstm_bp', __name__)


# Ruta absoluta del directorio actual (donde está este archivo .py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Rutas absolutas a los archivos
MODEL_PATH = os.path.join(BASE_DIR, "lstm_gesture_model.h5")
LABEL_MAP_PATH = os.path.join(BASE_DIR, "gesture_label_map.npy")

# Cargar los archivos
lstm_model = tf.keras.models.load_model(MODEL_PATH)
gesture_labels = np.load(LABEL_MAP_PATH, allow_pickle=True).item()

# # Carga modelo LSTM y label_map
# lstm_model     = tf.keras.models.load_model("lstm_gesture_model.h5")
# gesture_labels = np.load("gesture_label_map.npy", allow_pickle=True).item()

# Configura MediaPipe Holistic
mp_holistic = mp.solutions.holistic
holistic    = mp_holistic.Holistic(
    static_image_mode=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Deque global de 30 frames
sequence = deque(maxlen=30)

def extract_holistic_keypoints(results):
    # Pose (landmarks 11-16): x,y,z,visibility → 6×4=24
    pose = []
    if results.pose_landmarks:
        for idx in [11,12,13,14,15,16]:
            lm = results.pose_landmarks.landmark[idx]
            pose += [lm.x, lm.y, lm.z, lm.visibility]
    else:
        pose = [0.0]*24

    # Manos derecha/izquierda (21 puntos each × 3 coords = 63)
    def hand_to_list(hand_landmarks):
        if hand_landmarks:
            return [v for lm in hand_landmarks.landmark for v in (lm.x, lm.y, lm.z)]
        return [0.0]*63

    right = hand_to_list(results.right_hand_landmarks)
    left  = hand_to_list(results.left_hand_landmarks)

    return np.array(pose + right + left)

@lstm_bp.route('/', methods=['POST'])
def predict_lstm():
    try:
        data    = request.json
        img_b64 = data['image'].split(',')[1]
        nparr   = np.frombuffer(base64.b64decode(img_b64), np.uint8)
        img     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = holistic.process(img_rgb)

        # Extrae y apila keypoints
        keypts = extract_holistic_keypoints(results)
        sequence.append(keypts)

        if len(sequence) < 30:
            return jsonify({
                'status':    'collecting',
                'collected': len(sequence),
                'needed':    30
            })

        # Secuencia completa → predicción
        seq_arr   = np.expand_dims(np.array(sequence), axis=0)
        preds     = lstm_model.predict(seq_arr)
        class_id  = int(np.argmax(preds))
        label     = next(k for k,v in gesture_labels.items() if v == class_id)

        # **Limpia el deque para la próxima ronda**
        sequence.clear()

        return jsonify({'status': 'predicted', 'label': label})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
