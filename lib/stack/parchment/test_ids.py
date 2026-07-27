from src.common.backend.database.ids import generateRecordId


def test_generate_record_id_returns_32_char_hex_string():
    record_id = generateRecordId()

    assert len(record_id) == 32
    int(record_id, 16)  # raises ValueError if not valid hex


def test_generate_record_id_is_unique_across_calls():
    ids = {generateRecordId() for _ in range(1000)}

    assert len(ids) == 1000
