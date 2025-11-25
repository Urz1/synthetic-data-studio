"""Demo Test for LLM Integration Features

This script demonstrates all new LLM-powered endpoints:
1. Chat interface
2. Improvement suggestions
3. Metric explanations
4. Model card generation
5. Audit narratives
6. Compliance reports
7. Enhanced PII detection
"""

import asyncio
import json
from app.services.llm.chat_service import ChatService
from app.services.llm.compliance_writer import ComplianceWriter
from app.services.llm.enhanced_pii_detector import EnhancedPIIDetector
from app.services.llm.report_translator import ReportTranslator


async def demo_chat_interface():
    """Demo: Interactive chat for evaluation exploration"""
    print("\n" + "="*70)
    print("1. CHAT INTERFACE - Interactive Evaluation Exploration")
    print("="*70)
    
    chat_service = ChatService()
    
    # Sample context (evaluation results)
    context = {
        "generator_id": "test-gen-123",
        "generator_type": "dp-ctgan",
        "evaluation": {
            "overall_assessment": {
                "overall_quality": "Excellent",
                "overall_score": 0.91
            },
            "statistical_similarity": {
                "summary": {"pass_rate": 0.93}
            },
            "ml_utility": {
                "summary": {"utility_ratio": 0.89}
            },
            "privacy": {
                "summary": {"overall_privacy_level": "Very Strong"}
            }
        }
    }
    
    # Test questions
    questions = [
        "What's the overall quality of this synthetic data?",
        "Is the privacy level good enough for production?",
        "How does the ML utility compare to the original data?"
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n📝 Question {i}: {question}")
        response = await chat_service.chat(question, context)
        print(f"🤖 Response: {response}\n")
        print("-" * 70)


async def demo_improvement_suggestions():
    """Demo: AI-powered improvement suggestions"""
    print("\n" + "="*70)
    print("2. IMPROVEMENT SUGGESTIONS - AI-Powered Recommendations")
    print("="*70)
    
    chat_service = ChatService()
    
    # Sample evaluation with room for improvement
    evaluation = {
        "statistical_similarity": {
            "summary": {"pass_rate": 0.73}  # Could be better
        },
        "ml_utility": {
            "summary": {"utility_ratio": 0.68}  # Needs improvement
        },
        "privacy": {
            "summary": {"overall_privacy_level": "Medium"}
        }
    }
    
    print("\n📊 Analyzing evaluation results...")
    suggestions = await chat_service.suggest_improvements(evaluation)
    
    print(f"\n✨ Generated {len(suggestions)} improvement suggestions:\n")
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. {suggestion}")


async def demo_metric_explanation():
    """Demo: Plain English metric explanations"""
    print("\n" + "="*70)
    print("3. METRIC EXPLANATIONS - Technical → Plain English")
    print("="*70)
    
    chat_service = ChatService()
    
    metrics = [
        ("ks_statistic", "0.087"),
        ("utility_ratio", "0.89"),
        ("epsilon", "10.0")
    ]
    
    for metric_name, metric_value in metrics:
        print(f"\n📈 Metric: {metric_name} = {metric_value}")
        explanation = await chat_service.explain_metric(metric_name, metric_value)
        print(f"💡 Explanation: {explanation}\n")
        print("-" * 70)


async def demo_model_card():
    """Demo: Automated model card generation"""
    print("\n" + "="*70)
    print("4. MODEL CARD GENERATION - Compliance Documentation")
    print("="*70)
    
    writer = ComplianceWriter()
    
    # Sample generator metadata
    metadata = {
        "generator_id": "gen-456",
        "type": "dp-ctgan",
        "name": "Healthcare Data Generator",
        "dataset_info": {
            "name": "patient_records",
            "rows": 10000,
            "columns": 25
        },
        "privacy_config": {
            "epsilon": 10.0,
            "delta": 1e-5
        },
        "evaluation_results": {
            "overall_assessment": {
                "overall_quality": "Excellent",
                "overall_score": 0.91
            }
        }
    }
    
    print("\n📄 Generating model card...")
    model_card = await writer.generate_model_card(metadata)
    
    print("\n✅ Model Card Generated:\n")
    print(model_card[:500] + "...\n(truncated for demo)")


async def demo_audit_narrative():
    """Demo: Human-readable audit narratives"""
    print("\n" + "="*70)
    print("5. AUDIT NARRATIVES - Technical Logs → Readable Stories")
    print("="*70)
    
    writer = ComplianceWriter()
    
    # Sample audit log
    audit_log = [
        {
            "timestamp": "2025-11-25 10:00:00",
            "action": "generator_created",
            "details": {
                "type": "dp-ctgan",
                "name": "Healthcare Generator"
            }
        },
        {
            "timestamp": "2025-11-25 10:15:00",
            "action": "training_started",
            "details": {
                "epochs": 300,
                "batch_size": 500
            }
        },
        {
            "timestamp": "2025-11-25 11:30:00",
            "action": "training_completed",
            "details": {
                "privacy_spent": {"epsilon": 9.8}
            }
        }
    ]
    
    print("\n📋 Generating audit narrative...")
    narrative = await writer.generate_audit_narrative(audit_log)
    
    print("\n✅ Audit Narrative:\n")
    print(narrative)


async def demo_compliance_report():
    """Demo: Compliance framework mapping"""
    print("\n" + "="*70)
    print("6. COMPLIANCE REPORTS - Framework Mapping (GDPR, HIPAA, etc.)")
    print("="*70)
    
    writer = ComplianceWriter()
    
    metadata = {
        "generator_id": "gen-789",
        "type": "dp-ctgan",
        "privacy_config": {
            "epsilon": 10.0,
            "delta": 1e-5
        }
    }
    
    frameworks = ["GDPR", "HIPAA"]
    
    for framework in frameworks:
        print(f"\n🔒 Generating {framework} compliance report...")
        report = await writer.generate_compliance_report(metadata, framework)
        
        print(f"\n✅ {framework} Compliance Report:")
        print(f"   Compliance Level: {report.get('compliance_level', 'Unknown')}")
        print(f"   Controls Addressed: {len(report.get('controls_addressed', []))}")
        print(f"   Gaps: {len(report.get('gaps', []))}")
        print(f"   Recommendations: {len(report.get('recommendations', []))}")


async def demo_enhanced_pii_detection():
    """Demo: Enhanced PII detection with contextual analysis"""
    print("\n" + "="*70)
    print("7. ENHANCED PII DETECTION - Context-Aware Analysis")
    print("="*70)
    
    detector = EnhancedPIIDetector()
    
    # Sample columns data
    columns_data = {
        "user_id": {
            "samples": ["USR001", "USR002", "USR003"],
            "stats": {
                "dtype": "object",
                "unique_count": 1000,
                "total_count": 1000
            }
        },
        "age": {
            "samples": [25, 34, 42, 28, 55],
            "stats": {
                "dtype": "int64",
                "unique_count": 45,
                "total_count": 1000,
                "mean": 38.5
            }
        },
        "purchase_amount": {
            "samples": [99.99, 149.50, 299.00],
            "stats": {
                "dtype": "float64",
                "unique_count": 500,
                "total_count": 1000,
                "mean": 175.25
            }
        }
    }
    
    print("\n🔍 Analyzing dataset for PII...")
    analysis = await detector.analyze_dataset(columns_data)
    
    print(f"\n✅ Enhanced PII Analysis:")
    print(f"   Total Columns: {analysis['total_columns']}")
    print(f"   Columns with PII: {analysis['columns_with_pii']}")
    print(f"   Overall Risk Level: {analysis['overall_risk_level']}")
    print(f"   High Risk Columns: {', '.join(analysis['high_risk_columns']) or 'None'}")
    print(f"   Medium Risk Columns: {', '.join(analysis['medium_risk_columns']) or 'None'}")
    
    print(f"\n📋 Recommendations:")
    for rec in analysis['recommendations']:
        print(f"   • {rec}")


async def demo_report_translator():
    """Demo: Natural language evaluation insights"""
    print("\n" + "="*70)
    print("8. REPORT TRANSLATOR - Technical Metrics → Business Insights")
    print("="*70)
    
    translator = ReportTranslator()
    
    # Sample evaluation metrics
    metrics = {
        "statistical_similarity": {
            "summary": {"pass_rate": 0.93}
        },
        "ml_utility": {
            "summary": {"utility_ratio": 0.89}
        },
        "privacy": {
            "summary": {"overall_privacy_level": "Very Strong"}
        },
        "overall_assessment": {
            "overall_quality": "Excellent",
            "overall_score": 0.91
        }
    }
    
    print("\n📊 Translating evaluation metrics...")
    insights = await translator.translate_evaluation(metrics)
    
    print("\n✅ Natural Language Insights:\n")
    print(f"Executive Summary:\n{insights['executive_summary']}\n")
    print("Key Findings:")
    for finding in insights['key_findings']:
        print(f"  {finding}")
    print(f"\nBusiness Impact:\n{insights['business_impact']}")


async def run_all_demos():
    """Run all demos sequentially"""
    print("\n" + "="*70)
    print("🚀 LLM INTEGRATION DEMO - All Features")
    print("="*70)
    print("\nThis demo showcases all 11 new LLM-powered endpoints")
    print("Using Groq (llama-3.3-70b) for all generation")
    print("="*70)
    
    demos = [
        ("Chat Interface", demo_chat_interface),
        ("Improvement Suggestions", demo_improvement_suggestions),
        ("Metric Explanations", demo_metric_explanation),
        ("Model Card Generation", demo_model_card),
        ("Audit Narratives", demo_audit_narrative),
        ("Compliance Reports", demo_compliance_report),
        ("Enhanced PII Detection", demo_enhanced_pii_detection),
        ("Report Translator", demo_report_translator),
    ]
    
    for name, demo_func in demos:
        try:
            await demo_func()
        except Exception as e:
            print(f"\n❌ {name} failed: {e}")
            print("(This is expected if API keys are not configured)")
    
    print("\n" + "="*70)
    print("✅ Demo Complete!")
    print("="*70)
    print("\nAll 11 LLM endpoints are ready to use:")
    print("1. POST /llm/chat - Interactive chat")
    print("2. POST /llm/suggest-improvements/{id} - AI suggestions")
    print("3. GET /llm/explain-metric - Metric explanations")
    print("4. POST /generators/{id}/model-card - Model cards")
    print("5. GET /generators/{id}/audit-narrative - Audit narratives")
    print("6. POST /generators/{id}/compliance-report - Compliance mapping")
    print("7. POST /evaluations/{id}/explain - Natural language insights")
    print("8. POST /evaluations/compare - Compare evaluations")
    print("9. POST /datasets/{id}/pii-detection-enhanced - Enhanced PII detection")
    print("\n💡 Check http://localhost:8000/docs for interactive API documentation")
    print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(run_all_demos())
