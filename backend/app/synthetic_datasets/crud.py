from .models import SyntheticDataset

_SYN = []


def list_synthetic():
    return _SYN


def create_synthetic(s: SyntheticDataset):
    s.id = len(_SYN) + 1
    _SYN.append(s)
    return s
