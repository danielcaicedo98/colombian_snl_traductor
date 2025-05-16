from flask import Flask
from flask_cors import CORS

# Importa los blueprints
from predict import predict_bp
from predict_lstm import lstm_bp
from predict_lstm_right_hand import lstm_right_bp

app = Flask(__name__)
CORS(app)

# Registra los blueprints
app.register_blueprint(predict_bp, url_prefix='/predict')
app.register_blueprint(lstm_bp,    url_prefix='/predict_lstm')
app.register_blueprint(lstm_right_bp, url_prefix='/predict_lstm_right')

if __name__ == '__main__':
    app.run(debug=True)
