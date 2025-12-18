"""Audit logging enums for action and resource types."""

from enum import Enum


class AuditAction(str, Enum):
    """Types of actions that can be audited."""
    
    # CRUD operations
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    
    # Authentication
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    REGISTER = "register"
    ACCOUNT_DELETED = "account_deleted"
    DATA_EXPORTED = "data_exported"
    
    # Data operations
    UPLOAD = "upload"
    DOWNLOAD = "download"
    GENERATE = "generate"
    TRAIN = "train"
    EVALUATE = "evaluate"
    
    # Compliance
    EXPORT = "export"
    APPROVE = "approve"
    REJECT = "reject"
    
    # System
    ACCESS_DENIED = "access_denied"
    INVALID_REQUEST = "invalid_request"


class ResourceType(str, Enum):
    """Types of resources that can be audited."""
    
    USER = "user"
    PROJECT = "project"
    DATASET = "dataset"
    GENERATOR = "generator"
    EVALUATION = "evaluation"
    JOB = "job"
    SYNTHETIC_DATASET = "synthetic_dataset"
    COMPLIANCE_REPORT = "compliance_report"
    MODEL_CARD = "model_card"
    AUDIT_LOG = "audit_log"
