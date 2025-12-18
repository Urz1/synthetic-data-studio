"""
API request/response schemas for generators.

These Pydantic models define the API contract and are separate from
database models (models.py) following clean architecture principles.
"""

from typing import Optional, Dict, Any, Union, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
import uuid


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================
# Allowed column types for schema-based generation
ALLOWED_TYPES = {
    # Group by category for better organization
    
    # === Text/String ===
    'string', 'str', 'text', 'varchar', 'char', 'character', 'character varying',
    'alphanumeric', 'alphabetic', 'word', 'phrase', 'sentence', 'paragraph',
    'name', 'title', 'description', 'comment', 'note', 'remark',
    'label', 'caption', 'heading', 'header',
    
    # === Numeric ===
    # Integer family
    'integer', 'int', 'int8', 'int16', 'int32', 'int64', 'bigint', 'smallint',
    'tinyint', 'byte', 'short', 'long', 'signed', 'unsigned',
    'uint', 'uint8', 'uint16', 'uint32', 'uint64',
    
    # Floating point family
    'float', 'float16', 'float32', 'float64', 'float128', 'double', 'double precision',
    'real', 'decimal', 'numeric', 'number', 'num',
    'money', 'currency', 'price', 'cost', 'amount', 'value', 'salary', 'revenue',
    
    # Scientific numeric
    'complex', 'complex64', 'complex128', 'quaternion',
    
    # === Boolean ===
    'boolean', 'bool', 'bit', 'flag', 'switch', 'toggle',
    'yesno', 'truefalse', 'binary', 'dichotomous',
    
    # === Date/Time ===
    'date', 'time', 'datetime', 'timestamp', 'timestampz', 'timestamptz',
    'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'microsecond',
    'interval', 'duration', 'period', 'timedelta', 'timespan',
    'birthdate', 'birthday', 'anniversary', 'holiday',
    
    # === UUID/Identifier ===
    'uuid', 'guid', 'uniqueidentifier', 'oid', 'objectid',
    'id', 'identifier', 'key', 'pk', 'primary_key', 'foreign_key', 'fk',
    'hash', 'md5', 'sha1', 'sha256', 'sha512', 'sha224', 'sha384',
    'checksum', 'digest', 'fingerprint',
    'serial', 'autoincrement', 'auto_increment', 'sequence', 'counter',
    
    # === Categorical/Enum ===
    'categorical', 'category', 'cat', 'enum', 'enumerated',
    'choice', 'option', 'select', 'dropdown', 'radio',
    'ordinal', 'nominal', 'factor', 'level', 'class', 'type', 'kind',
    'status', 'state', 'phase', 'stage', 'step', 'progress',
    'grade', 'rating', 'rank', 'tier', 'level', 'class',
    'color', 'colour', 'shape', 'size', 'brand', 'model',
    'country', 'city', 'state', 'province', 'region', 'continent',
    'language', 'locale', 'currency_code', 'country_code',
    'gender', 'sex', 'marital_status', 'education_level',
    
    # === Binary/LOB ===
    'binary', 'blob', 'bytea', 'bytes', 'byte_array', 'byte_string',
    'image', 'picture', 'photo', 'graphic',
    'audio', 'sound', 'voice', 'music',
    'video', 'movie', 'clip',
    'file', 'attachment', 'document',
    'object', 'pickle', 'serialized',
    
    # === JSON/Structured ===
    'json', 'jsonb', 'array', 'list', 'vector', 'matrix', 'tensor',
    'dict', 'dictionary', 'map', 'hashmap', 'object', 'struct', 'record',
    'row', 'tuple', 'set', 'bag',
    
    # === Geographic ===
    'geography', 'geometry', 'point', 'line', 'linestring', 'polygon',
    'multipoint', 'multiline', 'multilinestring', 'multipolygon',
    'latitude', 'lat', 'longitude', 'long', 'lon', 'coord', 'coordinate',
    'address', 'location', 'place', 'venue', 'site',
    'zipcode', 'postalcode', 'areacode', 'phonecode',
    
    # === Network ===
    'ip', 'ipaddress', 'ipv4', 'ipv6', 'mac', 'macaddress', 'mac_addr',
    'url', 'uri', 'urn', 'email', 'e-mail', 'mail', 'phonenumber', 'phone',
    'website', 'domain', 'hostname', 'subdomain', 'tld',
    
    # === Financial ===
    'account_number', 'routing_number', 'iban', 'swift', 'bic',
    'credit_card', 'debit_card', 'card_number', 'expiry_date', 'cvv',
    'transaction_id', 'order_id', 'invoice_id', 'receipt_number',
    'sku', 'upc', 'ean', 'isbn', 'issn', 'barcode', 'qrcode',
    
    # === Scientific/Technical ===
    'temperature', 'temp', 'pressure', 'pres', 'humidity', 'hum',
    'voltage', 'current', 'resistance', 'power', 'energy',
    'frequency', 'wavelength', 'amplitude', 'phase',
    'mass', 'weight', 'volume', 'density', 'velocity', 'speed',
    'acceleration', 'force', 'torque', 'momentum',
    
    # === Healthcare ===
    'bmi', 'blood_pressure', 'bp', 'heart_rate', 'hr', 'pulse',
    'temperature', 'temp', 'blood_type', 'blood_group',
    'diagnosis_code', 'icd10', 'icd9', 'cpt', 'hcpcs',
    'drug_code', 'ndc', 'rxnorm',
    'patient_id', 'medical_record_number', 'mrn',
    
    # === ML/AI ===
    'feature', 'predictor', 'independent', 'x',
    'target', 'label', 'dependent', 'y', 'response',
    'prediction', 'probability', 'confidence', 'score',
    'embedding', 'vector', 'encoding', 'latent',
    'cluster', 'centroid', 'distance',
    
    # === Quality/Metrics ===
    'accuracy', 'precision', 'recall', 'f1', 'fscore',
    'mse', 'rmse', 'mae', 'mape', 'r2', 'r_squared',
    'auc', 'roc', 'logloss', 'cross_entropy',
    'throughput', 'latency', 'response_time', 'qps', 'rps', 'tps',
    'cpu', 'memory', 'ram', 'disk', 'storage', 'network', 'bandwidth',
    
    # === Social/Demographic ===
    'age', 'birth_year', 'birth_month', 'birth_day',
    'gender', 'sex', 'ethnicity', 'race', 'nationality',
    'occupation', 'job_title', 'industry', 'company',
    'income', 'salary', 'wage', 'revenue', 'profit',
    'education', 'degree', 'qualification',
    
    # === Web/App ===
    'user_id', 'username', 'user_handle', 'screenname',
    'session_id', 'cookie_id', 'device_id', 'browser_id',
    'user_agent', 'browser', 'browser_version', 'os', 'platform',
    'referrer', 'referer', 'source', 'medium', 'campaign',
    'page_url', 'page_path', 'page_title',
    
    # === System/Logging ===
    'log_level', 'severity', 'priority',
    'error_code', 'status_code', 'http_code',
    'event_type', 'action', 'operation',
    'version', 'release', 'build', 'commit',
    
    # === Miscellaneous ===
    'color', 'colour', 'hex', 'rgb', 'rgba', 'hsl', 'hsla',
    'size', 'dimension', 'length', 'width', 'height', 'depth',
    'weight', 'mass', 'volume', 'capacity',
    'rating', 'score', 'grade', 'mark',
    'flag', 'indicator', 'marker', 'tag',
    'code', 'symbol', 'abbreviation', 'acronym',
    'unit', 'measurement', 'scale',
    'format', 'type', 'mimetype', 'content_type',
    'path', 'directory', 'folder', 'filepath', 'filename',
    'extension', 'suffix', 'prefix',
    
    # === Special/Reserved ===
    'null', 'none', 'na', 'nan', 'null', 'missing', 'undefined',
    'any', 'unknown', 'other', 'misc', 'miscellaneous',
    'auto', 'automatic', 'default', 'calculated', 'derived',
    'computed', 'generated', 'synthetic',
}
class SchemaInput(BaseModel):
    """Schema definition for manual data generation."""
    columns: Union[Dict[str, Dict[str, Any]], List[Dict[str, Any]]]  # Support both formats
    project_id: Optional[uuid.UUID] = None
    dataset_name: Optional[str] = None
    use_llm_seed: bool = False  # Use LLM for realistic seed data before ML training

    @classmethod
    def validate_columns(cls, columns):
        """Validate column definitions."""
        if isinstance(columns, dict):
            for col_name, col_config in columns.items():
                if not isinstance(col_config, dict):
                    raise ValueError(f"Column '{col_name}' config must be a dict")
                col_type = col_config.get("type", "string")
                if col_type.lower() not in ALLOWED_TYPES:
                    raise ValueError(
                        f"Invalid type '{col_type}' for column '{col_name}'. "
                        f"Allowed: {', '.join(sorted(ALLOWED_TYPES))}"
                    )
        elif isinstance(columns, list):
            for i, col in enumerate(columns):
                if not isinstance(col, dict):
                    raise ValueError(f"Column at index {i} must be a dict")
                if "name" not in col:
                    raise ValueError(f"Column at index {i} missing 'name' field")
                col_type = col.get("type", "string")
                if col_type.lower() not in ALLOWED_TYPES:
                    raise ValueError(
                        f"Invalid type '{col_type}' for column '{col.get('name')}'. "
                        f"Allowed: {', '.join(sorted(ALLOWED_TYPES))}"
                    )
        else:
            raise ValueError("'columns' must be a dict or list")
        return columns
    
    def model_post_init(self, __context) -> None:
        """Validate after initialization."""
        self.validate_columns(self.columns)


class MLGenerationConfig(BaseModel):
    """Configuration for ML-based synthesis."""
    model_type: str = Field(..., description="'ctgan', 'tvae', 'timegan', 'dp-ctgan', 'dp-tvae'")
    num_rows: int = Field(default=1000, ge=1)
    epochs: int = Field(default=300, ge=1)
    batch_size: int = Field(default=500, ge=1)
    column_types: Optional[Dict[str, str]] = None  # column -> 'categorical'|'numerical'|'datetime'|'boolean'
    conditions: Optional[Dict[str, Any]] = None  # Conditional sampling constraints
    
    # CTGAN specific
    generator_dim: Optional[tuple] = (256, 256)
    discriminator_dim: Optional[tuple] = (256, 256)
    generator_lr: Optional[float] = 2e-4
    discriminator_lr: Optional[float] = 2e-4
    
    # TVAE specific
    embedding_dim: Optional[int] = 128
    compress_dims: Optional[tuple] = (128, 128)
    decompress_dims: Optional[tuple] = (128, 128)
    learning_rate: Optional[float] = 1e-3
    
    # Differential Privacy parameters
    use_differential_privacy: bool = False
    target_epsilon: Optional[float] = 10.0
    target_delta: Optional[float] = None
    max_grad_norm: Optional[float] = 1.0
    noise_multiplier: Optional[float] = None
    
    # Custom naming
    synthetic_dataset_name: Optional[str] = None


class GeneratorCreateRequest(BaseModel):
    """Request to create a new generator."""
    model_config = ConfigDict(populate_by_name=True)
    
    dataset_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    type: str = Field(..., description="Generator type")
    parameters_json: Dict[str, Any] = Field(default_factory=dict)
    generator_schema: Optional[Dict[str, Any]] = Field(None, alias="schema_json")
    name: str = Field(..., min_length=1, max_length=255)


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class GeneratorResponse(BaseModel):
    """Response model for generator information."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: uuid.UUID
    dataset_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    type: str
    parameters_json: Dict[str, Any]
    generator_schema: Optional[Dict[str, Any]] = Field(None, alias="schema_json")
    name: str
    status: str
    output_dataset_id: Optional[uuid.UUID] = None
    model_path: Optional[str] = None
    training_metadata: Optional[Dict[str, Any]] = None
    privacy_config: Optional[Dict[str, Any]] = None
    privacy_spent: Optional[Dict[str, Any]] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


class GeneratorDeleteResponse(BaseModel):
    """Response after deleting a generator."""
    message: str
    id: str


class GenerationStartRequest(BaseModel):
    """Request body for starting generation."""
    num_rows: Optional[int] = None
    dataset_name: Optional[str] = None
    project_id: Optional[str] = None


class GenerationStartResponse(BaseModel):
    """Response when starting generation."""
    message: str
    generator_id: str
    job_id: Optional[str] = None  # Job ID for tracking the background task
