from .models import Project

_PROJECTS = []


def list_projects():
    return _PROJECTS


def create_project(p: Project):
    p.id = len(_PROJECTS) + 1
    _PROJECTS.append(p)
    return p
