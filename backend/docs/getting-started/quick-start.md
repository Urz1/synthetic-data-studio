# Quick Start Tutorial

Get up and running with Synthetic Data Studio in 5 minutes! This tutorial will guide you through generating your first synthetic dataset.

## 🎯 What You'll Learn

By the end of this tutorial, you'll know how to:

- Start the Synthetic Data Studio server
- Upload a sample dataset
- Generate synthetic data using CTGAN
- Evaluate the quality of your synthetic data
- Download the results

## 🚀 Step 1: Start the Server

First, make sure you have completed the [Installation Guide](installation.md).

```bash
# Navigate to the backend directory
cd synthetic-data-studio/backend

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:

```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

## 🌐 Step 2: Access the API

Open your browser and visit: http://localhost:8000/docs

You'll see the FastAPI interactive documentation. This is your playground for testing the API!

## 📊 Step 3: Upload a Dataset

Let's use the sample customer data that comes with the project.

### Option A: Use the API (Recommended)

1. In the API docs, find the `POST /datasets/upload` endpoint
2. Click "Try it out"
3. Upload your own CSV file (must have headers)

### Option B: Use curl

```bash
# Upload your dataset
curl -X POST "http://localhost:8000/datasets/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your-dataset.csv"
```

**Expected Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "sample_data.csv",
  "row_count": 1000,
  "column_count": 8,
  "file_size": 45632,
  "upload_timestamp": "2025-11-27T10:30:00Z"
}
```

Copy the `id` from the response - you'll need it in the next steps.

## 🔍 Step 4: Explore Your Data

Let's profile the uploaded dataset to understand its structure.

### Generate a Data Profile

1. Find `POST /datasets/{dataset_id}/profile` in the API docs
2. Replace `{dataset_id}` with your dataset ID
3. Click "Try it out"

**Expected Response:**

```json
{
  "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
  "row_count": 1000,
  "column_count": 8,
  "columns": [
    {
      "name": "customer_id",
      "type": "integer",
      "nullable": false,
      "unique_count": 1000
    },
    {
      "name": "age",
      "type": "integer",
      "nullable": false,
      "min": 18,
      "max": 80,
      "mean": 42.5
    }
  ],
  "correlations": {...}
}
```

## 🤖 Step 5: Generate Synthetic Data

Now for the exciting part - generating synthetic data!

### Basic CTGAN Generation

1. Find `POST /generators/dataset/{dataset_id}/generate` in the API docs
2. Use your dataset ID
3. Set these parameters:
   - `generator_type`: "ctgan"
   - `num_rows`: 500 (half the size for quick demo)

**Request Body:**

```json
{
  "generator_type": "ctgan",
  "num_rows": 500,
  "epochs": 10,
  "batch_size": 100
}
```

**Expected Response:**

```json
{
  "message": "Generation started",
  "generator_id": "660e8400-e29b-41d4-a716-446655440001",
  "estimated_time": "2-3 minutes"
}
```

The generation runs asynchronously. Check the status:

```bash
# Check generator status
curl http://localhost:8000/generators/660e8400-e29b-41d4-a716-446655440001
```

Wait for `"status": "completed"`.

## 📈 Step 6: Evaluate Quality

Let's assess how good our synthetic data is.

### Quick Statistical Evaluation

1. Find `POST /evaluations/quick/{generator_id}` in the API docs
2. Use your generator ID

**Expected Response:**

```json
{
  "generator_id": "660e8400-e29b-41d4-a716-446655440001",
  "quality_level": "Good",
  "overall_score": 0.85,
  "statistical_similarity": {
    "ks_test": 0.92,
    "chi_square": 0.88,
    "wasserstein_distance": 0.15
  },
  "recommendations": [
    "Data quality looks good for most use cases",
    "Consider increasing training epochs for better similarity"
  ]
}
```

## 💾 Step 7: Download Results

### Download Synthetic Dataset

1. Find `GET /datasets/{dataset_id}/download` in the API docs
2. Use the `output_dataset_id` from your generator (check the generator details)

```bash
# Download the synthetic data
curl -O http://localhost:8000/datasets/{output_dataset_id}/download
```

## 🎉 Congratulations!

You've successfully:

- ✅ Started Synthetic Data Studio
- ✅ Uploaded a real dataset
- ✅ Generated synthetic data with CTGAN
- ✅ Evaluated data quality
- ✅ Downloaded your results

## 🔄 Next Steps

### Try Advanced Features

**Differential Privacy Generation:**

```json
{
  "generator_type": "dp-ctgan",
  "num_rows": 500,
  "target_epsilon": 10.0,
  "epochs": 20
}
```

**AI-Powered Chat:**

```bash
curl -X POST http://localhost:8000/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How good is my synthetic data?",
    "evaluation_id": "your-evaluation-id"
  }'
```

### Explore More

- **[User Guides](../user-guide/)**: Learn about all platform features
- **[API Examples](../examples/)**: Code examples and API usage
- **[Tutorials](../tutorials/)**: Step-by-step learning paths
- **[Privacy Features](../user-guide/privacy-features.md)**: Differential privacy deep dive

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**

```bash
# Check if port 8000 is available
netstat -an | grep 8000

# Try a different port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Upload fails:**

- Check file size (max 100MB by default)
- Ensure CSV format with headers
- Verify file path is correct

**Generation takes too long:**

- Reduce `epochs` to 5-10 for testing
- Use smaller `batch_size`
- Try TVAE instead of CTGAN (faster)

**Evaluation fails:**

- Ensure generator status is "completed"
- Check that synthetic data was generated
- Verify dataset IDs are correct

### Get Help

- **API Docs**: http://localhost:8000/docs (comprehensive endpoint reference)
- **Issues**: [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Urz1/synthetic-data-studio/discussions)

---

**Ready for more?** Try the [Basic Synthesis Tutorial](../tutorials/basic-synthesis.md) for a deeper dive! 🚀
