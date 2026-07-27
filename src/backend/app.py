"""Cartographer Flask entrypoint. Launch with `python -m src.backend.app`."""
from lib.stack.flask.app_factory import createApp
from src.backend.config import loadSharedConfig
from lib.stack.flask.responses import buildSuccessResponse
from src.backend.profile.routes import profile_blueprint
from src.backend.groups.routes import groups_blueprint
from src.backend.tasks.routes import tasks_blueprint

app = createApp()
app.register_blueprint(tasks_blueprint)
app.register_blueprint(profile_blueprint)
app.register_blueprint(groups_blueprint)


@app.get("/api/health")
def getHealth():
    """Trivial liveness check confirming the backend process is up and responding."""
    return buildSuccessResponse({"status": "ok"})


if __name__ == "__main__":
    config = loadSharedConfig()
    app.run(port=config.backend_port, debug=True)
