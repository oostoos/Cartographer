"""Cartographer Flask entrypoint. Launch with `python -m src.main.backend.app`."""
from src.common.backend.app_factory import createApp
from src.common.backend.config import loadSharedConfig
from src.common.backend.responses import buildSuccessResponse
from src.main.backend.profile.routes import profile_blueprint
from src.main.backend.groups.routes import groups_blueprint
from src.main.backend.tasks.routes import tasks_blueprint

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
