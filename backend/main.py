"""Preserve the exercise's uvicorn main:app entry point."""

from backend.main import app

__all__ = ["app"]
