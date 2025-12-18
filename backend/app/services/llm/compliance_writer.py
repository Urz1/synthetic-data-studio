"""Compliance Writer Service

Generates compliance documentation including model cards and audit narratives.
"""

# Standard library
import asyncio
import json
import logging
from typing import Dict, Any
from datetime import datetime

# Local - Module
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

logger = logging.getLogger(__name__)

# Global semaphore to limit concurrent LLM calls to 1
# This prevents rate limit issues when multiple report generations are triggered simultaneously
_llm_semaphore = asyncio.Semaphore(1)



class ComplianceWriter:
    """Generate compliance documentation using LLM"""
    
    def __init__(self):
        """Initialize compliance writer with LLM router"""
        self.router = LLMRouter()
    
    async def generate_model_card(
        self, 
        generator_metadata: Dict[str, Any]
    ) -> str:
        """Generate comprehensive model card following Google/Hugging Face Model Card v2 standard
        
        Args:
            generator_metadata: Generator configuration and evaluation results
            
        Returns:
            Markdown-formatted model card following industry standards
        """
        logger.info(f"Generating model card for generator {generator_metadata.get('generator_id')}")
        
        # Extract key metadata for context
        gen_name = generator_metadata.get('name', 'Synthetic Data Generator')
        gen_type = generator_metadata.get('type', 'Unknown')
        privacy_config = generator_metadata.get('privacy_config', {})
        training_metadata = generator_metadata.get('training_metadata', {})
        
        system_prompt = """You are a senior ML documentation specialist following Google's Model Card framework and Hugging Face's Model Card v2 guidelines.

Your model cards MUST:
- Follow the standard Model Card structure (Model Details → Intended Use → Training → Evaluation → Ethical Considerations)
- Use specific, quantitative metrics where available
- Never use placeholder text like [contact info] or [TBD]
- Include actionable recommendations
- Be suitable for regulatory audits (GDPR, HIPAA, CCPA)

Write in clear, professional English suitable for both technical teams and compliance officers."""

        user_prompt = f"""Create a comprehensive Model Card for this synthetic data generator:

**Generator Configuration:**
{json.dumps(generator_metadata, indent=2, default=str)}

Generate a Model Card in Markdown following this EXACT structure:

# Model Card: {gen_name}

## Model Details

### Basic Information
| Property | Value |
|----------|-------|
| Model Name | {gen_name} |
| Model Type | {gen_type} |
| Version | 1.0 |
| Date Created | [Extract from metadata or use today's date] |
| Framework | Synth Studio by Synthetic Data Platform |
| License | Proprietary - Internal Use |

### Model Description
[2-3 sentences describing what this model does and its primary purpose]

### Technical Specifications
- **Architecture**: [Describe the model architecture: GAN-based, VAE-based, etc.]
- **Training Epochs**: [From metadata]
- **Batch Size**: [From metadata]
- **Privacy Mechanism**: [DP-SGD if differential privacy, None otherwise]

---

## Intended Use

### Primary Use Cases
1. **ML Training Data Augmentation** - Safe synthetic data for model training
2. **Analytics & Reporting** - Privacy-compliant data for dashboards
3. **Software Testing** - Realistic test datasets for QA
4. **Research & Development** - Data exploration without privacy risks

### Out-of-Scope Uses
⚠️ This model should NOT be used for:
- Direct replacement of real data in production without quality validation
- Generating data for domains significantly different from training data
- Creating data intended to deceive or misrepresent as real data
- Medical or legal decisions without expert oversight

### Users
- **Primary**: Data Scientists, ML Engineers, Analytics Teams
- **Secondary**: QA Engineers, Researchers
- **Requires Approval**: External sharing, production deployment

---

## Training Data

### Source Dataset Characteristics
[Describe the source dataset: domain, size, time period, sensitive columns]

### Data Processing
- **Preprocessing**: [Any transformations applied]
- **Feature Engineering**: [Derived features if any]
- **Sensitive Columns Handling**: [How PII/sensitive data was treated]

### Data Governance
- Data was processed in compliance with organizational data governance policies
- Source data access was logged in the audit trail

---

## Evaluation Results

### Statistical Fidelity
| Metric | Score | Interpretation |
|--------|-------|----------------|
| Distribution Similarity | [Score]% | [Good/Fair/Needs Improvement] |
| Correlation Preservation | [Score]% | [Good/Fair/Needs Improvement] |
| Feature Coverage | [Score]% | [Good/Fair/Needs Improvement] |

### ML Utility
| Downstream Task | Real Data Performance | Synthetic Data Performance | Utility Ratio |
|-----------------|----------------------|---------------------------|---------------|
| Classification | [Score] | [Score] | [Ratio] |

### Privacy Assessment
| Privacy Metric | Value | Risk Level |
|----------------|-------|------------|
| Re-identification Risk | [Value] | 🟢 Low / 🟡 Medium / 🔴 High |
| Membership Inference | [Value] | 🟢 Low / 🟡 Medium / 🔴 High |
| Attribute Disclosure | [Value] | 🟢 Low / 🟡 Medium / 🔴 High |

---

## Privacy & Ethical Considerations

### Privacy Protection Measures
{"- **Differential Privacy**: Enabled with ε=" + str(privacy_config.get('target_epsilon', 'N/A')) + ", δ=" + str(privacy_config.get('target_delta', 'N/A')) if privacy_config.get('target_epsilon') else "- **Privacy Mode**: Standard (no formal DP guarantees)"}
- **Data Minimization**: Only necessary columns included in synthesis
- **Pseudonymization**: Direct identifiers removed before training

### Known Limitations
1. Synthetic data may not capture rare edge cases from original data
2. Complex multi-table relationships may have reduced fidelity
3. Time-series patterns may require specialized evaluation

### Bias Considerations
- Biases present in source data may propagate to synthetic data
- Regular bias audits recommended for production use
- Monitor downstream model fairness metrics

### Recommendations for Safe Use
1. ✅ Validate statistical properties before production use
2. ✅ Run privacy tests if sharing externally
3. ✅ Document synthetic data usage in model cards
4. ✅ Regenerate periodically to prevent staleness

---

## Compliance Mapping

| Framework | Requirement | Status |
|-----------|-------------|--------|
| GDPR Art. 25 | Data Protection by Design | ✓ Implemented |
| GDPR Art. 32 | Technical Security Measures | ✓ Encryption at rest |
| HIPAA Safe Harbor | De-identification Standard | [✓/⚠️ Based on config] |
| CCPA | Consumer Privacy Rights | ✓ Synthetic ≠ Personal Data |
| SOC 2 | Confidentiality Controls | ✓ Access Logging |

---

## Maintenance & Support

### Model Refresh
- **Recommended Frequency**: Quarterly or when source data changes significantly
- **Version Control**: Models versioned in Synth Data Studio

### Support
For questions or issues with this synthetic data generator:
- **Platform Support**: support@synthdata.studio
- **Documentation**: https://docs.synthdata.studio
- **Website**: https://www.synthdata.studio

---

*This Model Card was auto-generated by Synth Data Studio following industry-standard documentation practices.*
"""

        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.15,  # Low temperature for consistency
            max_tokens=2500
        )
        
        async with _llm_semaphore:
            try:
                response = await self.router.generate(request, use_case="model_card")
                logger.info(f"Model card generated using {response.provider} in {response.latency_ms}ms")
                return response.content
            
            except Exception as e:
                logger.error(f"Model card generation failed: {e}")
                return self._fallback_model_card(generator_metadata)
    
    def _fallback_model_card(self, metadata: Dict[str, Any]) -> str:
        """Generate basic model card if LLM fails
        
        Args:
            metadata: Generator metadata
            
        Returns:
            Basic model card template following industry standards
        """
        logger.warning("Using fallback model card template")
        
        generator_type = metadata.get("type", "Unknown")
        generator_id = metadata.get("generator_id", "N/A")
        generator_name = metadata.get("name", f"{generator_type} Generator")
        privacy_config = metadata.get("privacy_config", {})
        
        dp_section = ""
        if privacy_config.get("target_epsilon"):
            dp_section = f"""
### Differential Privacy
- **Epsilon (ε)**: {privacy_config.get('target_epsilon', 'N/A')}
- **Delta (δ)**: {privacy_config.get('target_delta', 'N/A')}
- **Privacy Guarantee**: Formal differential privacy with DP-SGD
"""
        else:
            dp_section = """
### Privacy Mode
- **Mode**: Standard synthesis (no formal DP guarantees)
- **Recommendation**: Enable differential privacy for sensitive data
"""

        return f"""# Model Card: {generator_name}

## Model Details

| Property | Value |
|----------|-------|
| Model ID | `{generator_id[:12]}...` |
| Model Type | {generator_type} |
| Generated | {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} |
| Framework | Synth Studio |
| Version | 1.0 |

---

## Intended Use

### Primary Use Cases
1. **ML Training Data Augmentation** - Privacy-safe synthetic data for model training
2. **Analytics & Reporting** - Privacy-compliant data for dashboards and reports
3. **Software Testing** - Realistic test datasets for QA and development
4. **Research & Development** - Data exploration without privacy risks

### Out-of-Scope Uses
⚠️ This model should NOT be used for:
- Direct replacement of real data without quality validation
- Medical or legal decisions without expert oversight
- Creating data intended to deceive or misrepresent

---

## Performance

> ⚠️ **Note**: Run a full evaluation to get detailed performance metrics.

To evaluate this generator:
1. Navigate to Evaluations → New Evaluation
2. Select this generator
3. Review statistical fidelity, ML utility, and privacy metrics

---

## Privacy & Ethical Considerations
{dp_section}
### Known Limitations
1. Synthetic data may not capture rare edge cases from original data
2. Complex relationships may have reduced fidelity
3. Regular re-evaluation recommended for production use

### Recommendations
1. ✅ Validate statistical properties before production use
2. ✅ Run privacy tests if sharing externally
3. ✅ Document usage in downstream model cards
4. ✅ Regenerate periodically to prevent staleness

---

## Compliance Mapping

| Framework | Requirement | Status |
|-----------|-------------|--------|
| GDPR Art. 25 | Data Protection by Design | ✓ Implemented |
| HIPAA | De-identification | Review Required |
| CCPA | Consumer Privacy | ✓ Synthetic Data |

---

## Support

For questions or issues:
- **Platform Support**: support@synthdata.studio
- **Documentation**: https://docs.synthdata.studio
- **Website**: https://www.synthdata.studio

---

*This Model Card was auto-generated by Synth Data Studio. For detailed analysis, please use the LLM-powered documentation feature.*
"""
    
    async def generate_audit_narrative(
        self,
        audit_log: list[Dict[str, Any]]
    ) -> str:
        """Generate human-readable audit narrative from structured logs
        
        Args:
            audit_log: List of audit log entries
            
        Returns:
            Human-readable narrative of events
        """
        logger.info(f"Generating audit narrative for {len(audit_log)} events")
        
        system_prompt = """You are a compliance auditor creating clear, professional audit narratives.
Convert technical logs into readable timelines that non-technical stakeholders can understand."""
        
        user_prompt = f"""Create a professional audit narrative from these events:

Audit Log:
{json.dumps(audit_log, indent=2)}

Generate a narrative with:
1. Title: "Audit Trail: [Brief Description]"
2. For each event:
   - Timestamp (formatted as "HH:MM AM/PM - Event Name")
   - Clear description of what happened
   - Key details (numbers, statuses, etc.)
3. Final compliance status summary

Use professional language. Be concise but complete. Format times clearly."""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.1,  # Very deterministic for compliance
            max_tokens=1500
        )
        
        async with _llm_semaphore:
            try:
                response = await self.router.generate(request, use_case="compliance")
                logger.info(f"Audit narrative generated using {response.provider}")
                return response.content
            
            except Exception as e:
                logger.error(f"Audit narrative generation failed: {e}")
                return self._fallback_audit_narrative(audit_log)
    
    def _fallback_audit_narrative(self, audit_log: list[Dict[str, Any]]) -> str:
        """Generate basic audit narrative if LLM fails
        
        Args:
            audit_log: Audit log entries
            
        Returns:
            Basic narrative
        """
        logger.warning("Using fallback audit narrative")
        
        narrative = "# Audit Trail\n\n"
        
        for entry in audit_log:
            timestamp = entry.get("timestamp", "Unknown time")
            action = entry.get("action", "Unknown action")
            details = entry.get("details", {})
            
            narrative += f"**{timestamp}** - {action}\n"
            if details:
                narrative += f"Details: {json.dumps(details)}\n"
            narrative += "\n"
        
        return narrative
    
    async def generate_privacy_report(
        self,
        generator_metadata: Dict[str, Any]
    ) -> str:
        """Generate comprehensive privacy compliance report in markdown
        
        Args:
            generator_metadata: Generator configuration and privacy settings
            
        Returns:
            Markdown-formatted privacy compliance report
        """
        logger.info(f"[PRIVACY_REPORT_METHOD] generate_privacy_report() called - NOT model card")
        
        system_prompt = """You are a privacy compliance expert specializing in differential privacy and synthetic data.
Generate comprehensive, professional privacy compliance reports following industry best practices.
Use clear, precise language suitable for both technical stakeholders and auditors."""
        
        user_prompt = f"""Create a detailed privacy compliance report for this synthetic data generator:

Generator Metadata:
{json.dumps(generator_metadata, indent=2)}

Generate a privacy compliance report in Markdown format with these sections:

# Privacy Compliance Report

## Generator Information
- Generator Name and Type
- Privacy Mechanism (e.g., Differential Privacy, k-Anonymity)
- Report Generation Date

## Privacy Budget Analysis
**Epsilon (ε) Budget:**
- Target epsilon value
- Spent epsilon (if tracking)
- Remaining budget
- Interpretation of epsilon level (lower = stronger privacy)

**Delta (δ) Budget:**
- Target delta value
- Probability of privacy failure
- Risk assessment

**Budget Utilization:**
- Percentage of budget consumed
- Recommendations for remaining budget

## Privacy Metrics
**K-Anonymity:**
- Minimum group size for re-identification
- Risk level assessment

**L-Diversity:**
- Diversity of sensitive attributes
- Protection against homogeneity attacks

**T-Closeness:**
- Distribution similarity to original
- Protection against attribute disclosure

**Differential Privacy Guarantee:**
- Whether DP is maintained
- Mathematical proof summary

## Risk Assessment
Evaluate privacy risks:
- **Re-identification Risk:** [Very Low/Low/Medium/High]
- **Linkage Attack Risk:** [Very Low/Low/Medium/High]
- **Membership Inference Risk:** [Very Low/Low/Medium/High]
- **Attribute Disclosure Risk:** [Very Low/Low/Medium/High]

For each risk, explain:
1. Current protection measures
2. Potential vulnerabilities
3. Mitigation strategies

## Recommendations
Provide actionable recommendations:
1. **High Priority:** Critical privacy improvements needed
2. **Medium Priority:** Recommended enhancements
3. **Low Priority:** Optional optimizations

Each recommendation should include:
- What to do
- Why it's important
- How to implement

## Compliance Status
Map privacy measures to frameworks:

**GDPR (Article 25 - Data Protection by Design):**
- Privacy by design implementation
- Data minimization measures
- Pseudonymization techniques

**HIPAA Privacy Rule:**
- De-identification methods
- Safe harbor compliance
- Expert determination approach

**CCPA:**
- Consumer privacy rights protection
- Data security measures
- Disclosure prevention

For each framework, indicate: ✓ Compliant, ⚠ Partial, or ✗ Non-Compliant

## Technical Details
- Privacy algorithm details
- Implementation notes
- Audit trail information

Generate a comprehensive, audit-ready report with specific privacy metrics and compliance mappings."""

        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.1,  # Low temperature for consistency
            max_tokens=2500
        )
        
        async with _llm_semaphore:
            try:
                response = await self.router.generate(request, use_case="compliance")
                logger.info(f"Privacy report generated using {response.provider}")
                return response.content
            
            except Exception as e:
                logger.error(f"Privacy report generation failed: {e}")
                return self._fallback_privacy_report(generator_metadata)
    
    def _fallback_privacy_report(self, metadata: Dict[str, Any]) -> str:
        """Generate basic privacy report if LLM fails
        
        Args:
            metadata: Generator metadata
            
        Returns:
            Basic privacy report following industry standards
        """
        logger.warning("Using fallback privacy report")
        
        generator_type = metadata.get("type", "Unknown")
        generator_name = metadata.get("name", f"{generator_type} Generator")
        generator_id = metadata.get("generator_id", "N/A")
        privacy_config = metadata.get("privacy_config", {})
        
        # Determine privacy level
        epsilon = privacy_config.get("target_epsilon")
        delta = privacy_config.get("target_delta")
        
        if epsilon is not None:
            if epsilon <= 1.0:
                privacy_level = "🟢 Strong"
                risk_level = "Low"
            elif epsilon <= 5.0:
                privacy_level = "🟡 Moderate"
                risk_level = "Medium"
            else:
                privacy_level = "🟠 Relaxed"
                risk_level = "Medium-High"
            
            dp_section = f"""
## Privacy Budget Analysis

### Epsilon (ε) Configuration
| Parameter | Value | Interpretation |
|-----------|-------|----------------|
| Target Epsilon | {epsilon} | {"Strong privacy guarantee" if epsilon <= 1.0 else "Moderate privacy" if epsilon <= 5.0 else "Relaxed privacy for utility"} |
| Target Delta | {delta if delta else "1e-5"} | Probability of privacy failure |
| Privacy Level | {privacy_level} | Based on NIST DP guidelines |

### Privacy Guarantee
This generator uses **Differential Privacy (DP-SGD)** to provide mathematically provable privacy guarantees.
The epsilon value of {epsilon} means that the output distribution changes by at most a factor of e^{epsilon} ≈ {round(2.718 ** epsilon, 2)} when any single record is added or removed.
"""
        else:
            privacy_level = "⚠️ Standard"
            risk_level = "Review Required"
            dp_section = """
## Privacy Configuration

### Current Mode
| Parameter | Value |
|-----------|-------|
| Privacy Mode | Standard Synthesis |
| Differential Privacy | Not Enabled |
| Formal Guarantees | None |

> ⚠️ **Recommendation**: Enable differential privacy for sensitive data to provide mathematically provable privacy guarantees.
"""

        return f"""# Privacy Compliance Report

## Document Information

| Property | Value |
|----------|-------|
| Generator | {generator_name} |
| Generator ID | `{str(generator_id)[:12]}...` |
| Generator Type | {generator_type} |
| Report Generated | {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} |
| Privacy Level | {privacy_level} |

---
{dp_section}
---

## Risk Assessment

| Risk Category | Level | Notes |
|---------------|-------|-------|
| Re-identification Risk | {risk_level} | {"DP provides protection" if epsilon else "Manual review needed"} |
| Linkage Attack Risk | {risk_level} | Synthetic data reduces linkage potential |
| Membership Inference | {risk_level} | {"DP mitigates MI attacks" if epsilon else "Consider enabling DP"} |
| Attribute Disclosure | {risk_level} | Depends on data sensitivity |

---

## Compliance Mapping

| Framework | Requirement | Status |
|-----------|-------------|--------|
| GDPR Art. 25 | Data Protection by Design | {"✓ DP Enabled" if epsilon else "⚠️ Review Required"} |
| GDPR Art. 32 | Technical Security Measures | ✓ Encryption at rest |
| HIPAA Safe Harbor | De-identification Standard | {"✓ DP provides safe harbor" if epsilon and epsilon <= 2.0 else "⚠️ Expert review needed"} |
| CCPA | Consumer Privacy Rights | ✓ Synthetic ≠ Personal Data |
| NIST Privacy Framework | Privacy Engineering | {"✓ Formal DP" if epsilon else "⚠️ Informal approach"} |

---

## Recommendations

### {"High Priority" if not epsilon else "Maintenance"}
{"1. **Enable Differential Privacy** - Add formal privacy guarantees for sensitive data" if not epsilon else "1. **Monitor Privacy Budget** - Track epsilon consumption across generations"}

### Medium Priority
2. **Regular Evaluation** - Run privacy metrics assessments periodically
3. **Documentation** - Maintain records of synthetic data usage

### Best Practices
4. ✅ Validate downstream model fairness
5. ✅ Document synthetic data in model cards
6. ✅ Regenerate data when source changes significantly

---

## Support

For privacy compliance questions:
- **Platform Support**: support@synthdata.studio
- **Documentation**: https://docs.synthdata.studio
- **Website**: https://www.synthdata.studio

---

*This Privacy Report was auto-generated by Synth Data Studio. For detailed LLM-powered analysis, ensure the AI service is properly configured.*
"""

    async def generate_compliance_report(
        self,
        generator_metadata: Dict[str, Any],
        framework: str = "GDPR"
    ) -> Dict[str, Any]:
        """Generate compliance framework mapping
        
        Args:
            generator_metadata: Generator configuration
            framework: Compliance framework (GDPR, HIPAA, CCPA, SOC2)
            
        Returns:
            Compliance mapping with controls and assessments
        """
        logger.info(f"Generating {framework} compliance report")
        
        system_prompt = f"""You are a compliance expert specializing in {framework}.
Map synthetic data generation practices to specific {framework} requirements."""
        
        user_prompt = f"""Analyze this synthetic data generator for {framework} compliance:

Generator Configuration:
{json.dumps(generator_metadata, indent=2)}

Provide a JSON response with:
{{
  "framework": "{framework}",
  "compliance_level": "Full/Partial/Non-Compliant",
  "controls_addressed": [
    {{
      "control_id": "specific requirement ID",
      "control_name": "requirement name",
      "how_addressed": "explanation of how generator meets this",
      "evidence": "specific configuration or feature"
    }}
  ],
  "gaps": ["list any compliance gaps"],
  "recommendations": ["suggestions for improvement"]
}}

Be specific with control IDs and evidence."""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,  # Deterministic for compliance
            response_format="json",
            max_tokens=1000
        )
        
        async with _llm_semaphore:
            try:
                response = await self.router.generate(request, use_case="compliance")
                return json.loads(response.content)
            
            except Exception as e:
                logger.error(f"Compliance report generation failed: {e}")
                return {
                    "framework": framework,
                    "compliance_level": "Unknown",
                    "controls_addressed": [],
                    "gaps": ["Unable to generate compliance mapping"],
                    "recommendations": ["Manual compliance review required"]
                }
