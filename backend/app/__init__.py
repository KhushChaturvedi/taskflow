from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config


def create_app():
    Config.validate()
    app = Flask(__name__)

    CORS(app, origins=[Config.FRONTEND_URL])

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app
