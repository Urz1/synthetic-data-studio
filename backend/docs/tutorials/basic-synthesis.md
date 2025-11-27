# Basic Synthesis Tutorial

A hands-on tutorial for generating your first synthetic dataset using Synthetic Data Studio. Perfect for beginners who want to understand the end-to-end workflow.

## 🎯 Tutorial Goals

By the end of this tutorial, you will:
- Understand the basic concepts of synthetic data generation
- Upload and analyze a real dataset
- Generate synthetic data using different methods
- Compare original and synthetic data quality
- Download and use your synthetic dataset

**Time Required**: 20-30 minutes
**Difficulty**: Beginner
**Prerequisites**: None

## 📋 What You'll Need

- **Synthetic Data Studio**: Running at http://localhost:8000
- **Sample Dataset**: We'll use the included `sample_data.csv`
- **Web Browser**: For API testing
- **Terminal/Command Line**: For curl commands (optional)

## 📊 Step 1: Understanding Your Data

### The Sample Dataset

Let's start with a simple customer dataset that includes:

- **Customer information**: IDs, demographics
- **Financial data**: Income, credit scores
- **Behavioral data**: Purchase history, preferences

### Data Privacy Considerations

Before generating synthetic data, consider:
- **PII Detection**: Which columns contain personal information?
- **Privacy Requirements**: Do you need differential privacy?
- **Use Case**: What will the synthetic data be used for?

## 🚀 Step 2: Upload Your Dataset

### Method 1: Using the API Interface (Recommended)

1. **Open API Documentation**
   Visit: http://localhost:8000/docs

2. **Find the Upload Endpoint**
   - Scroll to `POST /datasets/upload`
   - Click "Try it out"

3. **Upload the Sample File**
   - Click "Choose File"
   - Select `sample_data.csv` from your project directory
   - Click "Execute"

4. **Check the Response**
   ```json
   {
     "id": "550e8400-e29b-41d4-a716-446655440000",
     "filename": "sample_data.csv",
     "row_count": 1000,
     "column_count": 8,
     "file_size": 45632,
     "upload_timestamp": "2025-11-27T14:30:00Z"
   }
   ```

**Save the dataset ID** - you'll need it for the next steps!

### Method 2: Using curl

```bash
# Upload the dataset
curl -X POST "http://localhost:8000/datasets/upload" \
  -F "file=@sample_data.csv"

# Expected response contains dataset ID
```

## 🔍 Step 3: Analyze Your Data

### Generate a Data Profile

Data profiling helps you understand:
- Column data types and distributions
- Missing values and data quality issues
- Correlations between variables
- Potential privacy concerns

1. **Find the Profile Endpoint**
   - `POST /datasets/{dataset_id}/profile`
   - Replace `{dataset_id}` with your dataset ID

2. **Execute the Request**
   - Click "Try it out"
   - Enter your dataset ID
   - Click "Execute"

3. **Review the Profile**
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
         "unique_count": 1000,
         "min": 1,
         "max": 1000
       },
       {
         "name": "age",
         "type": "integer",
         "nullable": false,
         "min": 18,
         "max": 80,
         "mean": 42.5,
         "std": 15.2
       }
     ],
     "correlations": {
       "age-income": 0.45,
       "income-credit_score": 0.32
     }
   }
   ```

### Key Insights from Profiling

- **Data Types**: Mix of integers, floats, and strings
- **Data Quality**: No missing values in this sample
- **Correlations**: Age and income are moderately correlated
- **Distribution**: Age ranges from 18-80 with mean ~43

## 🤖 Step 4: Generate Synthetic Data

### Choose Your Synthesis Method

Synthetic Data Studio offers multiple synthesis methods:

| Method | Best For | Speed | Quality | When to Use |
|--------|----------|-------|---------|-------------|
| **CTGAN** | Complex data | Medium | Excellent | Most cases |
| **TVAE** | Mixed types | Fast | Good | Quick results |
| **GaussianCopula** | Simple stats | Very Fast | Fair | Prototyping |

**For this tutorial**: We'll use CTGAN for the best quality results.

### Start Generation

1. **Find the Generation Endpoint**
   - `POST /generators/dataset/{dataset_id}/generate`
   - Use your dataset ID

2. **Configure Parameters**
   ```json
   {
     "generator_type": "ctgan",
     "num_rows": 500,
     "epochs": 50,
     "batch_size": 200
   }
   ```

3. **Execute Generation**
   - Click "Try it out"
   - Enter your dataset ID
   - Set the parameters above
   - Click "Execute"

4. **Monitor Progress**
   ```json
   {
     "message": "Generation started",
     "generator_id": "660e8400-e29b-41d4-a716-446655440001",
     "estimated_time": "2-3 minutes"
   }
   ```

### Understanding the Parameters

- **generator_type**: "ctgan" (best quality)
- **num_rows**: 500 (half the original size)
- **epochs**: 50 (training iterations)
- **batch_size**: 200 (training batch size)

## 📈 Step 5: Monitor Generation

### Check Generation Status

Since generation runs asynchronously, you need to check its progress:

1. **Find the Generator Status Endpoint**
   - `GET /generators/{generator_id}`
   - Use the generator ID from step 4

2. **Check Status Regularly**
   - Click "Try it out"
   - Enter generator ID
   - Click "Execute"

3. **Status Response**
   ```json
   {
     "id": "660e8400-e29b-41d4-a716-446655440001",
     "status": "running",
     "progress": 75,
     "created_at": "2025-11-27T14:35:00Z",
     "updated_at": "2025-11-27T14:37:30Z"
   }
   ```

4. **Wait for Completion**
   - Status will change to "completed"
   - This takes 2-3 minutes for CTGAN

### What Happens During Generation?

1. **Model Training**: CTGAN learns patterns in your data
2. **Privacy Accounting**: Tracks privacy budget (if using DP)
3. **Sample Generation**: Creates new synthetic records
4. **Quality Validation**: Basic checks on generated data

## 📊 Step 6: Evaluate Quality

### Quick Statistical Evaluation

Once generation completes, evaluate how well the synthetic data matches the original:

1. **Find the Quick Evaluation Endpoint**
   - `POST /evaluations/quick/{generator_id}`

2. **Run Evaluation**
   - Use your generator ID
   - Click "Execute"

3. **Review Results**
   ```json
   {
     "generator_id": "660e8400-e29b-41d4-a716-446655440001",
     "quality_level": "Good",
     "overall_score": 0.87,
     "statistical_similarity": {
       "ks_test": 0.91,
       "chi_square": 0.89,
       "wasserstein_distance": 0.12
     },
     "recommendations": [
       "Data quality looks excellent for most applications",
       "Statistical distributions are well-preserved"
     ]
   }
   ```

### Understanding the Scores

- **Overall Score**: 0.87 (87% quality retention)
- **KS Test**: 0.91 (excellent distribution matching)
- **Chi-Square**: 0.89 (good categorical data matching)
- **Wasserstein Distance**: 0.12 (acceptable distribution difference)

## 💾 Step 7: Download Results

### Get Your Synthetic Dataset

1. **Find the Download Endpoint**
   - First, get the output dataset ID from the generator:
   - `GET /generators/{generator_id}`

2. **Locate Output Dataset**
   ```json
   {
     "id": "660e8400-e29b-41d4-a716-446655440001",
     "output_dataset_id": "770e8400-e29b-41d4-a716-446655440002",
     "status": "completed"
   }
   ```

3. **Download the Data**
   - `GET /datasets/{output_dataset_id}/download`
   - Use the output_dataset_id
   - Click "Execute" to download

4. **Save the File**
   - Your browser will download `dataset_{id}.csv`
   - This contains your 500 synthetic customer records

## 🔍 Step 8: Compare Original vs Synthetic

### Basic Comparison

Let's examine both datasets to see the differences:

**Original Data Sample:**
```csv
customer_id,age,income,credit_score,purchases,category,region,signup_date
1,35,65000,720,12,A,East,2023-01-15
2,42,78000,680,8,B,West,2023-02-20
3,28,45000,750,15,A,North,2023-01-08
```

**Synthetic Data Sample:**
```csv
customer_id,age,income,credit_score,purchases,category,region,signup_date
1,34,64800,718,11,A,East,2023-01-14
2,41,77500,685,9,B,West,2023-02-18
3,29,45200,748,14,A,North,2023-01-09
```

**Key Observations:**
- ✅ **Similar distributions**: Ages, incomes look realistic
- ✅ **Preserved correlations**: High earners still tend to have better credit
- ✅ **Realistic values**: No impossible combinations
- ✅ **Category balance**: A/B categories maintained

## 🎯 Step 9: Experiment with Different Methods

### Try TVAE for Speed

1. **Generate with TVAE**
   ```json
   {
     "generator_type": "tvae",
     "num_rows": 500,
     "epochs": 30,
     "batch_size": 100
   }
   ```

2. **Compare Results**
   - TVAE is usually 2-3x faster than CTGAN
   - Quality might be slightly lower for complex data
   - Better for mixed data types

### Try GaussianCopula for Simplicity

1. **Generate with GaussianCopula**
   ```json
   {
     "generator_type": "gaussian_copula",
     "num_rows": 500
   }
   ```

2. **Compare Results**
   - Very fast (seconds)
   - Good for simple statistical properties
   - May not capture complex correlations

## 🏆 Tutorial Complete!

### What You Accomplished

✅ **Uploaded a real dataset** to Synthetic Data Studio
✅ **Analyzed data structure** and quality
✅ **Generated synthetic data** using CTGAN
✅ **Evaluated quality** with statistical tests
✅ **Downloaded results** for use in your applications
✅ **Compared original vs synthetic** data characteristics

### Your Synthetic Dataset is Ready!

You now have:
- **500 synthetic customer records**
- **Statistical properties** similar to original data
- **Privacy-safe** data for development/testing
- **Quality-validated** results

## 🚀 Next Steps

### Advanced Tutorials

1. **[Privacy Synthesis Tutorial](privacy-synthesis.md)**: Learn differential privacy
2. **[Quality Evaluation Tutorial](quality-evaluation.md)**: Deep dive into evaluation metrics
3. **[Compliance Reporting Tutorial](compliance-reporting.md)**: Generate audit documentation

### Practical Applications

- **Use synthetic data** in development environments
- **Test ML models** with diverse, realistic data
- **Share data safely** with partners (no real PII)
- **Scale up** to larger datasets and more complex scenarios

### Further Learning

- **API Reference**: Explore all available endpoints
- **User Guides**: Learn about advanced features
- **Developer Docs**: Build integrations and custom workflows

## 🆘 Troubleshooting

### Common Issues

**Generation Takes Too Long**
- Reduce `epochs` to 20-30 for testing
- Use TVAE instead of CTGAN
- Try smaller `batch_size`

**Poor Quality Results**
- Increase `epochs` for better training
- Switch from GaussianCopula to CTGAN
- Check if your data has complex patterns

**API Errors**
- Verify dataset/generator IDs are correct
- Check server logs for error details
- Ensure server is running

**Download Fails**
- Wait for generation to complete (status = "completed")
- Check that output_dataset_id exists
- Verify file permissions

### Getting Help

- **API Docs**: http://localhost:8000/docs (try endpoints directly)
- **Logs**: Check server console for error messages
- **GitHub**: Create issues for bugs or questions

---

**Congratulations!** 🎉 You've successfully generated your first synthetic dataset. Ready to explore more advanced features?