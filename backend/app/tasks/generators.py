"""Generator background tasks."""

import uuid
import logging
import traceback
from datetime import datetime

from app.core.celery_app import celery_app
from app.tasks.base import DatabaseTask
from app.jobs.models import Job
from app.jobs.repositories import update_job_status
from app.generators.models import Generator
from app.datasets.models import Dataset

# Import all models to ensure metadata is loaded
from app.auth.models import User
from app.projects.models import Project
from app.evaluations.models import Evaluation
from app.compliance.models import ComplianceReport
from app.audit.models import AuditLog

from app.services.synthesis.copula_service import GaussianCopulaService
from app.services.synthesis.tvae_service import TVAEService
from app.services.synthesis.ctgan_service import CTGANService
from app.services.synthesis.dp_ctgan_service import DPCTGANService
from app.services.synthesis.dp_tvae_service import DPTVAEService

from app.generators.services import _generate_from_dataset

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, base=DatabaseTask)
def train_generator_task(self, generator_id: str, job_id: str):
    """
    Background task to train a generator and generate synthetic data.
    
    Args:
        generator_id: UUID of the generator to train
        job_id: UUID of the tracking job
    """
    logger.info(f"Starting generation task for generator {generator_id} (Job {job_id})")
    
    db = self.db
    job = None
    generator = None
    
    try:
        # 1. Update Job status to RUNNING
        job_uuid = uuid.UUID(job_id)
        job = db.get(Job, job_uuid)
        if job:
            job.celery_task_id = self.request.id
            job.started_at = datetime.utcnow()
            job.status = "running"
            db.add(job)
            db.commit()
        else:
            logger.error(f"Job {job_id} not found")
            return

        # 2. Get Generator
        generator_uuid = uuid.UUID(generator_id)
        generator = db.get(Generator, generator_uuid)
        if not generator:
            raise ValueError(f"Generator {generator_id} not found")

        # 3. Run the entire generation pipeline (train + generate)
        # This uses the existing _generate_from_dataset function which handles:
        # - Loading the dataset
        # - Training the model
        # - Generating synthetic data
        # - Saving models and data
        # - Creating output dataset record
        logger.info(f"Running generation pipeline for {generator.type}...")
        output_dataset = _generate_from_dataset(generator, db)

        # 4. Update Generator Status to COMPLETED
        generator.status = "completed"
        if output_dataset:
            generator.output_dataset_id = output_dataset.id
        db.add(generator)
        
        # 5. Update Job Status to COMPLETED
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.add(job)
        db.commit()
        
        logger.info(f"✓ Successfully completed generation for {generator_id}")
        logger.info(f"✓ Generated {output_dataset.row_count} rows → Dataset {output_dataset.id}")

    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        # Update Job to FAILED
        if job:
            job.status = "failed"
            job.error_message = str(e)[:500]  # Truncate long errors
            job.completed_at = datetime.utcnow()
            db.add(job)
            
            # Update Generator to FAILED
            if generator:
                generator.status = "failed"
                db.add(generator)
                
            db.commit()
        raise


@celery_app.task(bind=True, base=DatabaseTask)
def generate_data_task(self, generator_id: str, job_id: str, num_rows: int):
    """
    Background task to generate synthetic data.
    
    Args:
        generator_id: UUID of the trained generator
        job_id: UUID of the tracking job
        num_rows: Number of rows to generate
    """
    logger.info(f"Starting generation task for generator {generator_id} (Job {job_id})")
    
    db = self.db
    try:
        # 1. Update Job status
        job_uuid = uuid.UUID(job_id)
        job = db.get(Job, job_uuid)
        if job:
            job.celery_task_id = self.request.id
            job.started_at = datetime.utcnow()
            job.status = "running"
            db.add(job)
            db.commit()
            
        # 2. Get Generator
        generator_uuid = uuid.UUID(generator_id)
        generator = db.get(Generator, generator_uuid)
        if not generator:
            raise ValueError(f"Generator {generator_id} not found")
            
        # 3. Initialize Service
        if generator.type == "copula":
            service = GaussianCopulaService()
        elif generator.type == "tvae":
            service = TVAEService()
        elif generator.type == "ctgan":
            service = CTGANService()
        elif generator.type == "dp-ctgan":
            service = DPCTGANService()
        elif generator.type == "dp-tvae":
            service = DPTVAEService()
        else:
            raise ValueError(f"Unknown generator type: {generator.type}")
            
        # 4. Load Model and Generate
        # Note: Services need to support loading from model_path
        service.load(generator.model_path)
        synthetic_data = service.generate(num_rows)
        
        # 5. Save Synthetic Data (Logic to save to file and create Dataset record)
        # This part depends on how you want to handle the output dataset creation
        # For now, we'll assume the service or a helper handles saving
        
        # ... (Save logic here) ...
        
        # 6. Update Job
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.add(job)
        db.commit()
        
        logger.info(f"Successfully generated {num_rows} rows")
        
    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.add(job)
            db.commit()
        raise
