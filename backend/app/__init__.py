from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config


def create_app():
    Config.validate()

    app = Flask(__name__)

    CORS(app, origins=[Config.FRONTEND_URL])

    from app.auth.routes import auth_bp
    from app.users.routes import users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app
