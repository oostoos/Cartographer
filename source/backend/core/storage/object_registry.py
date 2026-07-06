"""Resolves reference fields (one record's field holding another record's id) into the record
they point to. Object modules self-register here on import, which avoids circular imports
between e.g. task.py and project.py.
"""

from types import ModuleType

from core.storage.record_block import RecordBlock

# object type name -> the module implementing that type's load()/save()/etc.
_REGISTRY: dict[str, ModuleType] = {}


def register(object_type: str, module: ModuleType) -> None:
    """Registers the module responsible for one object type.

    Inputs: object_type, e.g. "Project"; module, the module exposing that type's load().
    """
    _REGISTRY[object_type] = module


def dereference(object_type: str, record_id: str) -> RecordBlock | None:
    """Loads the record a reference field points to.

    Inputs: object_type, the referenced type, e.g. "Project"; record_id, the id stored in the
        reference field (may be empty, meaning "no reference").
    Raises: KeyError if object_type was never registered; RecordNotFoundError if record_id is
        set but no matching record exists.
    """
    if not record_id:
        return None
    module = _REGISTRY[object_type]
    return module.load(record_id)
