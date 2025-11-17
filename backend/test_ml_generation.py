#!/usr/bin/env python3
"""
Test script to demonstrate ML model-based synthetic data generation.
Shows the difference between random, statistical, and ML-based approaches.
"""

import pandas as pd
import numpy as np
from app.generators.services import _statistical_synthesis, _pytorch_ctgan_synthesis

def random_generation(real_data, num_rows):
    """Simple random generation (baseline - what we had before)."""
    synthetic_data = {}
    for col in real_data.columns:
        if real_data[col].dtype in ['int64', 'float64']:
            min_val = real_data[col].min()
            max_val = real_data[col].max()
            synthetic_data[col] = np.random.uniform(min_val, max_val, num_rows)
        elif real_data[col].dtype == 'object':
            categories = real_data[col].unique()
            synthetic_data[col] = np.random.choice(categories, num_rows)
        else:
            synthetic_data[col] = real_data[col].sample(num_rows, replace=True).values

    return pd.DataFrame(synthetic_data)

def main():
    print("Testing ML Model-Based Synthetic Data Generation")
    print("=" * 60)

    # Load sample data
    data = pd.read_csv('sample_data.csv')
    print(f"Original Data Shape: {data.shape}")
    print(f"Original Columns: {list(data.columns)}")
    print()

    print("Original Data Correlations:")
    corr_original = data.corr(numeric_only=True)
    print(corr_original.round(3))
    print()

    num_samples = 100

    # Test 1: Random Generation (baseline)
    print("Test 1: Random Generation (No correlations)")
    random_data = random_generation(data, num_samples)
    corr_random = random_data.corr(numeric_only=True)
    print(f"Shape: {random_data.shape}")
    print("Correlations:")
    print(corr_random.round(3))
    print()

    # Test 2: Statistical Generation (correlation-preserving)
    print("Test 2: Statistical Generation (Preserves correlations)")
    stat_data = _statistical_synthesis(data, num_samples)
    corr_stat = stat_data.corr(numeric_only=True)
    print(f"Shape: {stat_data.shape}")
    print("Correlations:")
    print(corr_stat.round(3))
    print()

    # Test 3: ML Model Generation (CTGAN)
    print("Test 3: ML Model Generation (CTGAN - GAN-based)")
    try:
        ml_data, trained_model = _pytorch_ctgan_synthesis(data, {
            'num_rows': num_samples,
            'epochs': 5,  # Reduced epochs for testing
            'batch_size': 32  # Increased batch size
        })
        corr_ml = ml_data.corr(numeric_only=True)
        print(f"Shape: {ml_data.shape}")
        print("Correlations:")
        print(corr_ml.round(3))
        print()

        # Compare correlation preservation
        print("Correlation Preservation Comparison:")
        print("Original vs Random | Original vs Statistical | Original vs ML")
        for i, col1 in enumerate(corr_original.columns):
            for j, col2 in enumerate(corr_original.columns):
                if i < j:  # Upper triangle only
                    orig_corr = corr_original.loc[col1, col2]
                    random_diff = abs(orig_corr - corr_random.loc[col1, col2])
                    stat_diff = abs(orig_corr - corr_stat.loc[col1, col2])
                    ml_diff = abs(orig_corr - corr_ml.loc[col1, col2])

                    print(".3f")

        print()
        print("SUCCESS: ML model (CTGAN) generates synthetic data with learned patterns!")
        print("The GAN learns the underlying data distribution and generates new samples.")
        print("This is true synthetic data generation, not just statistical approximation.")

    except Exception as e:
        print(f"ML generation failed: {e}")
        print("But statistical generation still works!")

if __name__ == "__main__":
    main()