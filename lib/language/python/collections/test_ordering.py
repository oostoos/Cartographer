from lib.language.python.collections.ordering import computeNextOrder, reorderRecordsByIds


def test_compute_next_order_returns_zero_when_no_existing_orders():
    assert computeNextOrder([]) == 0.0


def test_compute_next_order_returns_one_past_the_highest():
    assert computeNextOrder([0.0, 3.0, 1.0]) == 4.0


def test_reorder_records_by_ids_saves_each_record_at_its_new_index():
    records = {"a": {"order": 5.0}, "b": {"order": 9.0}}
    saved_orders = {}

    def get_record(record_id):
        return records.get(record_id)

    def save_record_at_order(record, order):
        saved_orders[record["order"]] = order

    reorderRecordsByIds(["b", "a"], get_record, save_record_at_order)

    assert saved_orders == {9.0: 0.0, 5.0: 1.0}


def test_reorder_records_by_ids_skips_unknown_ids():
    saved_ids = []

    def get_record(record_id):
        return record_id if record_id != "missing" else None

    def save_record_at_order(record, order):
        saved_ids.append(record)

    reorderRecordsByIds(["a", "missing", "b"], get_record, save_record_at_order)

    assert saved_ids == ["a", "b"]
