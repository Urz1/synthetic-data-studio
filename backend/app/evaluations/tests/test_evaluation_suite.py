"""
Test script for Phase 4: Evaluation Suite

Tests statistical similarity, ML utility, and privacy leakage evaluators.
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_path))

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

import pandas as pd
import numpy as np
from app.evaluations.statistical_tests import StatisticalEvaluator
from app.evaluations.ml_utility import MLUtilityEvaluator
from app.evaluations.privacy_tests import PrivacyEvaluator
from app.evaluations.quality_report import QualityReportGenerator

print("=" * 60)
print("Phase 4 Evaluation Suite - Unit Tests")
print("=" * 60)
print()

# Generate test data
np.random.seed(42)
n_samples = 1000

real_data = pd.DataFrame({
    'age': np.random.normal(40, 10, n_samples).clip(18, 80),
    'income': np.random.lognormal(10, 1, n_samples),
    'category': np.random.choice(['A', 'B', 'C'], n_samples),
    'score': np.random.beta(2, 5, n_samples) * 100,
    'target': np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
})

# Generate synthetic data (slightly perturbed)
synthetic_data = real_data.copy()
synthetic_data['age'] = (
    synthetic_data['age'] + np.random.normal(0, 2, n_samples)
).clip(18, 80)
synthetic_data['income'] = synthetic_data['income'] * np.random.uniform(0.9, 1.1, n_samples)
synthetic_data['score'] = (
    synthetic_data['score'] + np.random.normal(0, 5, n_samples)
).clip(0, 100)
synthetic_data['category'] = np.random.choice(['A', 'B', 'C'], n_samples)
synthetic_data['target'] = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])

print("Generated test data:")
print(f"  Real data: {len(real_data)} rows, {len(real_data.columns)} columns")
print(f"  Synthetic data: {len(synthetic_data)} rows, {len(synthetic_data.columns)} columns")
print()

# Test 1: Statistical Evaluator
print("[1/4] Testing Statistical Similarity Evaluator...")
try:
    stat_eval = StatisticalEvaluator(real_data, synthetic_data)
    
    # Test KS test
    ks_result = stat_eval.kolmogorov_smirnov_test('age')
    print(f"  [OK] KS test on 'age': p-value={ks_result['p_value']:.4f}, passed={ks_result['passed']}")
    
    # Test Chi-square
    chi_result = stat_eval.chi_square_test('category')
    print(f"  ✅ Chi-square test on 'category': p-value={chi_result['p_value']:.4f}, passed={chi_result['passed']}")
    
    # Test Wasserstein distance
    wass_result = stat_eval.wasserstein_distance_test('income')
    passed = wass_result['normalized_distance'] < 0.1
    print(f"  ✅ Wasserstein distance on 'income': distance={wass_result['normalized_distance']:.4f}, passed={passed}")
    
    # Test full evaluation
    full_result = stat_eval.evaluate_all()
    print(f"  ✅ Full evaluation: pass_rate={full_result['summary']['pass_rate']:.1f}%, quality={full_result['summary']['overall_quality']}")
    
    print("  ✅ Statistical Evaluator PASSED")
except Exception as e:
    print(f"  ❌ Statistical Evaluator FAILED: {e}")

print()

# Test 2: ML Utility Evaluator
print("[2/4] Testing ML Utility Evaluator...")
try:
    ml_eval = MLUtilityEvaluator(real_data, synthetic_data, target_column='target')
    
    # Test baseline
    baseline_result = ml_eval.train_on_real_test_on_real()
    print(f"  ✅ Baseline (real→real): accuracy={baseline_result['accuracy']:.4f}")
    
    # Test synthetic utility
    synth_result = ml_eval.train_on_synthetic_test_on_real()
    print(f"  ✅ Synthetic utility: accuracy={synth_result['accuracy']:.4f}")
    
    # Test mixed
    mixed_result = ml_eval.train_on_mixed_test_on_real()
    print(f"  ✅ Mixed augmentation: accuracy={mixed_result['accuracy']:.4f}")
    
    # Test full evaluation
    full_result = ml_eval.evaluate_all()
    print(f"  ✅ Full evaluation: utility_ratio={full_result['summary']['utility_ratio']:.1%}, quality={full_result['summary']['quality_level']}")
    
    print("  ✅ ML Utility Evaluator PASSED")
except Exception as e:
    print(f"  ❌ ML Utility Evaluator FAILED: {e}")

print()

# Test 3: Privacy Evaluator
print("[3/4] Testing Privacy Leakage Evaluator...")
try:
    privacy_eval = PrivacyEvaluator(real_data, synthetic_data, sensitive_columns=['target'])
    
    # Test DCR
    dcr_result = privacy_eval.distance_to_closest_record()
    print(f"  ✅ DCR: mean={dcr_result['statistics']['mean']:.4f}, risk={dcr_result['risk_level']}")
    
    # Test membership inference
    mia_result = privacy_eval.membership_inference_attack()
    print(f"  ✅ Membership inference: accuracy={mia_result['attack_accuracy']:.4f}, vulnerability={mia_result['vulnerability']}")
    
    # Test attribute inference
    aia_result = privacy_eval.attribute_inference_attack('target')
    print(f"  ✅ Attribute inference: accuracy={aia_result['inference_accuracy']:.4f}, vulnerability={aia_result['vulnerability']}")
    
    # Test full evaluation
    full_result = privacy_eval.evaluate_all()
    print(f"  ✅ Full evaluation: privacy_level={full_result['summary']['overall_privacy_level']}")
    
    print("  ✅ Privacy Evaluator PASSED")
except Exception as e:
    print(f"  ❌ Privacy Evaluator FAILED: {e}")

print()

# Test 4: Quality Report Generator
print("[4/4] Testing Quality Report Generator...")
try:
    report_gen = QualityReportGenerator(
        real_data=real_data,
        synthetic_data=synthetic_data,
        generator_id="test_gen_001",
        generator_type="ctgan"
    )
    
    # Test full report
    full_report = report_gen.generate_full_report(
        target_column='target',
        sensitive_columns=['target'],
        include_statistical=True,
        include_ml_utility=True,
        include_privacy=True
    )
    
    print(f"  ✅ Report ID: {full_report['report_id']}")
    print(f"  ✅ Overall score: {full_report['overall_assessment']['overall_score']:.3f}")
    print(f"  ✅ Overall quality: {full_report['overall_assessment']['overall_quality']}")
    print(f"  ✅ Recommendations: {len(full_report['overall_assessment']['recommendations'])} items")
    
    # Test summary report
    summary_report = report_gen.generate_summary_report()
    print(f"  ✅ Summary report: quality={summary_report['quality_level']}")
    
    print("  ✅ Quality Report Generator PASSED")
except Exception as e:
    print(f"  ❌ Quality Report Generator FAILED: {e}")

print()
print("=" * 60)
print("✅ All Phase 4 Tests PASSED")
print("=" * 60)
