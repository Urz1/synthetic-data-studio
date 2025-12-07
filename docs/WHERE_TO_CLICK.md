# 🎯 EXACT UI ACCESS GUIDE - Where to Click!

## Quick Answer: Where to Find Each Feature

### 1️⃣ Privacy Report (JSON + PDF Export)

**PATH**: Generators → Click any generator → Right sidebar → "Privacy Report" button

**Step-by-step**:
```
1. Go to /generators (Main Navigation → Generators)
2. Click on ANY generator in the list
3. Look at the RIGHT SIDEBAR
4. Find the "AI Reports" card
5. Click "Privacy Report" button
6. → Opens /generators/[id]/privacy-report page
7. On that page, click "Export PDF" button to download
```

**What you'll see**:
- ✅ Privacy Budget (epsilon, delta)
- ✅ Privacy Metrics (k-anonymity, l-diversity, t-closeness)
- ✅ Risk Assessment
- ✅ AI Recommendations
- ✅ **"Export PDF" button** - Click to download

---

### 2️⃣ Model Card (JSON + PDF Export)

**PATH**: Generators → Click any generator → Right sidebar → "Model Card" button

**Step-by-step**:
```
1. Go to /generators (Main Navigation → Generators)
2. Click on ANY generator in the list
3. Look at the RIGHT SIDEBAR
4. Find the "AI Reports" card
5. Click "Model Card" button
6. → Opens /generators/[id]/model-card page
7. On that page, click "Export PDF" button to download
```

**What you'll see**:
- ✅ Model Details
- ✅ Intended Use
- ✅ Performance Metrics
- ✅ Training Data Info
- ✅ Ethical Considerations
- ✅ **"Export PDF" button** - Click to download

---

### 3️⃣ AI Improvement Suggestions

**PATH**: Evaluations → Click any evaluation → "AI Improvements" button

**Step-by-step**:
```
1. Go to /evaluations (Main Navigation → Evaluations)
2. Click on ANY completed evaluation
3. Look at the TOP RIGHT of the page
4. Click "AI Improvements" button
5. → Suggestions appear on the same page below metrics
```

**What you'll see**:
- ✅ Areas needing improvement
- ✅ Current vs Target values
- ✅ Implementation steps

---

### 4️⃣ Chat Assistant

**PATH**: Main Navigation → Assistant → Chat tab

**Step-by-step**:
```
1. Click "Assistant" in main navigation
2. Select "Chat" tab (default)
3. Type your question
4. Press Enter or click Send
```

---

### 5️⃣ Metric Explainer

**PATH**: Main Navigation → Assistant → Metric Explainer tab

**Step-by-step**:
```
1. Click "Assistant" in main navigation
2. Select "Metric Explainer" tab
3. Enter metric name (e.g., "Statistical Similarity")
4. Click search button
```

---

### 6️⃣ Feature Generator

**PATH**: Main Navigation → Assistant → Feature Generator tab

**Step-by-step**:
```
1. Click "Assistant" in main navigation
2. Select "Feature Generator" tab
3. Describe your schema (e.g., "e-commerce customer database")
4. Click "Generate Schema Suggestions"
```

---

## 🖼️ Visual Layout

### Generator Details Page Layout:
```
┌─────────────────────────────────────────────────────────┐
│  ← Back    [Generator Name]            [Export Model]   │
│                                        [Generate Data]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Overview] [Training] [Privacy] [Evaluations]          │
│                                                          │
│  ┌────────────────────────┐  ┌──────────────────┐      │
│  │                        │  │  Quick Stats      │      │
│  │  Generator Info        │  │  ✓ 2 Evaluations │      │
│  │  Status: Ready         │  │  ✓ 1000 Rows     │      │
│  │  Type: CTGAN           │  └──────────────────┘      │
│  │                        │                             │
│  └────────────────────────┘  ┌──────────────────┐      │
│                              │  🤖 AI Reports    │      │
│                              │  ┌──────────────┐ │ ← HERE!
│                              │  │🔒 Privacy    │ │
│                              │  │   Report     │ │
│                              │  └──────────────┘ │
│                              │  ┌──────────────┐ │
│                              │  │📋 Model Card │ │
│                              │  └──────────────┘ │
│                              └──────────────────┘
└─────────────────────────────────────────────────────────┘
```

### Privacy Report Page:
```
┌─────────────────────────────────────────────────────────┐
│  Privacy Report                 [Back] [Export PDF] ← CLICK!
│  AI-powered privacy analysis                             │
├─────────────────────────────────────────────────────────┤
│  🔒 Generator Name                    Privacy Score: 87% │
│  Privacy Mechanism: DP-CTGAN                             │
├─────────────────────────────────────────────────────────┤
│  [Budget] [Metrics] [Risk] [Recommendations]             │
│                                                          │
│  Privacy Budget, Metrics, Risk Assessment...             │
└─────────────────────────────────────────────────────────┘
```

### Model Card Page:
```
┌─────────────────────────────────────────────────────────┐
│  Model Card                     [Back] [Export PDF] ← CLICK!
│  AI-generated documentation                              │
├─────────────────────────────────────────────────────────┤
│  📋 Model Details, Intended Use, Metrics...              │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Summary - Click Paths

| Feature | Where to Click |
|---------|---------------|
| **Privacy Report JSON** | Generators → Click generator → Sidebar "Privacy Report" button |
| **Privacy PDF Export** | Privacy Report page → "Export PDF" button |
| **Model Card JSON** | Generators → Click generator → Sidebar "Model Card" button |
| **Model Card PDF Export** | Model Card page → "Export PDF" button |
| **AI Improvements** | Evaluations → Click evaluation → "AI Improvements" button |
| **Chat** | Main Nav → Assistant → Chat tab |
| **Metric Explainer** | Main Nav → Assistant → Metric Explainer tab |
| **Feature Generator** | Main Nav → Assistant → Feature Generator tab |

---

## ⚠️ Important Notes

1. **"Privacy Report" and "Model Card" buttons will be DISABLED** until you generate synthetic data
   - Solution: Click "Generate Data" button first
   
2. **"AI Improvements" button will be DISABLED** until evaluation completes
   - Solution: Wait for evaluation to finish

3. **Export buttons require backend LLM service** to be running
   - If export fails, check backend logs

---

## 🎉 That's It!

**Privacy Report & Model Card buttons are NOW in the generator details page sidebar!**

Just go to any generator and look at the right sidebar under "AI Reports" 🚀
