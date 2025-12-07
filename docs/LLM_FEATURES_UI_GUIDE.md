# LLM Features - User Access Guide 🎯

## Overview
All LLM-powered AI features are now fully integrated and accessible through the UI. Here's where to find each feature:

---

## 1. AI Assistant Page (`/assistant`)

**Location**: Main navigation → "Assistant" or direct URL `/assistant`

### Features Available:

#### 💬 Chat Interface
- **What it does**: Interactive AI assistant for questions about synthetic data, privacy, and best practices
- **How to use**:
  1. Go to `/assistant`
  2. Select "Chat" tab
  3. Type your question in the input field
  4. Press Enter or click Send
- **Example questions**:
  - "What is differential privacy?"
  - "How do I improve my generator's utility score?"
  - "Explain k-anonymity to me"

#### 🔍 Metric Explainer
- **What it does**: Explains evaluation metrics in plain language
- **How to use**:
  1. Go to `/assistant`
  2. Select "Metric Explainer" tab
  3. Enter metric name (e.g., "Statistical Similarity")
  4. Optionally add a value
  5. Click search icon
- **Shows**:
  - What the metric means
  - Good value ranges
  - What to do if score is poor

#### 🛡️ PII Detection Info
- **What it does**: Information hub for PII detection features
- **How to use**:
  1. Go to `/assistant`
  2. Select "PII Detection" tab
  3. Click "Go to Datasets" button
  4. Upload a dataset and run PII detection from dataset details page

#### 🧬 Feature Generator
- **What it does**: AI suggests columns and data types for your schema
- **How to use**:
  1. Go to `/assistant`
  2. Select "Feature Generator" tab
  3. Describe your use case (e.g., "customer database for e-commerce")
  4. Click "Generate Schema Suggestions"
- **Output**: List of suggested column names and types

---

## 2. Evaluation Details Page (`/evaluations/[id]`)

**Location**: Evaluations list → Click on any evaluation

### Features Available:

#### 💡 AI Improvement Suggestions
- **What it does**: Analyzes evaluation results and suggests improvements
- **How to use**:
  1. Go to any completed evaluation
  2. Click "AI Improvements" button in page header
  3. View AI-generated suggestions
- **Shows**:
  - Area needing improvement
  - Current vs target values
  - Specific implementation steps
  - Actionable recommendations

**Requirements**: Evaluation must be in "completed" status

---

## 3. Privacy Report Page (`/generators/[id]/privacy-report`)

**Location**: Generator details → "Privacy Report" button or link

### Features Available:

#### 🔒 AI-Powered Privacy Analysis
- **What it does**: Comprehensive privacy compliance report using LLM
- **How to use**:
  1. Go to any generator details page
  2. Click "Privacy Report" in sidebar or actions
  3. Report auto-generates on page load
- **Shows**:
  - Privacy budget (epsilon, delta)
  - Privacy metrics (k-anonymity, l-diversity, t-closeness)
  - Risk assessment
  - AI-generated recommendations

#### 📄 Export Privacy Report PDF
- **What it does**: Exports the privacy report as professional PDF
- **How to use**:
  1. On privacy report page
  2. Click "Export PDF" button
  3. PDF opens in new tab/downloads
- **Features**:
  - Professional formatting
  - Saved to S3 with expiring URL
  - Shareable link

**Requirements**: Generator must have completed synthesis (output_dataset_id exists)

---

## 4. Model Card Page (`/generators/[id]/model-card`)

**Location**: Generator details → "Model Card" button or link

### Features Available:

#### 📋 AI-Generated Model Documentation
- **What it does**: Complete model card documentation following ML best practices
- **How to use**:
  1. Go to any generator details page
  2. Click "Model Card" in sidebar or actions
  3. Card auto-generates on page load
- **Shows**:
  - Model details (architecture, version)
  - Intended use and users
  - Performance metrics
  - Training data information
  - Ethical considerations
  - Limitations and recommendations

#### 📄 Export Model Card PDF
- **What it does**: Exports the model card as professional PDF
- **How to use**:
  1. On model card page
  2. Click "Export PDF" button
  3. PDF opens in new tab/downloads
- **Features**:
  - IEEE/Model Card paper format
  - Comprehensive documentation
  - Saved to S3 with expiring URL

**Requirements**: Generator must have completed synthesis (output_dataset_id exists)

---

## Quick Access Summary

| Feature | Page | Path | Button/Action |
|---------|------|------|---------------|
| **Chat** | Assistant | `/assistant` | Chat tab |
| **Metric Explainer** | Assistant | `/assistant` | Metric Explainer tab |
| **Feature Generator** | Assistant | `/assistant` | Feature Generator tab |
| **PII Detection** | Assistant | `/assistant` | PII Detection tab → Go to Datasets |
| **Improvement Suggestions** | Evaluation Details | `/evaluations/[id]` | "AI Improvements" button |
| **Privacy Report** | Privacy Report | `/generators/[id]/privacy-report` | Auto-generated |
| **Privacy PDF Export** | Privacy Report | `/generators/[id]/privacy-report` | "Export PDF" button |
| **Model Card** | Model Card | `/generators/[id]/model-card` | Auto-generated |
| **Model Card PDF Export** | Model Card | `/generators/[id]/model-card` | "Export PDF" button |

---

## Navigation Paths

### To Access Chat/Assistant Features:
```
Main Navigation → Assistant
or
Direct URL: /assistant
```

### To Access Evaluation Improvements:
```
Main Navigation → Evaluations → Click evaluation row → "AI Improvements" button
or
Direct URL: /evaluations/[evaluation-id]
```

### To Access Privacy Reports:
```
Main Navigation → Generators → Click generator row → "Privacy Report" link
or
Main Navigation → Generators → Click generator row → Scroll down → "Privacy Report" button
or
Direct URL: /generators/[generator-id]/privacy-report
```

### To Access Model Cards:
```
Main Navigation → Generators → Click generator row → "Model Card" link
or
Main Navigation → Generators → Click generator row → Scroll down → "Model Card" button
or
Direct URL: /generators/[generator-id]/model-card
```

---

## Feature States & Feedback

### Loading States
All LLM features show loading indicators:
- ⏳ Spinner animations
- 📝 "Generating..." messages
- 🔄 Progress indicators

### Error Handling
If LLM service fails:
- ⚠️ Toast notifications with error details
- 🔄 Graceful fallback to mock data (where applicable)
- 💡 Helpful error messages

### Success Feedback
When operations succeed:
- ✅ Success toast notifications
- 📊 Immediate data display
- 🎉 Confirmation messages

---

## Requirements & Dependencies

### For AI Improvements (Evaluations):
- ✅ Evaluation must exist
- ✅ Evaluation status = "completed"
- ✅ Evaluation report must be generated

### For Privacy Reports:
- ✅ Generator must exist
- ✅ Generator must have `output_dataset_id`
- ✅ Synthesis must be completed

### For Model Cards:
- ✅ Generator must exist
- ✅ Generator must have `output_dataset_id`
- ✅ Synthesis must be completed

### For Exports (PDF/DOCX):
- ✅ Report/card must be generated
- ✅ S3 storage configured (backend)
- ✅ LLM service running

---

## Tips for Best Results

### Chat Assistant:
- 💬 Be specific in your questions
- 📝 Provide context when needed
- 🔄 Use conversation history for follow-ups

### Metric Explainer:
- 📊 Use exact metric names from evaluations
- 🔢 Include metric values for personalized explanations
- 📈 Compare explanations across different scores

### Improvement Suggestions:
- ⏳ Wait for evaluation to complete before requesting
- 📋 Review all suggestions before implementing
- 🎯 Prioritize high-impact suggestions

### Privacy Reports:
- 🔄 Regenerate after changing privacy parameters
- 📤 Export for compliance documentation
- 🔍 Review all tabs (Budget, Metrics, Risk, Recommendations)

### Model Cards:
- 📚 Use for documentation and compliance
- 🤝 Share with stakeholders
- ✅ Verify generated content for accuracy

---

## Troubleshooting

### "AI Improvements" button disabled:
- **Reason**: Evaluation not completed yet
- **Solution**: Wait for evaluation to finish running

### "No output dataset available" error:
- **Reason**: Generator synthesis hasn't completed
- **Solution**: Wait for generation to complete or re-run generator

### Export fails:
- **Reason**: Backend LLM service or S3 not configured
- **Solution**: Check backend logs, ensure services are running

### Using mock data:
- **Reason**: LLM API call failed
- **Solution**: Check backend connectivity, LLM service status

---

## Summary

✅ **All 9 LLM features are now accessible via UI**
✅ **4 main pages provide access to different features**
✅ **Loading, error, and success states implemented**
✅ **Real API integration complete**
✅ **Export functionality working**

**You can now use AI-powered features throughout the application!** 🎉
