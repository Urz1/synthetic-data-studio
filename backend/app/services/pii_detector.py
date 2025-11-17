"""
PII/PHI Detection Service

Detects potentially sensitive personally identifiable information (PII)
and protected health information (PHI) in datasets using heuristic pattern matching.

Detectable types:
- Email addresses
- Phone numbers (US and international formats)
- Social Security Numbers (SSN)
- Credit card numbers
- IP addresses
- Names (first/last name patterns)
- Dates of birth
- Medical record numbers
- National ID numbers (various formats)
"""

import re
import pandas as pd
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class PIIDetector:
    """
    Heuristic-based PII/PHI detector for tabular data.
    """
    
    # Regex patterns for common PII types
    PATTERNS = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "ssn": r'\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b',
        "phone_us": r'\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
        "phone_intl": r'\+\d{1,3}[-.\s]?\d{1,14}',
        "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
        "ip_address": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
        "date_of_birth": r'\b(0[1-9]|1[0-2])[/-](0[1-9]|[12]\d|3[01])[/-](19|20)\d{2}\b',
        "zip_code": r'\b\d{5}(-\d{4})?\b',
    }
    
    # Column name keywords that suggest PII/PHI
    SENSITIVE_COLUMN_KEYWORDS = {
        "email": ["email", "e-mail", "e_mail", "mail"],
        "name": ["name", "first_name", "last_name", "firstname", "lastname", "full_name", "fullname"],
        "ssn": ["ssn", "social_security", "social_security_number", "ss_number"],
        "phone": ["phone", "telephone", "mobile", "cell", "fax"],
        "address": ["address", "street", "city", "state", "zip", "zipcode", "postal", "country"],
        "dob": ["dob", "birth", "birthday", "birthdate", "date_of_birth"],
        "patient": ["patient", "patient_id", "mrn", "medical_record", "health_record"],
        "financial": ["credit_card", "cc", "account", "bank", "routing", "iban"],
        "identifier": ["id", "identifier", "user_id", "customer_id", "employee_id"],
    }
    
    def __init__(self, dataframe: pd.DataFrame):
        self.df = dataframe
        self.pii_flags = {}
        
    def detect(self) -> Dict[str, Any]:
        """
        Run PII detection on all columns.
        
        Returns:
            Dictionary with PII detection results per column
        """
        logger.info(f"Starting PII detection for {len(self.df.columns)} columns")
        
        for col in self.df.columns:
            try:
                self.pii_flags[col] = self._detect_column_pii(col)
            except Exception as e:
                logger.error(f"Error detecting PII in column {col}: {e}")
                self.pii_flags[col] = {"error": str(e)}
        
        # Summary statistics
        flagged_columns = [col for col, flags in self.pii_flags.items() 
                          if flags.get("is_sensitive", False)]
        
        results = {
            "columns": self.pii_flags,
            "summary": {
                "total_columns": len(self.df.columns),
                "flagged_columns_count": len(flagged_columns),
                "flagged_columns": flagged_columns,
                "detection_timestamp": pd.Timestamp.utcnow().isoformat()
            }
        }
        
        return results
    
    def _detect_column_pii(self, col: str) -> Dict[str, Any]:
        """
        Detect PII in a single column.
        
        Args:
            col: Column name to analyze
            
        Returns:
            Dictionary with detection results
        """
        series = self.df[col]
        
        # Initialize result
        result = {
            "column_name": col,
            "is_sensitive": False,
            "pii_types": [],
            "confidence": "low",
            "sample_detected_values": [],
            "detection_methods": []
        }
        
        # Method 1: Column name heuristics
        name_detection = self._detect_from_column_name(col)
        if name_detection["detected"]:
            result["is_sensitive"] = True
            result["pii_types"].extend(name_detection["types"])
            result["detection_methods"].append("column_name")
            result["confidence"] = "medium"
        
        # Method 2: Content pattern matching (sample first 1000 rows)
        sample = series.dropna().head(1000)
        if len(sample) > 0 and series.dtype == 'object':
            content_detection = self._detect_from_content(sample)
            if content_detection["detected"]:
                result["is_sensitive"] = True
                result["pii_types"].extend(content_detection["types"])
                result["sample_detected_values"] = content_detection["samples"]
                result["detection_methods"].append("content_pattern")
                result["confidence"] = "high"
        
        # Method 3: Statistical heuristics (high cardinality + specific patterns)
        stat_detection = self._detect_from_statistics(series)
        if stat_detection["detected"]:
            result["is_sensitive"] = True
            result["pii_types"].extend(stat_detection["types"])
            result["detection_methods"].append("statistical")
            if result["confidence"] == "low":
                result["confidence"] = "medium"
        
        # Remove duplicates from pii_types
        result["pii_types"] = list(set(result["pii_types"]))
        
        return result
    
    def _detect_from_column_name(self, col: str) -> Dict[str, Any]:
        """
        Detect PII from column name patterns.
        
        Args:
            col: Column name
            
        Returns:
            Detection result
        """
        col_lower = col.lower()
        detected_types = []
        
        for pii_type, keywords in self.SENSITIVE_COLUMN_KEYWORDS.items():
            if any(keyword in col_lower for keyword in keywords):
                detected_types.append(pii_type)
        
        return {
            "detected": len(detected_types) > 0,
            "types": detected_types
        }
    
    def _detect_from_content(self, series: pd.Series) -> Dict[str, Any]:
        """
        Detect PII from actual content using regex patterns.
        
        Args:
            series: Pandas Series of string values
            
        Returns:
            Detection result with samples
        """
        detected_types = []
        samples = []
        
        # Convert to string and concatenate sample
        sample_text = ' '.join(series.astype(str).head(100))
        
        for pii_type, pattern in self.PATTERNS.items():
            matches = re.findall(pattern, sample_text)
            if matches:
                detected_types.append(pii_type)
                # Store first few matches (anonymized)
                samples.extend([self._anonymize_sample(m) for m in matches[:3]])
        
        return {
            "detected": len(detected_types) > 0,
            "types": detected_types,
            "samples": samples[:5]  # Limit to 5 samples
        }
    
    def _detect_from_statistics(self, series: pd.Series) -> Dict[str, Any]:
        """
        Detect PII from statistical properties (cardinality, uniqueness).
        
        Args:
            series: Pandas Series to analyze
            
        Returns:
            Detection result
        """
        detected_types = []
        
        # High cardinality might indicate identifiers
        cardinality = series.nunique() / len(series)
        
        if cardinality > 0.95:  # More than 95% unique values
            detected_types.append("potential_identifier")
        
        # Check for sequential IDs (numeric only)
        if pd.api.types.is_numeric_dtype(series):
            clean_series = series.dropna().sort_values()
            if len(clean_series) > 1:
                diffs = clean_series.diff().dropna()
                # If most differences are 1, likely a sequential ID
                if (diffs == 1).sum() / len(diffs) > 0.8:
                    detected_types.append("sequential_identifier")
        
        return {
            "detected": len(detected_types) > 0,
            "types": detected_types
        }
    
    def _anonymize_sample(self, value: str) -> str:
        """
        Partially anonymize a sample value for display.
        
        Args:
            value: String value to anonymize
            
        Returns:
            Anonymized string
        """
        if isinstance(value, tuple):
            value = str(value[0]) if value else ""
        
        if len(value) <= 4:
            return "***"
        
        # Show first 2 and last 2 characters
        return f"{value[:2]}...{value[-2:]}"
    
    def get_redaction_recommendations(self) -> List[Dict[str, Any]]:
        """
        Get recommendations for handling detected PII.
        
        Returns:
            List of recommendations per flagged column
        """
        recommendations = []
        
        for col, flags in self.pii_flags.items():
            if flags.get("is_sensitive", False):
                pii_types = flags.get("pii_types", [])
                
                # Determine redaction strategy based on PII type
                strategies = []
                for pii_type in pii_types:
                    if pii_type in ["email", "ssn", "phone", "credit_card"]:
                        strategies.append("hash_or_remove")
                    elif pii_type in ["name"]:
                        strategies.append("pseudonymize")
                    elif pii_type in ["identifier", "potential_identifier"]:
                        strategies.append("generate_synthetic_ids")
                    elif pii_type in ["address", "dob"]:
                        strategies.append("generalize_or_remove")
                    else:
                        strategies.append("review_manually")
                
                recommendations.append({
                    "column": col,
                    "pii_types": pii_types,
                    "confidence": flags.get("confidence", "low"),
                    "recommended_actions": list(set(strategies))
                })
        
        return recommendations


def detect_pii(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Convenience function to detect PII in a dataset.
    
    Args:
        df: Pandas DataFrame to analyze
        
    Returns:
        PII detection results
    """
    detector = PIIDetector(df)
    return detector.detect()


def get_pii_recommendations(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Get PII redaction recommendations for a dataset.
    
    Args:
        df: Pandas DataFrame to analyze
        
    Returns:
        List of redaction recommendations
    """
    detector = PIIDetector(df)
    detector.detect()
    return detector.get_redaction_recommendations()
