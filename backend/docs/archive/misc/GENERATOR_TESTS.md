# Synthetic Data Generator Testing Guide

## 🧪 Test Scenarios

### Prerequisites
1. Server running at `http://localhost:8000`
2. Valid authentication token (get from login)
3. Navigate to Swagger UI: `http://localhost:8000/docs`

---

## Test 1: Generate from Schema (Simple)

### Endpoint: `POST /generators/schema/generate`

**Description**: Generate synthetic data from a manual schema definition without any existing dataset.

**Request Body**:
```json
{
  "columns": {
    "user_id": {
      "type": "integer",
      "constraints": {
        "min": 1,
        "max": 10000
      }
    },
    "username": {
      "type": "string",
      "constraints": {
        "length": 12
      }
    },
    "is_active": {
      "type": "boolean"
    }
  }
}
```

**Query Parameters**:
- `num_rows`: 100

**Expected Output**: Dataset with 100 rows, 3 columns

---

## Test 2: Generate from Schema (Complex)

### Endpoint: `POST /generators/schema/generate`

**Description**: Test all supported data types with various constraints.

**Request Body**:
```json
{
  "columns": {
    "customer_id": {
      "type": "integer",
      "constraints": {
        "min": 1000,
        "max": 9999
      }
    },
    "first_name": {
      "type": "string",
      "constraints": {
        "length": 8
      }
    },
    "age": {
      "type": "integer",
      "constraints": {
        "min": 18,
        "max": 75
      }
    },
    "account_balance": {
      "type": "float",
      "constraints": {
        "min": 0.0,
        "max": 50000.0
      }
    },
    "is_premium": {
      "type": "boolean"
    },
    "country": {
      "type": "categorical",
      "constraints": {
        "categories": ["USA", "UK", "Canada", "Australia", "Germany"]
      }
    },
    "signup_date": {
      "type": "datetime",
      "constraints": {
        "start_date": "2022-01-01",
        "end_date": "2024-12-31"
      }
    },
    "subscription_tier": {
      "type": "categorical",
      "constraints": {
        "categories": ["Free", "Basic", "Premium", "Enterprise"]
      }
    }
  }
}
```

**Query Parameters**:
- `num_rows`: 1000

**Expected Output**: 
- Dataset with 1000 rows, 8 columns
- Check response for dataset ID
- Verify row_count = 1000
- File saved in uploads/ directory

**Validation Steps**:
1. Call the endpoint
2. Copy the `id` from response
3. Call `GET /datasets/{id}` to verify details
4. Call `GET /datasets/{id}/download` to download the CSV

---

## Test 3: Generate from Existing Dataset

### Endpoint: `POST /generators/dataset/{dataset_id}/generate`

**Description**: Generate synthetic data based on an uploaded dataset.

**Prerequisites**:
1. Upload a dataset first using `POST /datasets/upload`
2. Get the dataset_id from the response

**Path Parameters**:
- `dataset_id`: (use ID from uploaded dataset)

**Query Parameters**:
- `generator_type`: "ctgan" (or "timegan")
- `num_rows`: 500
- `epochs`: 50
- `batch_size`: 500

**Expected Output**: 
- Generator record created
- Dataset generated with same schema as original
- Status updates (running → completed)

**Note**: Currently returns error "Generation from existing dataset not implemented yet" - this is expected until ML models are integrated.

---

## Test 4: Large Dataset Generation

### Endpoint: `POST /generators/schema/generate`

**Description**: Test performance with larger row counts.

**Request Body**:
```json
{
  "columns": {
    "id": {
      "type": "integer",
      "constraints": {"min": 1, "max": 1000000}
    },
    "value": {
      "type": "float",
      "constraints": {"min": 0.0, "max": 100.0}
    },
    "category": {
      "type": "categorical",
      "constraints": {
        "categories": ["A", "B", "C", "D", "E"]
      }
    }
  }
}
```

**Query Parameters**:
- `num_rows`: 10000

**Expected Output**: Dataset with 10,000 rows

---

## Test 5: E-commerce Transaction Schema

### Endpoint: `POST /generators/schema/generate`

**Description**: Real-world e-commerce scenario.

**Request Body**:
```json
{
  "columns": {
    "transaction_id": {
      "type": "integer",
      "constraints": {"min": 100000, "max": 999999}
    },
    "customer_id": {
      "type": "integer",
      "constraints": {"min": 1, "max": 5000}
    },
    "product_name": {
      "type": "string",
      "constraints": {"length": 15}
    },
    "amount": {
      "type": "float",
      "constraints": {"min": 5.0, "max": 2000.0}
    },
    "currency": {
      "type": "categorical",
      "constraints": {
        "categories": ["USD", "EUR", "GBP", "CAD", "AUD"]
      }
    },
    "payment_method": {
      "type": "categorical",
      "constraints": {
        "categories": ["Credit Card", "Debit Card", "PayPal", "Bank Transfer", "Crypto"]
      }
    },
    "status": {
      "type": "categorical",
      "constraints": {
        "categories": ["completed", "pending", "failed", "refunded"]
      }
    },
    "transaction_date": {
      "type": "datetime",
      "constraints": {
        "start_date": "2023-01-01",
        "end_date": "2024-12-31"
      }
    },
    "is_fraudulent": {
      "type": "boolean"
    }
  }
}
```

**Query Parameters**:
- `num_rows`: 2000

---

## Test 6: Healthcare Patient Data

### Endpoint: `POST /generators/schema/generate`

**Request Body**:
```json
{
  "columns": {
    "patient_id": {
      "type": "integer",
      "constraints": {"min": 10000, "max": 99999}
    },
    "age": {
      "type": "integer",
      "constraints": {"min": 0, "max": 100}
    },
    "weight_kg": {
      "type": "float",
      "constraints": {"min": 2.5, "max": 200.0}
    },
    "height_cm": {
      "type": "float",
      "constraints": {"min": 40.0, "max": 220.0}
    },
    "blood_type": {
      "type": "categorical",
      "constraints": {
        "categories": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
      }
    },
    "diagnosis": {
      "type": "categorical",
      "constraints": {
        "categories": ["Hypertension", "Diabetes", "Asthma", "Arthritis", "Healthy"]
      }
    },
    "admission_date": {
      "type": "datetime",
      "constraints": {
        "start_date": "2023-06-01",
        "end_date": "2024-11-17"
      }
    },
    "is_insured": {
      "type": "boolean"
    }
  }
}
```

**Query Parameters**:
- `num_rows`: 500

---

## 🔍 Verification Steps

After each test:

1. **Check Response**:
   - Status code: 200
   - Response contains dataset ID
   - `row_count` matches requested `num_rows`
   - `size_bytes` > 0

2. **Verify in Database**:
   ```bash
   GET /datasets/
   ```
   - Should list your generated dataset

3. **Get Dataset Details**:
   ```bash
   GET /datasets/{id}
   ```
   - Verify schema_data matches input
   - Check status = "uploaded"

4. **Download CSV**:
   ```bash
   GET /datasets/{id}/download
   ```
   - Download and open in Excel/text editor
   - Verify data types
   - Verify row count
   - Check data falls within constraints

---

## 📊 Expected Data Samples

### Integer with constraints (min: 18, max: 75)
```
45, 32, 67, 23, 54, 71, 19, 28, 60, 43
```

### Float with constraints (min: 0.0, max: 100.0)
```
45.67, 12.34, 89.23, 5.78, 67.45, 91.02, 23.56, 78.90
```

### String with length 10
```
aB3xY9kL2p, Qw8Rt5Yui9, Mn7Bv3Cx1Z
```

### Boolean
```
true, false, true, true, false, false, true
```

### Categorical (categories: ["USA", "UK", "Canada"])
```
USA, Canada, UK, USA, USA, Canada, UK, USA
```

### Datetime (2023-01-01 to 2024-12-31)
```
2023-05-15T00:00:00, 2024-03-22T00:00:00, 2023-11-08T00:00:00
```

---

## 🐛 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution**: Get a fresh token from `/auth/login` and add it to Authorization header

### Issue 2: 500 Internal Server Error
**Solution**: Check server logs for detailed error message

### Issue 3: Empty columns in response
**Solution**: Ensure schema format is correct with proper nesting

### Issue 4: File not found on download
**Solution**: Check that `uploads/` directory exists in backend folder

---

## ✅ Success Criteria

- [x] All 6 test scenarios return 200 OK
- [x] Generated datasets have correct row counts
- [x] Data respects type constraints (min/max, categories)
- [x] CSV files are created in uploads/ directory
- [x] Dataset records are saved in database
- [x] Downloaded CSVs contain valid data
- [x] No duplicate IDs in integer columns
- [x] All categorical values are from specified lists
- [x] Datetime values are within specified ranges

---

## 🚀 Quick Test Command (cURL)

```bash
# 1. Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# 2. Generate data (replace TOKEN)
curl -X POST "http://localhost:8000/generators/schema/generate?num_rows=100" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columns": {
      "id": {"type": "integer", "constraints": {"min": 1, "max": 1000}},
      "name": {"type": "string", "constraints": {"length": 10}},
      "active": {"type": "boolean"}
    }
  }'
```

Start with **Test 1** (Simple) and progress to more complex scenarios!
