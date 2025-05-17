from collections import deque
import cv2
import mediapipe as mp
import numpy as np
import time
import os


mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic()
mp_drawing = mp.solutions.drawing_utils

SAVE_DIR = "sequences/gracias"  # Cambia según el gesto
os.makedirs(SAVE_DIR, exist_ok=True)
cap = cv2.VideoCapture(0)
sequence = deque(maxlen=50)  # 50 frames por secuencia
seq_count = 0

def extract_keypoints(results):
    pose = []
    if results.pose_landmarks:
        for i, lm in enumerate(results.pose_landmarks.landmark):
            if i in [11, 12, 13, 14, 15, 16]:
                pose.extend([lm.x, lm.y, lm.z, lm.visibility])
    else:
        pose.extend([0]*24)

    right_hand = []
    if results.right_hand_landmarks:
        for lm in results.right_hand_landmarks.landmark:
            right_hand.extend([lm.x, lm.y, lm.z])
    else:
        right_hand.extend([0]*63)

    left_hand = []
    if results.left_hand_landmarks:
        for lm in results.left_hand_landmarks.landmark:
            left_hand.extend([lm.x, lm.y, lm.z])
    else:
        left_hand.extend([0]*63)

    return np.array(pose + right_hand + left_hand)



while True:
    
    if seq_count >= 30:
        print("Se alcanzaron las 30 secuencias. Finalizando captura.")
        break
    
    ret, frame = cap.read()
    if not ret:
        break

    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(image_rgb)

    mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
    mp_drawing.draw_landmarks(frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
    mp_drawing.draw_landmarks(frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

    keypoints = extract_keypoints(results)
    sequence.append(keypoints)

    # Mostrar cuenta regresiva de 5 a 0 (cada 10 frames)
    remaining_blocks = (50 - len(sequence)) // 10
    cv2.putText(frame, f"Cuenta regresiva: {remaining_blocks}", (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3, cv2.LINE_AA)

    if len(sequence) == 50:
        np.save(os.path.join(SAVE_DIR, f"seq_{seq_count}.npy"), np.array(sequence))
        print(f"Guardada secuencia {seq_count}")
        seq_count += 1
        sequence.clear()

        # Mostrar cuenta regresiva de 3 segundos antes de siguiente secuencia
        for i in range(2, 0, -1):
            ret, frame = cap.read()
            if not ret:
                break
            cv2.putText(frame, f"Iniciando en: {i}", (100, 200),
                        cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 0), 4, cv2.LINE_AA)
            cv2.imshow("Captura de secuencias", frame)
            cv2.waitKey(1000)  # Espera 1 segundo

        continue  # Volver al bucle para capturar nueva secuencia

    cv2.imshow("Captura de secuencias", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

cap.release()
cv2.destroyAllWindows()
