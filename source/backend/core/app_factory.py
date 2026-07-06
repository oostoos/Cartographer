"""Builds the Flask application: settings, CORS, storage-error-to-JSON mapping, and every
feature blueprint. See run.py for how this is started with hot reload and a debugger attached.
"""

from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS

from core import shutdown
from core.config.settings import (
    SETTING_ADMIN_PASSWORD_HASH,
    SETTING_FLASK_SECRET_KEY,
    SETTING_FRONTEND_ORIGIN,
    SETTING_SESSION_LIFETIME_MINUTES,
    get_setting,
    get_setting_int,
    require_setting,
)
from core.storage.errors import LockTimeoutError, RecordNotFoundError, ValidationError


def create_app() -> Flask:
    """Builds and configures the Flask application.

    Raises: MissingSettingError if the Flask secret key or admin password hash is missing —
        this fails at startup rather than on the first request that needs them.
    """
    app = Flask(__name__)
    app.config["SECRET_KEY"] = require_setting(SETTING_FLASK_SECRET_KEY)
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(
        minutes=get_setting_int(SETTING_SESSION_LIFETIME_MINUTES)
    )
    require_setting(SETTING_ADMIN_PASSWORD_HASH)  # checked at startup even though only auth uses it

    CORS(app, supports_credentials=True, origins=[get_setting(SETTING_FRONTEND_ORIGIN)])

    _register_error_handlers(app)
    _register_blueprints(app)

    return app


def _register_error_handlers(app: Flask) -> None:
    """Maps every storage-layer error to a JSON response instead of a generic 500."""

    @app.errorhandler(RecordNotFoundError)
    def handle_record_not_found(error):
        return jsonify(error=str(error)), 404

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify(error=str(error)), 400

    @app.errorhandler(LockTimeoutError)
    def handle_lock_timeout(error):
        return jsonify(error=str(error)), 503


def _register_blueprints(app: Flask) -> None:
    """Registers every feature blueprint plus the health check."""
    from app.auth.auth_routes import auth_blueprint
    from app.journals.note_routes import note_blueprint
    from app.journals.today_routes import today_blueprint
    from app.projects.project_routes import project_blueprint
    from app.recurrence.recurring_task_template_routes import recurring_task_template_blueprint
    from app.settings.settings_routes import settings_blueprint
    from app.tasks.subtask_routes import subtask_blueprint
    from app.tasks.task_routes import task_blueprint

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(project_blueprint)
    app.register_blueprint(recurring_task_template_blueprint)
    app.register_blueprint(task_blueprint)
    app.register_blueprint(subtask_blueprint)
    app.register_blueprint(today_blueprint)
    app.register_blueprint(note_blueprint)
    app.register_blueprint(settings_blueprint)

    @app.get("/api/health")
    def health_check():
        return jsonify(status="ok")

    @app.post("/api/shutdown")
    def shutdown_route():
        shutdown.schedule_shutdown()
        return jsonify(status="scheduled")

    @app.post("/api/cancel-shutdown")
    def cancel_shutdown_route():
        shutdown.cancel_pending_shutdown()
        return jsonify(status="cancelled")
