# Generating Synthetic Data

Learn how to generate high-quality synthetic data using various synthesis methods available in Synthetic Data Studio.

## 🎯 Synthesis Methods Overview

### Available Methods

| Method             | Best For             | Speed     | Quality   | Privacy   |
| ------------------ | -------------------- | --------- | --------- | --------- |
| **CTGAN**          | Complex tabular data | Medium    | Excellent | None      |
| **TVAE**           | Mixed data types     | Fast      | Good      | None      |
| **GaussianCopula** | Simple distributions | Very Fast | Fair      | None      |
| **DP-CTGAN**       | Privacy-preserving   | Slow      | Good      | Excellent |
| **DP-TVAE**        | Fast privacy         | Medium    | Good      | Excellent |

### Method Selection Guide

**Choose CTGAN when:**

- Your data has complex correlations
- You need high-fidelity synthetic data
- Training time is not a major constraint

**Choose TVAE when:**

- You have mixed data types (numeric + categorical)
- You need faster training than CTGAN
- Deterministic generation is preferred

**Choose GaussianCopula when:**

- You need very fast generation
- Data follows simple statistical distributions
- You're prototyping or need baseline comparisons

**Choose DP-CTGAN/DP-TVAE when:**

- Privacy guarantees are required
- Data contains sensitive information
- Regulatory compliance is needed

## 🚀 Basic Synthesis Workflow

### Step 1: Prepare Your Dataset

First, ensure you have uploaded and profiled your dataset:

```bash
# Upload dataset
curl -X POST "http://localhost:8000/datasets/upload" \
  -F "file=@your-data.csv"

# Profile it
curl -X POST "http://localhost:8000/datasets/{dataset_id}/profile"
```

### Step 2: Choose Synthesis Method

Select the appropriate method based on your needs:

#### CTGAN Generation (Recommended for Quality)

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 1000,
    "epochs": 50,
    "batch_size": 500
  }'
```

**Parameters:**

- `num_rows`: Number of synthetic rows to generate
- `epochs`: Training iterations (50-300, higher = better quality)
- `batch_size`: Training batch size (100-1000)

#### TVAE Generation (Faster Alternative)

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "tvae",
    "num_rows": 1000,
    "epochs": 30,
    "batch_size": 200
  }'
```

### Step 3: Monitor Generation Progress

```bash
# Check generator status
curl http://localhost:8000/generators/{generator_id}

# Response shows progress
{
  "id": "gen-123",
  "status": "running",  // or "completed", "failed"
  "progress": 75,
  "estimated_time_remaining": "2 minutes"
}
```

### Step 4: Download Results

```bash
# Download synthetic dataset
curl -O http://localhost:8000/datasets/{output_dataset_id}/download
```

## 🔒 Differential Privacy Synthesis

### DP-CTGAN Generation

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "num_rows": 1000,
    "target_epsilon": 10.0,
    "epochs": 50,
    "batch_size": 200
  }'
```

**Key Parameters:**

- `target_epsilon`: Privacy budget (lower = more private)
- `target_delta`: Failure probability (auto-calculated)
- `max_grad_norm`: Gradient clipping (default: 1.0)

### DP-TVAE Generation (Faster)

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-tvae",
    "num_rows": 1000,
    "target_epsilon": 5.0,
    "epochs": 30
  }'
```

### Privacy Parameter Selection

| Epsilon (ε) | Privacy Level | Use Case                      |
| ----------- | ------------- | ----------------------------- |
| 0.1 - 1.0   | Very Strong   | Clinical trials, genomic data |
| 1.0 - 5.0   | Strong        | Healthcare, financial records |
| 5.0 - 10.0  | Moderate      | Customer data, HR records     |
| 10.0 - 20.0 | Weak          | Aggregated analytics          |

### Pre-Training Validation

Always validate DP parameters before training:

```bash
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset-id",
    "generator_type": "dp-ctgan",
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0
  }'
```

**Response:**

```json
{
  "is_valid": true,
  "errors": [],
  "warnings": ["Batch size is 10% of dataset"],
  "recommended_config": {
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0,
    "expected_privacy_level": "Moderate"
  }
}
```

### Get Recommended Parameters

```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id={id}&desired_quality=balanced"
```

## 🎨 Advanced Synthesis Options

### Conditional Generation

Generate data with specific conditions:

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 500,
    "conditions": {
      "age": {"min": 25, "max": 35},
      "income": {"min": 50000}
    }
  }'
```

### Schema-Based Generation

Generate from a data schema without training:

```bash
curl -X POST "http://localhost:8000/generators/schema/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "columns": {
      "name": {"type": "string", "distribution": "normal"},
      "age": {"type": "integer", "min": 18, "max": 80},
      "income": {"type": "float", "mean": 75000, "std": 25000}
    },
    "num_rows": 1000
  }'
```

### Custom Parameters

Fine-tune synthesis parameters:

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 2000,
    "epochs": 100,
    "batch_size": 300,
    "learning_rate": 0.0002,
    "discriminator_steps": 5,
    "pac": 10
  }'
```

## 📊 Quality Optimization

### Parameter Tuning Guide

#### For High Quality (CTGAN)

```json
{
  "epochs": 100,
  "batch_size": 500,
  "learning_rate": 0.0002,
  "discriminator_steps": 5
}
```

#### For Fast Training (TVAE)

```json
{
  "epochs": 30,
  "batch_size": 200,
  "compress_dims": [128, 64],
  "decompress_dims": [64, 128]
}
```

#### For Privacy (DP-CTGAN)

```json
{
  "target_epsilon": 5.0,
  "epochs": 50,
  "batch_size": 100,
  "noise_multiplier": "auto"
}
```

### Quality Metrics to Monitor

After generation, evaluate quality:

```bash
# Quick evaluation
curl -X POST "http://localhost:8000/evaluations/quick/{generator_id}"

# Comprehensive evaluation
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "your-generator-id",
    "dataset_id": "original-dataset-id",
    "include_statistical": true,
    "include_ml_utility": true,
    "include_privacy": false
  }'
```

## 🔄 Background Processing

### Asynchronous Generation

Large datasets are processed asynchronously:

```bash
# Start generation (returns immediately)
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{"generator_type": "ctgan", "num_rows": 10000}'

# Check status periodically
curl http://localhost:8000/generators/{generator_id}
```

### Monitoring Jobs

```bash
# List all jobs
curl http://localhost:8000/jobs/

# Get specific job details
curl http://localhost:8000/jobs/{job_id}
```

## 🛠️ Troubleshooting

### Common Issues

**Generation Fails**

```
Error: Training failed
Solution: Reduce epochs/batch_size, check data quality
```

**Poor Quality Results**

```
Issue: Synthetic data doesn't match real data
Solution: Increase epochs, use CTGAN instead of GaussianCopula
```

**Memory Issues**

```
Error: Out of memory
Solution: Reduce batch_size, use smaller dataset subset
```

**Privacy Validation Fails**

```
Error: Epsilon too low for parameters
Solution: Increase epsilon or reduce epochs/batch_size
```

### Performance Optimization

**Speed Up Training:**

- Use TVAE instead of CTGAN
- Reduce epochs initially
- Increase batch_size
- Use GPU if available

**Improve Quality:**

- Increase epochs gradually
- Use CTGAN for complex data
- Fine-tune learning rates
- Add more training data

**Reduce Memory Usage:**

- Smaller batch sizes
- Process in chunks
- Use TVAE over CTGAN
- Clear cache between runs

## 📈 Best Practices

### Data Preparation

1. **Profile First**: Always run profiling before synthesis
2. **Clean Data**: Remove outliers and inconsistencies
3. **Check PII**: Run PII detection for sensitive data
4. **Scale Appropriately**: Start with smaller datasets

### Method Selection

1. **CTGAN for Quality**: Best for complex, high-fidelity data
2. **TVAE for Speed**: Good balance of quality and performance
3. **DP Variants for Privacy**: When regulatory compliance required
4. **GaussianCopula for Prototyping**: Fast baseline comparisons

### Parameter Tuning

1. **Start Conservative**: Use recommended defaults first
2. **Iterate Gradually**: Increase complexity step by step
3. **Monitor Quality**: Evaluate after each parameter change
4. **Balance Trade-offs**: Quality vs speed vs privacy

### Production Considerations

1. **Validate Parameters**: Always test DP configs first
2. **Monitor Resources**: Watch memory and compute usage
3. **Version Control**: Track parameter sets and results
4. **Audit Trail**: Maintain records for compliance

## 📤 Exporting Reports

### Export to S3

Save evaluation reports (PDF/DOCX) directly to S3 for archival and compliance:

```bash
# Export evaluation as PDF to S3
curl -X POST "http://localhost:8000/llm/evaluations/{evaluation_id}/export-pdf?save_to_s3=true"

# Export as Word document to S3
curl -X POST "http://localhost:8000/llm/evaluations/{evaluation_id}/export-docx?save_to_s3=true"
```

**Response:**
```json
{
  "message": "Report exported successfully",
  "download_url": "https://your-bucket.s3.amazonaws.com/exports/report_abc123.pdf",
  "export_id": "export-uuid"
}
```

### Managing Exports

```bash
# List all exports
curl http://localhost:8000/exports/

# Get exports for a specific generator
curl http://localhost:8000/exports/generator/{generator_id}

# Get exports for a dataset
curl http://localhost:8000/exports/dataset/{dataset_id}

# Download a specific export
curl http://localhost:8000/exports/{export_id}/download
```

### Export Types

| Type | Format | Use Case |
|------|--------|----------|
| **evaluation_report** | PDF/DOCX | Quality assessment documentation |
| **compliance_report** | PDF/DOCX | Regulatory audit trail |
| **model_card** | PDF/DOCX | Model documentation |

## 🔗 Next Steps

After generating synthetic data:

1. **[Evaluate Quality](evaluating-quality.md)** - Assess how well your synthetic data matches the original
2. **[Use Privacy Features](privacy-features.md)** - Learn about differential privacy and compliance
3. **[Explore AI Features](ai-features.md)** - Use AI-powered tools for insights and automation

---

**Need help choosing the right method?** Check our [Method Selection Guide](overview.md#synthesis-methods-overview) or create an issue on GitHub.
