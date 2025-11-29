"""Test script for PDF export functionality."""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.export.report_exporter import report_exporter

def test_pdf_export():
    """Test generating a PDF report."""
    print("Testing PDF export...")
    
    # Mock LLM output (Markdown)
    markdown_content = """
# Model Card: HealthData Generator

## Model Details
- **Name**: HealthData Generator
- **Type**: Gaussian Copula
- **Version**: 1.0.0
- **Date**: 2023-11-29

## Intended Use
This model is intended for generating synthetic healthcare data for testing purposes.
It preserves statistical properties of the original dataset while ensuring privacy.

## Training Data
The model was trained on the `patients.csv` dataset containing 10,000 records.

### Features
| Feature Name | Type | Description |
|--------------|------|-------------|
| age | Integer | Patient age in years |
| diagnosis | Categorical | Primary diagnosis code |
| blood_pressure | Float | Systolic blood pressure |

## Evaluation Results
The model achieved a **95%** statistical similarity score.

```python
# Example usage
from sdv.single_table import GaussianCopulaSynthesizer
model = GaussianCopulaSynthesizer.load('my_model.pkl')
data = model.sample(100)
```

## Ethical Considerations
- **Privacy**: Differential privacy was NOT applied.
- **Bias**: The model may reflect biases present in the original data.

> **Note**: Do not use for clinical decision making.
"""

    try:
        # Generate PDF
        output_path = "test_report.pdf"
        pdf_bytes = report_exporter.export_to_pdf(
            content_markdown=markdown_content,
            title="Model Card: HealthData Generator",
            metadata={
                "generator_id": "12345678-1234-5678-1234-567812345678",
                "dataset_id": "87654321-4321-8765-4321-876543218765",
                "version": "1.0.0"
            },
            output_path=output_path
        )
        
        print(f"✅ PDF generated successfully: {output_path}")
        print(f"Size: {len(pdf_bytes)} bytes")
        
        # Verify file exists
        if os.path.exists(output_path):
            print("File exists on disk.")
        else:
            print("❌ File not found on disk.")
            
    except Exception as e:
        print(f"❌ PDF generation failed: {e}")
        import traceback
        traceback.print_exc()

def test_docx_export():
    """Test generating a DOCX report."""
    print("\nTesting DOCX export...")
    
    # Mock LLM output (same content)
    markdown_content = """
# Model Card: HealthData Generator

## Model Details
- **Name**: HealthData Generator
- **Type**: Gaussian Copula
- **Version**: 1.0.0
- **Date**: 2023-11-29

## Intended Use
This model is intended for generating synthetic healthcare data for testing purposes.

### Features
| Feature Name | Type | Description |
|--------------|------|-------------|
| age | Integer | Patient age in years |
| diagnosis | Categorical | Primary diagnosis code |

## Evaluation Results
The model achieved a **95%** statistical similarity score.

```python
# Example usage
model = GaussianCopulaSynthesizer.load('my_model.pkl')
```
"""

    try:
        # Generate DOCX
        output_path = "test_report.docx"
        file_path = report_exporter.export_to_docx(
            content_markdown=markdown_content,
            title="Model Card: HealthData Generator",
            metadata={
                "generator_id": "12345678-1234-5678-1234-567812345678",
                "version": "1.0.0"
            },
            output_path=output_path
        )
        
        print(f"✅ DOCX generated successfully: {file_path}")
        
        # Verify file exists
        if os.path.exists(output_path):
            print("File exists on disk.")
        else:
            print("❌ File not found on disk.")
            
    except Exception as e:
        print(f"❌ DOCX generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # test_pdf_export()
    test_docx_export()
