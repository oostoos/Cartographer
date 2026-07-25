from src.common.backend.config import (
    BACKEND_PORT_ENV_VAR,
    DEFAULT_BACKEND_PORT,
    DEFAULT_FRONTEND_PORT,
    FRONTEND_PORT_ENV_VAR,
    loadSharedConfig,
)


def test_load_shared_config_uses_defaults_when_env_vars_unset(monkeypatch):
    monkeypatch.delenv(BACKEND_PORT_ENV_VAR, raising=False)
    monkeypatch.delenv(FRONTEND_PORT_ENV_VAR, raising=False)

    config = loadSharedConfig()

    assert config.backend_port == DEFAULT_BACKEND_PORT
    assert config.frontend_port == DEFAULT_FRONTEND_PORT


def test_load_shared_config_reads_env_vars_when_set(monkeypatch):
    monkeypatch.setenv(BACKEND_PORT_ENV_VAR, "6000")
    monkeypatch.setenv(FRONTEND_PORT_ENV_VAR, "6001")

    config = loadSharedConfig()

    assert config.backend_port == 6000
    assert config.frontend_port == 6001
