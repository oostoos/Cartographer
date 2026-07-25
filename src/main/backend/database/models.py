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


@dataclass
class Profile:
    """The (singleton) user profile record."""

    display_name: str
