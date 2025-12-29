---
id: user-guide-uploading-data
title: "Uploading and Managing Data"
sidebar_label: "Uploading Data"
sidebar_position: 2
slug: /user-guide/uploading-data
tags: [user-guide, data-upload]
---

# Uploading and Managing Data

Learn how to upload datasets, understand data profiling, and manage your data within Synthetic Data Studio.

## Data Upload

### Supported Formats

Synthetic Data Studio supports multiple data formats:

- **CSV** (recommended): Comma-separated values with headers
- **JSON**: JSON array of objects or newline-delimited JSON

### File Requirements

- **Maximum Size**: 100MB (fixed limit)
- **Encoding**: UTF-8 preferred
- **Headers**: First row should contain column names
- **Data Types**: Automatic type inference for:
  - Integers, floats, strings
  - Dates (ISO format, US format, European format)
  - Booleans (true/false, 1/0, yes/no)

### Upload Methods

#### Method 1: Web Interface (Recommended)

1. Navigate to the API documentation: http://localhost:8000/docs
2. Find `POST /datasets/upload`
3. Click "Try it out"
4. Select your file
5. Click "Execute"

#### Method 2: REST API

```bash
curl -X POST "http://localhost:8000/datasets/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your-dataset.csv"
```

#### Method 3: Python Client

```python
import requests

url = "http://localhost:8000/datasets/upload"
files = {"file": open("your-dataset.csv", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

### Upload Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "customer_data.csv",
  "row_count": 10000,
  "column_count": 15,
  "file_size": 2048576,
  "upload_timestamp": "2025-11-27T14:30:00Z",
  "status": "uploaded"
}
```

## Data Profiling

After upload, Synthetic Data Studio automatically analyzes your data structure and characteristics.

### Automatic Profiling

The system performs comprehensive analysis including:

- **Basic Statistics**: Count, mean, median, standard deviation
- **Data Types**: Automatic type inference and validation
- **Missing Values**: Detection and quantification
- **Correlations**: Pearson correlation matrix for numerical columns
- **Distributions**: Statistical distribution analysis
- **Outliers**: IQR-based outlier detection

### Running a Profile

```bash
# Profile the uploaded dataset
curl -X POST "http://localhost:8000/datasets/{dataset_id}/profile" \
  -H "Content-Type: application/json"
```

### Profile Response

```json
{
  "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
  "row_count": 10000,
  "column_count": 15,
  "columns": [
    {
      "name": "customer_id",
      "type": "integer",
      "nullable": false,
      "unique_count": 10000,
      "min": 1,
      "max": 10000,
      "mean": 5000.5
    },
    {
      "name": "age",
      "type": "integer",
      "nullable": true,
      "unique_count": 63,
      "min": 18,
      "max": 80,
      "mean": 42.3,
      "std": 15.2,
      "missing_count": 23
    },
    {
      "name": "income",
      "type": "float",
      "nullable": true,
      "min": 25000.0,
      "max": 250000.0,
      "mean": 87500.0,
      "std": 35000.0
    },
    {
      "name": "category",
      "type": "string",
      "nullable": false,
      "unique_count": 5,
      "most_frequent": ["A", "B", "C", "D", "E"],
      "frequencies": [2000, 2000, 2000, 2000, 2000]
    }
  ],
  "correlations": {
    "age-income": 0.45,
    "age-category": -0.12
  },
  "data_quality_score": 0.95
}
```

### Retrieving Profiles

```bash
# Get existing profile
curl http://localhost:8000/datasets/{dataset_id}/profile
```

## Sensitive Data Detection

### Automatic PII/PHI Detection

Synthetic Data Studio automatically scans for sensitive information:

- **Personal Identifiers**: Names, email addresses, phone numbers, SSNs
- **Financial Data**: Credit card numbers, bank account details
- **Health Information**: Medical IDs, diagnosis codes, PHI indicators
- **Location Data**: Precise GPS coordinates, full addresses

### Detection Methods

1. **Pattern Matching**: Regular expressions for known formats
2. **Context Analysis**: Column names and data patterns
3. **Statistical Analysis**: Uniqueness and distribution patterns
4. **AI Enhancement**: LLM-powered detection for complex cases

### Running PII Detection

```bash
# Detect sensitive data
curl -X POST "http://localhost:8000/datasets/{dataset_id}/pii-detection" \
  -H "Content-Type: application/json"
```

### Enhanced Detection (AI-Powered)

```bash
# Use AI for better detection
curl -X POST "http://localhost:8000/datasets/{dataset_id}/pii-detection-enhanced" \
  -H "Content-Type: application/json"
```

### Detection Response

```json
{
  "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
  "pii_detected": true,
  "risk_level": "high",
  "findings": [
    {
      "column": "email",
      "type": "email_address",
      "confidence": 0.99,
      "sample_values": ["user@example.com", "test@domain.org"],
      "recommendation": "Remove or pseudonymize"
    },
    {
      "column": "ssn",
      "type": "social_security_number",
      "confidence": 0.95,
      "sample_values": ["123-45-6789", "987-65-4321"],
      "recommendation": "Definitely remove"
    }
  ],
  "overall_risk_assessment": {
    "level": "high",
    "description": "Multiple high-confidence PII detections found",
    "actions_required": [
      "Remove or pseudonymize identified columns",
      "Consider differential privacy for synthesis",
      "Review data sharing agreements"
    ]
  }
}
```

### Managing PII Flags

```bash
# Get PII detection results
curl http://localhost:8000/datasets/{dataset_id}/pii-flags
```

## Dataset Management

### Listing Datasets

```bash
# Get all datasets
curl http://localhost:8000/datasets/

# Response
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "customer_data.csv",
    "row_count": 10000,
    "column_count": 15,
    "created_at": "2025-11-27T14:30:00Z",
    "has_profile": true,
    "has_pii_analysis": true
  }
]
```

### Dataset Details

```bash
# Get specific dataset info
curl http://localhost:8000/datasets/{dataset_id}
```

### Downloading Datasets

```bash
# Download original dataset
curl -O http://localhost:8000/datasets/{dataset_id}/download
```

### Deleting Datasets

```bash
# Delete dataset (irreversible)
curl -X DELETE http://localhost:8000/datasets/{dataset_id}
```

## Data Quality Checks

### Quality Metrics

The platform provides comprehensive quality assessment:

- **Completeness**: Percentage of non-null values
- **Consistency**: Data type consistency and format validation
- **Accuracy**: Statistical reasonableness checks
- **Uniqueness**: Duplicate detection and uniqueness analysis

### Quality Score Interpretation

| Score   | Quality Level | Description                         |
| ------- | ------------- | ----------------------------------- |
| 0.9-1.0 | Excellent     | High-quality, production-ready data |
| 0.7-0.9 | Good          | Suitable for most use cases         |
| 0.5-0.7 | Fair          | May need cleaning or validation     |
| < 0.5   | Poor          | Significant quality issues detected |

## Data Preprocessing

### Automatic Preprocessing

When you upload data, the system automatically:

1. **Type Inference**: Detects and converts data types
2. **Missing Value Handling**: Identifies missing patterns
3. **Encoding Detection**: Handles various text encodings
4. **Basic Cleaning**: Removes extra whitespace, standardizes formats

### Manual Preprocessing Options

For advanced preprocessing, you can:

1. **Clean data externally** before upload
2. **Use schema-based generation** for structured data
3. **Apply transformations** in your data pipeline
4. **Handle outliers** based on profiling results

## Best Practices

### Data Preparation

1. **Clean Headers**: Use descriptive, consistent column names
2. **Consistent Formats**: Standardize date formats, number formats
3. **Remove Unnecessary Data**: Delete unused columns before upload
4. **Check for PII**: Review data for sensitive information
5. **Validate Data Types**: Ensure columns have appropriate types

### Upload Strategy

1. **Start Small**: Test with a subset (1000-5000 rows) first
2. **Profile First**: Always run profiling after upload
3. **Check PII**: Run PII detection before synthesis
4. **Quality Check**: Review data quality metrics
5. **Scale Up**: Increase dataset size gradually

### Security Considerations

1. **Never upload production PII** without proper controls
2. **Use test/synthetic data** for development
3. **Review PII detection results** carefully
4. **Consider privacy-preserving methods** for sensitive data
5. **Implement proper access controls** in production

## Troubleshooting

### Common Upload Issues

**File Too Large**

```text
Error: File size exceeds maximum limit
Solution: Split large files or increase MAX_FILE_SIZE in config
```

**Invalid Format**

```text
Error: Unable to parse file
Solution: Check CSV headers, JSON structure, or Excel format
```

**Encoding Issues**

```text
Error: Character encoding not supported
Solution: Save file as UTF-8 encoding
```

### Profile Issues

**Profile Generation Fails**

```text
Error: Unable to analyze dataset
Solution: Check for corrupted data or unsupported formats
```

**Missing Statistics**

```text
Issue: Some columns lack statistics
Solution: Check for non-numeric data in numeric columns
```

### PII Detection Issues

**False Positives**

```text
Issue: Legitimate data flagged as PII
Solution: Review detection results and adjust as needed
```

**False Negatives**

```text
Issue: PII not detected
Solution: Use enhanced detection or manual review
```

## Monitoring and Analytics

### Dataset Analytics

Track dataset usage and performance:

- **Upload Frequency**: Monitor data ingestion patterns
- **Profile Quality**: Track data quality over time
- **PII Detection Rate**: Monitor sensitive data identification
- **Synthesis Success**: Track successful generation rates

### Performance Metrics

- **Upload Speed**: Time to process different file sizes
- **Profile Generation**: Time for different dataset sizes
- **PII Detection**: Accuracy and processing time
- **Storage Usage**: Monitor disk space consumption

## Next Steps

After uploading and profiling your data:

1. **[Generate Synthetic Data](generating-data.md)** using various synthesis methods
2. **[Evaluate Quality](evaluating-quality.md)** of your synthetic datasets
3. **[Use Privacy Features](privacy-features.md)** for sensitive data
4. **[Explore AI Features](ai-features.md)** for enhanced workflows

---

**Need help?** Check our [Troubleshooting Guide](../reference/troubleshooting.md) or create an issue on GitHub.
