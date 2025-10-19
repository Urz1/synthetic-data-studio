"""CRUD operations for auth (in-memory stubs)."""

from .models import User

_USERS = []


def create_user(user: User):
    user.id = len(_USERS) + 1
    _USERS.append(user)
    return user

