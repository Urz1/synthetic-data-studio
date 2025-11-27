# Supported Formats Reference

Complete reference of data formats, file types, and data structure requirements supported by Synthetic Data Studio.

## 📁 File Format Support

### CSV Files

#### Supported Variants
- **Standard CSV**: Comma-separated values with headers
- **TSV**: Tab-separated values
- **Custom Delimiters**: Pipe (|), semicolon (;), etc.

#### Requirements
```csv
# Required: Header row
name,age,income,city
John,25,50000,New York
Jane,30,60000,London
Bob,35,70000,Paris
```

#### Encoding Support
- **UTF-8** (recommended)
- **UTF-16**
- **Latin-1**
- **Windows-1252**

#### Size Limits
- **Maximum Rows**: 1,000,000
- **Maximum Columns**: 500
- **Maximum File Size**: 100MB (configurable)

### JSON Files

#### Supported Structures

**Array of Objects** (Recommended):
```json
[
  {"name": "John", "age": 25, "income": 50000},
  {"name": "Jane", "age": 30, "income": 60000},
  {"name": "Bob", "age": 35, "income": 70000}
]
```

**Newline-Delimited JSON**:
```json
{"name": "John", "age": 25, "income": 50000}
{"name": "Jane", "age": 30, "income": 60000}
{"name": "Bob", "age": 35, "income": 70000}
```

#### Nested Structures
```json
{
  "customer": {
    "name": "John Doe",
    "age": 25,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001"
    }
  },
  "transactions": [
    {"amount": 100.50, "date": "2023-01-15"},
    {"amount": 250.00, "date": "2023-02-20"}
  ]
}
```

**Note**: Nested structures are flattened during processing.

### Excel Files

#### Supported Formats
- **.xlsx** (Excel 2007+)
- **.xls** (Excel 97-2003)

#### Sheet Selection
- **Default**: First sheet
- **Named Sheet**: Specify sheet name in upload options

#### Data Requirements
- **Headers**: First row must contain column names
- **Data Start**: Data starts from row 2
- **Empty Rows**: Automatically skipped
- **Merged Cells**: Not supported (will be unmerged)

### Parquet Files

#### Support Level
- **Basic Support**: Simple tabular structures
- **Complex Types**: Limited support for nested structures

#### Advantages
- **Compressed**: Efficient storage
- **Columnar**: Fast column access
- **Typed**: Preserves data types

## 📊 Data Type Support

### Automatic Type Inference

Synthetic Data Studio automatically detects and converts data types:

#### Numeric Types

| Detected As | Examples | SQL Type | Notes |
|-------------|----------|----------|-------|
| **integer** | `25`, `1000`, `-5` | INTEGER | Whole numbers |
| **float** | `25.5`, `1000.99`, `3.14` | FLOAT | Decimal numbers |
| **boolean** | `true`, `false`, `1`, `0` | BOOLEAN | True/false values |

#### Text Types

| Detected As | Examples | SQL Type | Notes |
|-------------|----------|----------|-------|
| **string** | `"John"`, `"New York"` | VARCHAR | Any text |
| **categorical** | `"red"`, `"blue"`, `"green"` | VARCHAR | Limited unique values |
| **email** | `"user@example.com"` | VARCHAR | Email pattern |
| **phone** | `"+1-555-123-4567"` | VARCHAR | Phone pattern |
| **url** | `"https://example.com"` | VARCHAR | URL pattern |

#### Date/Time Types

| Detected As | Examples | SQL Type | Notes |
|-------------|----------|----------|-------|
| **date** | `"2023-01-15"`, `"01/15/2023"` | DATE | Date only |
| **datetime** | `"2023-01-15 14:30:00"` | DATETIME | Date and time |
| **timestamp** | `1642152600` | TIMESTAMP | Unix timestamp |

### Type Conversion Rules

#### String to Numeric
```python
# Automatic conversion
"25" → 25 (integer)
"25.5" → 25.5 (float)
"true" → True (boolean)
"false" → False (boolean)
```

#### Date Parsing
```python
# Supported formats
"2023-01-15" → date(2023, 1, 15)
"01/15/2023" → date(2023, 1, 15)  # US format
"15/01/2023" → date(2023, 1, 15)  # European format
"2023-01-15 14:30:00" → datetime(2023, 1, 15, 14, 30, 0)
```

#### Categorical Detection
```python
# Automatically detected if:
# - Unique values < 10% of total rows
# - String values repeating frequently
# - Explicit category indicators
```

## 🏗️ Data Structure Requirements

### Tabular Format

All data must be representable as a table:

#### Required Structure
```
Column 1 | Column 2 | Column 3 | ...
---------|----------|----------|---
Value 1  | Value 2  | Value 3  | ...
Value 1  | Value 2  | Value 3  | ...
```

#### Column Requirements
- **Unique Names**: Each column must have a unique name
- **No Empty Names**: Column names cannot be empty
- **Valid Characters**: Letters, numbers, underscores, spaces
- **Case Sensitive**: Column names are case-sensitive

### Data Quality Standards

#### Completeness
- **Missing Values**: Supported (represented as NULL)
- **Empty Strings**: Converted to NULL for non-string columns
- **Sparse Data**: Acceptable up to 50% missing values

#### Consistency
- **Type Consistency**: Values in a column should be same type
- **Format Consistency**: Dates, numbers should follow consistent formats
- **Encoding Consistency**: All text should use same encoding

#### Validity
- **Range Checks**: Numeric values within reasonable ranges
- **Format Validation**: Emails, phones, URLs follow valid patterns
- **Logical Consistency**: Related columns should have consistent values

## 🔧 Data Preprocessing

### Automatic Processing

#### Type Conversion
```python
# Input data
{"age": "25", "income": "50000.50", "active": "true"}

# Processed data
{"age": 25, "income": 50000.50, "active": True}
```

#### Missing Value Handling
```python
# Input with missing values
{"name": "John", "age": "", "income": null}

# Processed data
{"name": "John", "age": null, "income": null}
```

#### String Normalization
```python
# Input data
{"name": "  john doe  ", "email": "JOHN@EXAMPLE.COM"}

# Processed data
{"name": "john doe", "email": "john@example.com"}
```

### Manual Preprocessing Options

#### Data Cleaning Scripts
```python
import pandas as pd

def clean_data(df):
    # Remove duplicates
    df = df.drop_duplicates()

    # Handle missing values
    df = df.fillna({
        'age': df['age'].median(),
        'income': df['income'].mean()
    })

    # Normalize text
    df['name'] = df['name'].str.strip().str.lower()

    return df
```

#### Schema Definition
```json
{
  "columns": {
    "customer_id": {"type": "integer", "primary_key": true},
    "name": {"type": "string", "max_length": 100},
    "age": {"type": "integer", "min": 0, "max": 120},
    "email": {"type": "string", "format": "email"},
    "income": {"type": "float", "min": 0}
  },
  "constraints": {
    "unique": ["email"],
    "not_null": ["customer_id", "name"]
  }
}
```

## 📊 Dataset Size Guidelines

### Small Datasets (< 10,000 rows)
- **Best for**: Prototyping, testing, learning
- **Processing**: Instant (< 1 second)
- **Quality**: May have higher variance
- **Use Cases**: Examples, tutorials, validation

### Medium Datasets (10,000 - 100,000 rows)
- **Best for**: Development, moderate analysis
- **Processing**: Fast (1-10 seconds)
- **Quality**: Good balance of speed and accuracy
- **Use Cases**: Application development, research

### Large Datasets (100,000 - 1,000,000 rows)
- **Best for**: Production, comprehensive analysis
- **Processing**: Moderate (10-60 seconds)
- **Quality**: High accuracy, stable results
- **Use Cases**: Enterprise applications, large-scale research

### Very Large Datasets (> 1,000,000 rows)
- **Best for**: Big data applications
- **Processing**: Extended (1-10 minutes)
- **Quality**: Maximum accuracy
- **Considerations**: Memory usage, processing time
- **Alternatives**: Sampling, distributed processing

## 🚫 Unsupported Formats

### File Types
- **Images**: PNG, JPG, GIF (use metadata extraction)
- **Videos**: MP4, AVI (use metadata extraction)
- **Audio**: MP3, WAV (use metadata extraction)
- **Documents**: PDF, DOCX (use text extraction)
- **Archives**: ZIP, TAR (extract first)

### Data Structures
- **Graphs**: Node/edge data (convert to tabular)
- **Time Series**: Irregular intervals (resample first)
- **Geospatial**: Complex geometries (use coordinates)
- **Hierarchical**: Deep nesting (flatten first)

### Special Cases
- **Encrypted Data**: Must be decrypted before upload
- **Compressed Data**: Decompress before upload
- **Binary Data**: Convert to text representation
- **Real-time Streams**: Batch into files first

## 🔄 Data Transformation

### Schema Mapping

```json
{
  "source_schema": {
    "old_column_name": "new_column_name",
    "customer_name": "name",
    "customer_age": "age"
  },
  "type_conversions": {
    "age": "integer",
    "income": "float"
  },
  "value_mappings": {
    "gender": {
      "M": "Male",
      "F": "Female",
      "O": "Other"
    }
  }
}
```

### Data Validation Rules

```json
{
  "validation_rules": {
    "age": {
      "type": "integer",
      "min": 0,
      "max": 120
    },
    "email": {
      "type": "string",
      "pattern": "^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$"
    },
    "income": {
      "type": "float",
      "min": 0,
      "max": 10000000
    }
  }
}
```

## 📋 Best Practices

### Data Preparation

1. **Clean Headers**: Use descriptive, consistent column names
2. **Consistent Formats**: Standardize dates, numbers, and text
3. **Remove Unnecessary Data**: Delete unused columns
4. **Validate Data Types**: Ensure columns have appropriate types
5. **Check for Outliers**: Review extreme values
6. **Handle Missing Data**: Decide on imputation strategy

### File Organization

1. **One Dataset Per File**: Avoid multiple datasets in one file
2. **Consistent Naming**: Use descriptive file names
3. **Version Control**: Include version numbers in filenames
4. **Documentation**: Include data dictionary or README

### Quality Assurance

1. **Sample First**: Test with small subset before full upload
2. **Validate Types**: Check automatic type inference
3. **Review Statistics**: Examine generated profiles
4. **Test Synthesis**: Run small generation test
5. **Scale Up**: Gradually increase dataset size

## 🛠️ Troubleshooting

### Common Format Issues

**"Unable to parse file"**
```
Causes: Corrupted file, unsupported encoding, invalid format
Solutions: Check file integrity, convert encoding, validate format
```

**"Column names missing"**
```
Causes: No header row, empty first row
Solutions: Add header row, remove empty rows
```

**"Type conversion failed"**
```
Causes: Inconsistent data types, invalid values
Solutions: Clean data, standardize formats, handle exceptions
```

**"File too large"**
```
Causes: Exceeds size limit
Solutions: Split file, increase limit, use compression
```

### Data Quality Issues

**"High missing values"**
```
Causes: Sparse data, collection issues
Solutions: Imputation, filtering, data collection improvement
```

**"Inconsistent types"**
```
Causes: Mixed data types in columns
Solutions: Separate columns, data cleaning, type standardization
```

**"Outlier values"**
```
Causes: Data entry errors, legitimate extreme values
Solutions: Review validity, apply filtering, use robust statistics
```

## 📊 Performance Considerations

### File Size Impact

| File Size | Rows | Processing Time | Memory Usage |
|-----------|------|-----------------|--------------|
| < 1MB | < 10K | < 1 second | < 50MB |
| 1-10MB | 10K-100K | 1-5 seconds | 50-200MB |
| 10-100MB | 100K-1M | 5-30 seconds | 200MB-1GB |
| > 100MB | > 1M | 30s+ | 1GB+ |

### Optimization Tips

1. **Compress Files**: Use gzip for large CSV files
2. **Use Efficient Formats**: Parquet for large datasets
3. **Pre-clean Data**: Remove unnecessary columns
4. **Batch Processing**: Split very large files
5. **Monitor Resources**: Watch memory and CPU usage

## 🔗 Integration Examples

### Python Data Preparation

```python
import pandas as pd
from pathlib import Path

def prepare_dataset(input_file: str, output_file: str):
    """Prepare dataset for upload to Synthetic Data Studio."""

    # Load data
    df = pd.read_csv(input_file)

    # Clean column names
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Handle missing values
    df = df.dropna(subset=['customer_id'])  # Required fields
    df = df.fillna({
        'age': df['age'].median(),
        'income': df['income'].mean()
    })

    # Validate data types
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df['income'] = pd.to_numeric(df['income'], errors='coerce')

    # Remove outliers (optional)
    df = df[df['age'].between(18, 100)]
    df = df[df['income'].between(0, 1000000)]

    # Save cleaned data
    df.to_csv(output_file, index=False)

    return df
```

### API Upload with Validation

```python
import requests
import json

def upload_with_validation(file_path: str, api_url: str, token: str):
    """Upload dataset with validation."""

    # Step 1: Validate file locally
    file_size = Path(file_path).stat().st_size
    if file_size > 100 * 1024 * 1024:  # 100MB
        raise ValueError("File too large")

    # Step 2: Check CSV structure
    df = pd.read_csv(file_path, nrows=5)  # Sample
    if df.empty or len(df.columns) == 0:
        raise ValueError("Invalid CSV structure")

    # Step 3: Upload
    with open(file_path, 'rb') as f:
        response = requests.post(
            f"{api_url}/datasets/upload",
            files={'file': f},
            headers={'Authorization': f'Bearer {token}'}
        )

    if response.status_code == 200:
        dataset_id = response.json()['id']
        print(f"✅ Upload successful: {dataset_id}")

        # Step 4: Profile (optional)
        profile_response = requests.post(
            f"{api_url}/datasets/{dataset_id}/profile",
            headers={'Authorization': f'Bearer {token}'}
        )

        if profile_response.status_code == 200:
            print("✅ Profiling completed")
            return dataset_id
    else:
        raise Exception(f"Upload failed: {response.text}")
```

---

**Need help with data formats?** Check our [Data Upload Guide](../user-guide/uploading-data.md) or create an issue on GitHub.