"""Compliance Writer Service

Generates compliance documentation including model cards and audit narratives.
"""

import json
import logging
from typing import Dict, Any
from datetime import datetime
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

logger = logging.getLogger(__name__)


class ComplianceWriter:
    """Generate compliance documentation using LLM"""
    
    def __init__(self):
        """Initialize compliance writer with LLM router"""
        self.router = LLMRouter()
    
    async def generate_model_card(
        self, 
        generator_metadata: Dict[str, Any]
    ) -> str:
        """Generate comprehensive model card from generator metadata
        
        Args:
            generator_metadata: Generator configuration and evaluation results
            
        Returns:
            Markdown-formatted model card
        """
        logger.info(f"Generating model card for generator {generator_metadata.get('generator_id')}")
        
        system_prompt = """You are a technical writer specializing in ML model documentation and compliance.
Generate comprehensive, professional model cards following industry best practices.
Use clear, precise language suitable for both technical and non-technical stakeholders."""
        
        user_prompt = f"""Create a detailed model card for this synthetic data generator:

Generator Metadata:
{json.dumps(generator_metadata, indent=2)}

Generate a model card in Markdown format with these sections:

# Model Card: [Generator Name]

## Model Details
- Model Type (e.g., DP-CTGAN, TVAE, etc.)
- Purpose and intended use
- Training date
- Privacy guarantees (if applicable)

## Intended Use
**Primary Use Cases:**
- List 3-5 appropriate use cases

**Out-of-Scope Uses:**
- List 2-3 inappropriate uses

## Training Data
- Source dataset description
- Number of records and features
- Sensitive attributes (if any)
- Data characteristics

## Performance
- Statistical similarity score and interpretation
- ML utility score and interpretation  
- Privacy level assessment
- Overall quality rating

## Privacy & Ethical Considerations
**Privacy Protection:**
- Describe privacy mechanisms used
- Re-identification risk assessment
- Data protection measures

**Limitations:**
- List 2-3 known limitations
- Edge cases or scenarios where quality may degrade

**Bias Considerations:**
- Potential biases from training data
- Recommendations for bias monitoring

## Compliance Mapping
Map to relevant frameworks:
- HIPAA (if healthcare data)
- GDPR Article 25 (Data Protection by Design)
- CCPA (data minimization)
- SOC 2 (confidentiality controls)

## Usage Guidelines
1. Verification steps before use
2. Monitoring recommendations
3. Refresh/regeneration schedule

## Contact
For questions: [contact info]

Be specific with numbers and metrics. Use professional, clear language."""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,  # Slight creativity for better writing
            max_tokens=2000
        )
        
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
            Basic model card template
        """
        logger.warning("Using fallback model card template")
        
        generator_type = metadata.get("type", "Unknown")
        generator_id = metadata.get("generator_id", "N/A")
        
        return f"""# Model Card: {generator_type} Synthetic Data Generator

## Model Details
- **Model ID**: {generator_id}
- **Model Type**: {generator_type}
- **Generated**: {datetime.now().strftime("%Y-%m-%d")}

## Intended Use
This synthetic data generator creates privacy-safe synthetic data for:
- Machine learning model training
- Analytics and reporting
- Testing and development

## Performance
Please run evaluation to get detailed performance metrics.

## Privacy & Ethical Considerations
Review privacy configuration and run privacy tests before production use.

## Usage Guidelines
1. Verify synthetic data quality for your specific use case
2. Monitor for distribution drift
3. Regenerate data periodically

For detailed documentation, please contact your data team.
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
