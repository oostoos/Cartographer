import pytest

from src.main.backend.database import record_store as record_store_module


@pytest.fixture(autouse=True)
def _use_tmp_data_root(tmp_path, monkeypatch):
    """Isolate every test under this tree from real data by redirecting DATA_ROOT to tmp_path."""
    monkeypatch.setattr(record_store_module, "DATA_ROOT", tmp_path)
