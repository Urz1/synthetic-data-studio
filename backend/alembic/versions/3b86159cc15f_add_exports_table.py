"""Add exports table

Revision ID: 3b86159cc15f
Revises: 2b48fc8b730e
Create Date: 2025-12-02 11:25:39.771140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '3b86159cc15f'
down_revision: Union[str, Sequence[str], None] = '2b48fc8b730e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'exports',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('export_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('format', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('generator_id', sa.UUID(), nullable=True),
        sa.Column('dataset_id', sa.UUID(), nullable=True),
        sa.Column('project_id', sa.UUID(), nullable=True),
        sa.Column('s3_key', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=False),
        sa.Column('s3_bucket', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ),
        sa.ForeignKeyConstraint(['generator_id'], ['generators.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exports_created_by'), 'exports', ['created_by'], unique=False)
    op.create_index(op.f('ix_exports_dataset_id'), 'exports', ['dataset_id'], unique=False)
    op.create_index(op.f('ix_exports_generator_id'), 'exports', ['generator_id'], unique=False)
    op.create_index(op.f('ix_exports_project_id'), 'exports', ['project_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_exports_project_id'), table_name='exports')
    op.drop_index(op.f('ix_exports_generator_id'), table_name='exports')
    op.drop_index(op.f('ix_exports_dataset_id'), table_name='exports')
    op.drop_index(op.f('ix_exports_created_by'), table_name='exports')
    op.drop_table('exports')
