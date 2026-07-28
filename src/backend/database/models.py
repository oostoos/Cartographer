"""Dataclasses shared between the database layer and route JSON serialization."""
from dataclasses import dataclass


@dataclass
class Task:
    """A single task record."""

    id: str
    title: str
    description: str
    completed: bool
    created_at: str
    updated_at: str
    completed_at: str | None = None
    order: float = 0.0
    group_id: str | None = None
    energy_requirement: int | None = None
    impact: int | None = None
    due_date: str | None = None
    time_estimate_minutes: int | None = None


@dataclass
class Profile:
    """The (singleton) user profile record."""

    display_name: str


@dataclass
class Group:
    """A single group record, used to group tasks."""

    id: str
    name: str
    created_at: str
    updated_at: str
    color: str
    order: float = 0.0
