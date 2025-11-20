# DP Safety Features - Quick Reference

## 🛡️ Protection Layers

### 1️⃣ Pre-Training Validation
Catches bad configurations BEFORE training starts
- ❌ **Error**: Blocks impossible configurations
- ⚠️ **Warning**: Alerts for risky settings
- 💡 **Suggestions**: Provides exact parameter fixes

### 2️⃣ Improved Math
Accurate privacy accounting using RDP
- ✅ Proper formula: `noise = sqrt(2 * steps * ln(1/δ)) / ε`
- ✅ Accounts for composition over multiple epochs
- ✅ No more simplistic heuristics

### 3️⃣ Post-Training Checks
Validates actual privacy spent
- 🔴 **CRITICAL**: If ε >10x target
- ⚠️ **WARNING**: If ε >2x target
- ✅ **SUCCESS**: If within budget

---

## 🚨 What Was Fixed

**Before (Bug)**:
```python
# User's config
epochs = 50
batch_size = 500  # 50% of dataset!
target_epsilon = 10.0

# Result
actual_epsilon = 3180.64  # 🔥 318x over budget!
# No warnings, no errors, just catastrophic privacy failure
```

**After (Fixed)**:
```python
# Same config now raises ValueError:
# ❌ "Batch size (500) is too large (>50% of dataset)"
# ❌ "Too many training steps (100)"
# 💡 "Try: epochs=10 or batch_size=100"
```

---

## 📊 Safe Configuration Rules

### Sampling Rate = batch_size / dataset_size
- ✅ **Safe**: <10%
- ⚠️ **Risky**: 10-20%
- ❌ **Dangerous**: >20%
- 🔥 **Catastrophic**: >50%

### Training Steps = epochs × (dataset_size / batch_size)
- ✅ **Safe**: <500 steps
- ⚠️ **Risky**: 500-1000 steps
- ❌ **Dangerous**: >1000 steps
- 🔥 **Catastrophic**: >2000 steps

### Noise Multiplier (computed automatically)
- ❌ **Impossible**: <0.3
- ⚠️ **Risky**: 0.3-0.5
- ✅ **Safe**: 0.5-2.0
- ✅ **Strong**: >2.0

---

## 🎯 Quick Fixes by Dataset Size

### 1000 rows
```json
{
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
// ✅ sampling_rate=10%, steps=200, expected ε≈10-15
```

### 5000 rows
```json
{
    "epochs": 50,
    "batch_size": 250,
    "target_epsilon": 5.0
}
// ✅ sampling_rate=5%, steps=1000, expected ε≈5-8
```

### 10000+ rows
```json
{
    "epochs": 100,
    "batch_size": 500,
    "target_epsilon": 3.0
}
// ✅ sampling_rate=5%, steps=2000, expected ε≈3-5
```

---

## 🔧 New API Endpoints

### 1. Validate Configuration
Check before training (fast, no model training)
```http
POST /generators/dp/validate-config
{
    "dataset_id": "abc-123",
    "generator_type": "dp-ctgan",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

**Response**:
```json
{
    "is_valid": true,
    "errors": [],
    "warnings": ["Batch size is 10% of dataset..."],
    "recommended_config": {
        "epochs": 20,
        "batch_size": 100,
        ...
    }
}
```

### 2. Get Recommendations
Let the system calculate safe parameters
```http
GET /generators/dp/recommended-config?dataset_id=abc-123&target_epsilon=10.0&desired_quality=balanced
```

**Quality Options**:
- `high_privacy`: ε<5, lower quality
- `balanced`: ε≈10, good quality (default)
- `high_quality`: ε≈15, better quality

**Response**:
```json
{
    "recommended_config": {
        "epochs": 20,
        "batch_size": 100,
        "target_epsilon": 10.0,
        "rationale": {
            "expected_privacy_level": "Moderate"
        }
    }
}
```

---

## 🧪 Testing Workflow

### Step 1: Get Recommendations
```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id={id}&desired_quality=balanced"
```

### Step 2: Validate Your Config
```bash
curl -X POST http://localhost:8000/generators/dp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "{id}",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Step 3: Train if Valid
```bash
curl -X POST http://localhost:8000/generators/dataset/{id}/generate \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Step 4: Check Privacy Report
```bash
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

---

## ⚡ Common Errors & Fixes

### "Batch size too large"
```
❌ batch_size=500 for 1000-row dataset (50%!)
✅ batch_size=100 for 1000-row dataset (10%)
```

### "Too many training steps"
```
❌ epochs=50, batch_size=100, dataset=1000 → 500 steps
✅ epochs=20, batch_size=100, dataset=1000 → 200 steps
```

### "Noise multiplier too low"
```
❌ Can't achieve ε=1.0 with 50 epochs and batch_size=500
✅ Reduce epochs to 10 OR increase ε to 10.0
```

### "Privacy budget exceeded >10x"
```
❌ ε=3180 (should be 10)
💡 This now caught BEFORE training with validation!
```

---

## 📈 Privacy Levels

| Epsilon | Level | Use Case |
|---------|-------|----------|
| <1.0 | Very Strong | Clinical trials, genomic data |
| 1-5 | Strong | Healthcare, financial records |
| 5-10 | Moderate | Customer data, HR records |
| 10-20 | Weak | Aggregated analytics |
| >20 | Minimal | Non-sensitive data only |

---

## 💡 Pro Tips

1. **Always validate first**: Use `/validate-config` before training
2. **Trust recommendations**: `/recommended-config` uses proven formulas
3. **Start conservative**: Begin with `desired_quality=high_privacy`, relax if needed
4. **Check post-training**: Review privacy report for actual epsilon
5. **Small datasets struggle**: DP works best with >1000 rows
6. **Batch size matters most**: Keep it <10% of dataset size
7. **Epochs multiply risk**: More epochs = more privacy loss

---

## 🎓 Understanding the Math

**Privacy Budget (ε, δ)**:
- **ε (epsilon)**: Main privacy loss. Lower = stronger privacy
- **δ (delta)**: Failure probability. Usually 1/n (n=dataset size)

**Composition**:
- Each training step consumes privacy budget
- Total ε = ε_per_step × √(number_of_steps)
- More epochs → more steps → higher ε

**Noise Multiplier**:
- Controls how much noise is added to gradients
- Higher noise = stronger privacy but lower quality
- Formula: `noise ≈ sqrt(2 × steps × ln(1/δ)) / ε`

**Sampling Rate**:
- Fraction of dataset used per batch
- Higher rate = faster privacy depletion
- Keep <10% for good privacy-utility trade-off

---

## ✅ Success Checklist

After implementing safety features:
- [ ] Original failing config (epochs=50, batch_size=500) now blocked
- [ ] Validation endpoint returns accurate errors/warnings
- [ ] Recommended configs produce ε within 2x of target
- [ ] Privacy reports show validation status
- [ ] Both DP-CTGAN and DP-TVAE protected
- [ ] Clear, actionable error messages
- [ ] Fast validation (<1s without training)

---

## 🔗 Related Files

- `app/services/privacy/dp_config_validator.py` - Validation logic
- `app/services/synthesis/dp_ctgan_service.py` - DP-CTGAN with validation
- `app/services/synthesis/dp_tvae_service.py` - DP-TVAE with validation
- `app/generators/routes.py` - New API endpoints
- `PHASE3_SAFETY_TESTING.md` - Detailed testing guide

---

## 📞 Quick Reference Card

**Default Safe Config (1000 rows)**:
```json
{
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

**High Privacy (1000 rows)**:
```json
{
    "epochs": 10,
    "batch_size": 50,
    "target_epsilon": 5.0
}
```

**High Quality (1000 rows)**:
```json
{
    "epochs": 30,
    "batch_size": 200,
    "target_epsilon": 15.0
}
```

---

**Remember**: When in doubt, use `/recommended-config` endpoint! 🎯
