from .models import Job

_J = []


def list_jobs():
    return _J


def create_job(j: Job):
    j.id = len(_J) + 1
    _J.append(j)
    return j
