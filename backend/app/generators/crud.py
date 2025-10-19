from .models import Generator

_GENS = []


def list_generators():
    return _GENS


def create_generator(g: Generator):
    g.id = len(_GENS) + 1
    _GENS.append(g)
    return g
