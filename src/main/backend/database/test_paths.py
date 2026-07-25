from pathlib import Path

from src.main.backend.database.paths import DATA_ROOT


def test_data_root_is_a_data_directory_next_to_this_module():
    assert DATA_ROOT.name == ".data"
    assert DATA_ROOT.parent == Path(__file__).resolve().parent
