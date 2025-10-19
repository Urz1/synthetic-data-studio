from .models import ComplianceReport

_R = []


def list_reports():
    return _R


def create_report(r: ComplianceReport):
    r.id = len(_R) + 1
    _R.append(r)
    return r
