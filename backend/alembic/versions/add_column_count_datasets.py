"""Add column_count to datasets table

Revision ID: add_column_count_datasets
Revises: 
Create Date: 2025-12-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_column_count_datasets'
down_revision: Union[str, None] = '068035fe33ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add column_count column to datasets table
    op.add_column('datasets', sa.Column('column_count', sa.Integer(), nullable=True))
    
    # Update existing records: count keys in schema_data JSON
    # This is a raw SQL approach for SQLite/PostgreSQL compatibility
    connection = op.get_bind()
    
    # Get all datasets and update column_count based on schema_data
    result = connection.execute(sa.text("SELECT id, schema_data FROM datasets WHERE column_count IS NULL"))
    for row in result:
        dataset_id = row[0]
        schema_data = row[1]
        
        # Parse schema_data and count columns
        if schema_data:
            import json
            try:
                if isinstance(schema_data, str):
                    data = json.loads(schema_data)
                else:
                    data = schema_data
                
                if isinstance(data, dict):
                    if 'columns' in data and isinstance(data['columns'], list):
                        column_count = len(data['columns'])
                    else:
                        column_count = len(data)
                else:
                    column_count = 0
            except:
                column_count = 0
        else:
            column_count = 0
        
        connection.execute(
            sa.text("UPDATE datasets SET column_count = :count WHERE id = :id"),
            {"count": column_count, "id": dataset_id}
        )


def downgrade() -> None:
    op.drop_column('datasets', 'column_count')
