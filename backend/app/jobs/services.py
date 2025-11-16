"""Business logic for async job processing."""

from sqlmodel import Session
from .models import Job
from .crud import update_job_status


def process_job(job: Job, db: Session):
    """Process a job based on its type."""
    try:
        if job.type == "generation":
            # Call generator service
            from app.generators.services import generate_synthetic_data
            from app.generators.crud import get_generator_by_id

            generator = get_generator_by_id(db, str(job.generator_id))
            if generator:
                output_dataset = generate_synthetic_data(generator, db)
                # Update job with result
                update_job_status(db, str(job.id), "completed")

        elif job.type == "training":
            # TODO: Model training
            pass
        elif job.type == "evaluation":
            # TODO: Evaluation
            pass
        else:
            raise ValueError(f"Unknown job type: {job.type}")

    except Exception as e:
        update_job_status(db, str(job.id), "failed")
        raise e