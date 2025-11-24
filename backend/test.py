"""Test the Report Intelligence features

This script tests:
1. Report translator service
2. Natural language insights generation
3. Evaluation comparison
"""

import asyncio
import json
from app.services.llm.report_translator import ReportTranslator


async def test_report_translator():
    """Test report translator with sample evaluation metrics"""
    
    print("\n" + "="*60)
    print("Testing Report Intelligence")
    print("="*60)
    
    # Sample evaluation metrics (similar to real evaluation output)
    sample_metrics = {
        "statistical_similarity": {
            "summary": {
                "pass_rate": 0.933,
                "total_tests": 15,
                "passed_tests": 14
            },
            "tests": {
                "age": {"statistic": 0.087, "p_value": 0.23, "passed": True},
                "income": {"statistic": 0.12, "p_value": 0.15, "passed": True}
            }
        },
        "ml_utility": {
            "summary": {
                "utility_ratio": 0.956,
                "baseline_accuracy": 0.92,
                "synthetic_accuracy": 0.88
            }
        },
        "privacy": {
            "summary": {
                "overall_privacy_level": "Good",
                "dcr_risk_level": "Low",
                "membership_inference_vulnerability": "Low"
            }
        },
        "overall_assessment": {
            "overall_quality": "Excellent",
            "overall_score": 0.91
        }
    }
    
    # Test 1: Generate insights
    print("\n1. Generating natural language insights...")
    translator = ReportTranslator()
    
    try:
        insights = await translator.translate_evaluation(sample_metrics)
        
        print("\n✓ Insights generated successfully!\n")
        print("Executive Summary:")
        print(f"  {insights['executive_summary']}\n")
        
        print("Key Findings:")
        for finding in insights['key_findings']:
            print(f"  {finding}")
        
        print("\nRecommendations:")
        for rec in insights['recommendations']:
            print(f"  • {rec}")
        
        print(f"\nBusiness Impact:")
        print(f"  {insights['business_impact']}")
        
        print(f"\nMetadata:")
        print(f"  Provider: {insights['_metadata']['provider']}")
        print(f"  Model: {insights['_metadata']['model']}")
        print(f"  Latency: {insights['_metadata']['latency_ms']}ms")
        print(f"  Tokens: {insights['_metadata']['tokens']['input']} in, {insights['_metadata']['tokens']['output']} out")
        
    except Exception as e:
        print(f"✗ Failed to generate insights: {e}")
    
    # Test 2: Compare evaluations
    print("\n" + "="*60)
    print("2. Testing evaluation comparison...")
    
    evaluations = [
        {
            "evaluation_id": "eval_1",
            "generator_type": "ctgan",
            "metrics": sample_metrics
        },
        {
            "evaluation_id": "eval_2",
            "generator_type": "dp-ctgan",
            "metrics": {
                **sample_metrics,
                "statistical_similarity": {
                    "summary": {"pass_rate": 0.867}
                },
                "ml_utility": {
                    "summary": {"utility_ratio": 0.89}
                },
                "privacy": {
                    "summary": {"overall_privacy_level": "Very Strong"}
                }
            }
        }
    ]
    
    try:
        comparison = await translator.compare_evaluations(evaluations)
        
        print("\n✓ Comparison generated successfully!\n")
        print(f"Summary: {comparison.get('summary', 'N/A')}")
        print(f"Winner: Generation {comparison.get('winner', 'N/A')}")
        print(f"\nTrade-offs:")
        for trade_off in comparison.get('trade_offs', []):
            print(f"  • {trade_off}")
        print(f"\nRecommendation: {comparison.get('recommendation', 'N/A')}")
        
    except Exception as e:
        print(f"✗ Failed to generate comparison: {e}")
    
    print("\n" + "="*60)
    print("Testing complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(test_report_translator())