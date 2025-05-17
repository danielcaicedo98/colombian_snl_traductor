from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical
import numpy as np
import os

# Cargar secuencias
X = []
y = []

labels = sorted([d for d in os.listdir("sequences") if os.path.isdir(os.path.join("sequences", d))], key=int)
label_map = {label: i for i, label in enumerate(labels)}
print(labels)

for label in labels:
    folder = os.path.join("sequences", label)
    for file in os.listdir(folder):
        sequence = np.load(os.path.join(folder, file))
        X.append(sequence)
        y.append(label_map[label])

X = np.array(X)  # Forma: (num_samples, 50, 126)
y = to_categorical(y)  # Forma: (num_samples, num_clases)

# Definir modelo
model = Sequential([
    LSTM(64, return_sequences=True, input_shape=(50, 63)),
    LSTM(64),
    Dense(64, activation='relu'),
    Dense(len(label_map), activation='softmax')
])

# Compilar y entrenar
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X, y, epochs=50, validation_split=0.3)

# Guardar modelo y etiquetas
model.save("number_lstm_gesture_model.h5")
np.save("number_gesture_label_map.npy", label_map)