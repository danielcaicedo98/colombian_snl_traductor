from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical
import numpy as np
import os

X = []
y = []

labels = os.listdir("sequences")
label_map = {label: i for i, label in enumerate(labels)}

for label in labels:
    folder = os.path.join("sequences", label)
    for file in os.listdir(folder):
        sequence = np.load(os.path.join(folder, file))
        X.append(sequence)
        y.append(label_map[label])

X = np.array(X)
y = to_categorical(y)

model = Sequential([
    LSTM(64, return_sequences=True, input_shape=(80, X.shape[2])),
    LSTM(64),
    Dense(64, activation='relu'),
    Dense(len(label_map), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X, y, epochs=30, validation_split=0.2)
model.save("lstm_gesture_model.h5")
np.save("gesture_label_map.npy", label_map)
