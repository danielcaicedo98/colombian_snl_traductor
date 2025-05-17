from flask import Flask
from flask_cors import CORS

# Importa los blueprints
from translate_vowels.translate_vowels import predict_bp
from translate_gestures.translate_gestures import lstm_bp
from translate_numbers.translate_numbers_dinamic import lstm_right_bp
from translate_numbers.translate_numbers_static import predict_static_bp

app = Flask(__name__)
CORS(app)

# Registra los blueprints
app.register_blueprint(predict_bp, url_prefix='/predict')
app.register_blueprint(lstm_bp,    url_prefix='/predict_lstm')
app.register_blueprint(lstm_right_bp, url_prefix='/predict_lstm_right')
app.register_blueprint(predict_static_bp, url_prefix='/predict_static')

if __name__ == '__main__':
    app.run(debug=True)
