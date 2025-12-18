"""LLM Seed Data Generator

Generates realistic seed data from schema using LLM, which can then be used
to train CTGAN/TVAE for more realistic synthetic data generation.
"""

import json
import logging
from typing import Dict, Any, List, Optional
import pandas as pd

from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

logger = logging.getLogger(__name__)


class SeedDataGenerator:
    """
    Uses LLM to generate realistic seed data from a schema definition.
    
    The seed data can be used to train ML models (CTGAN/TVAE) for more
    realistic synthetic data generation compared to random values.
    """
    
    def __init__(self):
        """Initialize with LLM router."""
        self.router = LLMRouter()
    
    async def generate_seed_data(
        self,
        schema: Dict[str, Dict[str, Any]],
        num_rows: int = 100,
        context: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Generate realistic seed data from schema using LLM.
        
        Args:
            schema: Column definitions {"column_name": {"type": "string", ...}}
            num_rows: Number of seed rows to generate (default: 100, max: 200)
            context: Optional context about the data (e.g., "healthcare patient records")
            
        Returns:
            DataFrame with realistic seed data
        """
        # Limit rows to prevent token overflow
        num_rows = min(num_rows, 200)
        
        logger.info(f"Generating {num_rows} LLM seed rows from schema with {len(schema)} columns")
        
        # Build column descriptions for prompt
        columns_desc = []
        for col_name, col_config in schema.items():
            col_type = col_config.get("type", "string")
            constraints = col_config.get("constraints", {})
            columns_desc.append(f"- {col_name}: {col_type} {constraints if constraints else ''}")
        
        columns_text = "\n".join(columns_desc)
        
        system_prompt = """You are a data generation expert. Generate realistic, diverse sample data based on the given schema.
Output ONLY a valid JSON array of objects. No explanation, no markdown, just pure JSON.
Ensure the data is realistic - names should be real-sounding names, emails should be properly formatted, ages should be reasonable, etc.
Respect any constraints provided. Vary the data to show realistic distributions."""

        user_prompt = f"""Generate exactly {num_rows} rows of realistic data for this schema:

Columns:
{columns_text}

{f"Context: {context}" if context else ""}

Output format: JSON array of {num_rows} objects.
Example format: [{{"column1": "value1", "column2": 123}}, ...]

IMPORTANT: Output ONLY the JSON array, no other text."""

        try:
            request = LLMRequest(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.8,  # Higher temperature for more variety
                max_tokens=16000  # Enough for ~200 rows
            )
            
            response = await self.router.generate(request, use_case="data_generation")
            
            # Parse JSON response
            content = response.content.strip()
            
            # Handle markdown code blocks if present
            if content.startswith("```"):
                # Extract content between code blocks
                lines = content.split("\n")
                content_lines = []
                in_block = False
                for line in lines:
                    if line.startswith("```"):
                        in_block = not in_block
                        continue
                    if in_block:
                        content_lines.append(line)
                content = "\n".join(content_lines)
            
            # Parse JSON
            data = json.loads(content)
            
            if not isinstance(data, list):
                raise ValueError("LLM response is not a JSON array")
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Validate columns match schema
            expected_cols = set(schema.keys())
            actual_cols = set(df.columns)
            
            if expected_cols != actual_cols:
                missing = expected_cols - actual_cols
                extra = actual_cols - expected_cols
                if missing:
                    logger.warning(f"LLM data missing columns: {missing}")
                    # Add missing columns with None
                    for col in missing:
                        df[col] = None
                if extra:
                    logger.warning(f"LLM data has extra columns: {extra}")
                    # Remove extra columns
                    df = df[list(expected_cols)]
            
            logger.info(f"✓ LLM generated {len(df)} seed rows successfully")
            return df
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            raise ValueError(f"LLM returned invalid JSON: {e}")
        except Exception as e:
            logger.error(f"LLM seed generation failed: {e}")
            raise

    def generate_seed_data_fallback(
        self,
        schema: Dict[str, Dict[str, Any]],
        num_rows: int = 100
    ) -> pd.DataFrame:
        """
        Fallback seed generation using basic random data.
        Used when LLM is unavailable or fails.
        
        Args:
            schema: Column definitions
            num_rows: Number of rows
            
        Returns:
            DataFrame with random seed data
        """
        import random
        import string
        from datetime import datetime, timedelta
        
        logger.warning("Using fallback random seed generation")
        
        data = {col: [] for col in schema.keys()}
        
        for _ in range(num_rows):
            for col_name, col_config in schema.items():
                col_type = col_config.get("type", "string").lower()
                
                # Generate random value based on type
                if col_type in ("integer", "int", "number", "numeric"):
                    value = random.randint(1, 1000)
                elif col_type in ("float", "decimal", "double"):
                    value = round(random.uniform(0, 1000), 2)
                elif col_type in ("boolean", "bool"):
                    value = random.choice([True, False])
                elif col_type in ("date", "datetime", "timestamp"):
                    days_ago = random.randint(0, 365 * 5)
                    value = (datetime.now() - timedelta(days=days_ago)).isoformat()
                elif col_type in ("email",):
                    name = ''.join(random.choices(string.ascii_lowercase, k=8))
                    value = f"{name}@example.com"
                elif col_type in ("name", "first_name", "last_name"):
                    value = ''.join(random.choices(string.ascii_letters, k=random.randint(5, 10))).capitalize()
                elif col_type in ("categorical", "category", "enum"):
                    options = col_config.get("options", ["A", "B", "C"])
                    value = random.choice(options)
                else:
                    # Default: random string
                    value = ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(5, 20)))
                
                data[col_name].append(value)
        
        df = pd.DataFrame(data)
        logger.info(f"✓ Fallback generated {len(df)} random seed rows")
        return df
