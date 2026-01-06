#!/usr/bin/env python3
"""
Seed Database Script - Populate all tables with realistic fake data.

This script generates:
- Users (with hashed passwords)
- Projects
- Datasets (with actual CSV files)
- Generators (with realistic training metadata)
- Evaluations (with realistic metrics)
- Jobs (various statuses)
- Exports
- Audit Logs
- Usage Records & Quotas
- Compliance Reports

Usage:
    python scripts/seed_database.py
    python scripts/seed_database.py --clean  # Drop and recreate all data
"""

# Standard library
import argparse
import hashlib
import os
import random
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Third-party
import bcrypt
import pandas as pd
from faker import Faker
from sqlmodel import select, Session, SQLModel

# Internal
from app.database.database import engine

# Internal - Models
from app.audit.models import AuditLog
from app.auth.models import APIKey, User
from app.billing.models import Quota, UsageRecord
from app.compliance.models import ComplianceReport
from app.datasets.models import Dataset, DatasetFile
from app.evaluations.models import Evaluation
from app.exports.models import Export
from app.generators.models import Generator
from app.jobs.models import Job
from app.projects.models import Project

# Initialize
fake = Faker()
Faker.seed(42)  # Reproducible data
random.seed(42)

def hash_password(password: str) -> str:
    """Hash password using bcrypt directly."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Configuration
NUM_USERS = 5
NUM_PROJECTS_PER_USER = 2
NUM_DATASETS_PER_PROJECT = 3
NUM_GENERATORS_PER_DATASET = 2
UPLOAD_DIR = Path("uploads")


def ensure_upload_dir():
    """Create uploads directory if it doesn't exist."""
    UPLOAD_DIR.mkdir(exist_ok=True)
    print(f"✓ Upload directory: {UPLOAD_DIR.absolute()}")


def generate_realistic_csv(filename: str, domain: str = "healthcare") -> tuple[Path, dict]:
    """Generate a realistic CSV file based on domain."""
    
    num_rows = random.randint(500, 2000)
    
    if domain == "healthcare":
        data = {
            "patient_id": [f"P{fake.unique.random_number(digits=6)}" for _ in range(num_rows)],
            "first_name": [fake.first_name() for _ in range(num_rows)],
            "last_name": [fake.last_name() for _ in range(num_rows)],
            "date_of_birth": [fake.date_of_birth(minimum_age=18, maximum_age=90).isoformat() for _ in range(num_rows)],
            "gender": [random.choice(["M", "F", "Other"]) for _ in range(num_rows)],
            "email": [fake.email() for _ in range(num_rows)],
            "phone": [fake.phone_number() for _ in range(num_rows)],
            "ssn": [fake.ssn() for _ in range(num_rows)],
            "address": [fake.address().replace("\n", ", ") for _ in range(num_rows)],
            "diagnosis_code": [f"ICD-{random.randint(100, 999)}.{random.randint(0, 9)}" for _ in range(num_rows)],
            "admission_date": [fake.date_between(start_date="-2y", end_date="today").isoformat() for _ in range(num_rows)],
            "discharge_date": [fake.date_between(start_date="-1y", end_date="today").isoformat() for _ in range(num_rows)],
            "total_charge": [round(random.uniform(1000, 50000), 2) for _ in range(num_rows)],
            "insurance_provider": [random.choice(["Blue Cross", "Aetna", "UnitedHealth", "Cigna", "Medicare", "Medicaid"]) for _ in range(num_rows)],
        }
        pii_columns = ["first_name", "last_name", "email", "phone", "ssn", "address"]
        
    elif domain == "finance":
        data = {
            "transaction_id": [f"TXN{fake.unique.random_number(digits=10)}" for _ in range(num_rows)],
            "customer_id": [f"C{fake.random_number(digits=8)}" for _ in range(num_rows)],
            "customer_name": [fake.name() for _ in range(num_rows)],
            "email": [fake.email() for _ in range(num_rows)],
            "transaction_date": [fake.date_time_between(start_date="-1y", end_date="now").isoformat() for _ in range(num_rows)],
            "amount": [round(random.uniform(10, 10000), 2) for _ in range(num_rows)],
            "currency": [random.choice(["USD", "EUR", "GBP"]) for _ in range(num_rows)],
            "merchant_name": [fake.company() for _ in range(num_rows)],
            "merchant_category": [random.choice(["Retail", "Food", "Travel", "Entertainment", "Utilities", "Healthcare"]) for _ in range(num_rows)],
            "card_last_four": [fake.credit_card_number()[-4:] for _ in range(num_rows)],
            "transaction_type": [random.choice(["purchase", "refund", "withdrawal", "transfer"]) for _ in range(num_rows)],
            "is_fraud": [random.choice([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]) for _ in range(num_rows)],  # 10% fraud rate
        }
        pii_columns = ["customer_name", "email", "card_last_four"]
        
    elif domain == "hr":
        data = {
            "employee_id": [f"E{fake.unique.random_number(digits=5)}" for _ in range(num_rows)],
            "first_name": [fake.first_name() for _ in range(num_rows)],
            "last_name": [fake.last_name() for _ in range(num_rows)],
            "email": [fake.company_email() for _ in range(num_rows)],
            "department": [random.choice(["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"]) for _ in range(num_rows)],
            "job_title": [fake.job() for _ in range(num_rows)],
            "hire_date": [fake.date_between(start_date="-10y", end_date="today").isoformat() for _ in range(num_rows)],
            "salary": [random.randint(40000, 200000) for _ in range(num_rows)],
            "bonus_percentage": [random.randint(0, 30) for _ in range(num_rows)],
            "performance_rating": [round(random.uniform(1, 5), 1) for _ in range(num_rows)],
            "manager_id": [f"E{fake.random_number(digits=5)}" if random.random() > 0.1 else None for _ in range(num_rows)],
            "location": [fake.city() for _ in range(num_rows)],
        }
        pii_columns = ["first_name", "last_name", "email", "salary"]
        
    else:  # generic
        data = {
            "id": list(range(1, num_rows + 1)),
            "name": [fake.name() for _ in range(num_rows)],
            "email": [fake.email() for _ in range(num_rows)],
            "age": [random.randint(18, 80) for _ in range(num_rows)],
            "city": [fake.city() for _ in range(num_rows)],
            "country": [fake.country() for _ in range(num_rows)],
            "created_at": [fake.date_time_between(start_date="-2y", end_date="now").isoformat() for _ in range(num_rows)],
        }
        pii_columns = ["name", "email"]
    
    df = pd.DataFrame(data)
    file_path = UPLOAD_DIR / filename
    df.to_csv(file_path, index=False)
    
    # Generate schema info
    schema_data = {
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "num_rows": len(df),
        "num_columns": len(df.columns)
    }
    
    # Calculate checksum
    with open(file_path, "rb") as f:
        checksum = hashlib.sha256(f.read()).hexdigest()
    
    return file_path, {
        "schema_data": schema_data,
        "row_count": num_rows,
        "size_bytes": file_path.stat().st_size,
        "checksum": checksum,
        "pii_columns": pii_columns
    }


def generate_synthetic_csv(original_path: Path, prefix: str = "synthetic") -> tuple[Path, dict]:
    """Generate a synthetic version of a CSV (simulated output)."""
    df = pd.read_csv(original_path)
    
    # Add some noise to numeric columns
    for col in df.select_dtypes(include=['int64', 'float64']).columns:
        df[col] = df[col] * random.uniform(0.95, 1.05)
    
    # Shuffle rows
    df = df.sample(frac=1).reset_index(drop=True)
    
    filename = f"{prefix}_{original_path.name}"
    file_path = UPLOAD_DIR / filename
    df.to_csv(file_path, index=False)
    
    with open(file_path, "rb") as f:
        checksum = hashlib.sha256(f.read()).hexdigest()
    
    return file_path, {
        "row_count": len(df),
        "size_bytes": file_path.stat().st_size,
        "checksum": checksum
    }


def generate_evaluation_report() -> dict:
    """Generate realistic evaluation metrics."""
    return {
        "statistical": {
            "column_shapes": round(random.uniform(0.75, 0.98), 3),
            "column_pair_trends": round(random.uniform(0.70, 0.95), 3),
            "ks_complement": round(random.uniform(0.80, 0.99), 3),
            "correlation_similarity": round(random.uniform(0.75, 0.95), 3),
        },
        "privacy": {
            "dcr_score": round(random.uniform(0.85, 0.99), 3),
            "nndr_score": round(random.uniform(0.80, 0.98), 3),
            "membership_inference_auc": round(random.uniform(0.48, 0.55), 3),
            "attribute_inference_accuracy": round(random.uniform(0.10, 0.30), 3),
        },
        "utility": {
            "ml_efficacy": round(random.uniform(0.70, 0.95), 3),
            "feature_importance_similarity": round(random.uniform(0.75, 0.92), 3),
            "downstream_task_performance": round(random.uniform(0.80, 0.95), 3),
        },
        "overall_score": round(random.uniform(0.75, 0.92), 3),
        "quality_grade": random.choice(["A", "A", "B", "B", "B", "C"]),
    }


def seed_users(session: Session) -> list[User]:
    """Create demo users."""
    users = []
    
    # Create admin user
    admin = User(
        email="admin@synthstudio.io",
        hashed_password=hash_password("Admin123!"),
        role="admin",
        name="System Admin",
        is_active=True
    )
    session.add(admin)
    users.append(admin)
    
    # Create demo user
    demo = User(
        email="demo@synthstudio.io",
        hashed_password=hash_password("Demo123!"),
        role="user",
        name="Demo User",
        is_active=True
    )
    session.add(demo)
    users.append(demo)
    
    # Create random users
    for i in range(NUM_USERS - 2):
        user = User(
            email=fake.unique.email(),
            hashed_password=hash_password("Password123!"),
            role="user",
            name=fake.name(),
            is_active=True
        )
        session.add(user)
        users.append(user)
    
    session.commit()
    for user in users:
        session.refresh(user)
    
    print(f"✓ Created {len(users)} users")
    return users


def seed_projects(session: Session, users: list[User]) -> list[Project]:
    """Create projects for users."""
    projects = []
    project_names = [
        ("Healthcare Analytics", "Patient data analysis and synthetic generation"),
        ("Financial Risk Model", "Transaction data for fraud detection"),
        ("HR Analytics", "Employee data for workforce planning"),
        ("Customer Insights", "Customer behavior analysis"),
        ("Marketing Campaign", "Campaign performance data"),
        ("Research Study", "Academic research dataset"),
    ]
    
    for user in users:
        for i in range(NUM_PROJECTS_PER_USER):
            name, desc = random.choice(project_names)
            project = Project(
                owner_id=user.id,
                name=f"{name} - {fake.company_suffix()}",
                description=desc,
                default_retention_days=random.choice([30, 60, 90, 180]),
                created_at=fake.date_time_between(start_date="-6m", end_date="-1d")
            )
            session.add(project)
            projects.append(project)
    
    session.commit()
    for project in projects:
        session.refresh(project)
    
    print(f"✓ Created {len(projects)} projects")
    return projects


def seed_datasets(session: Session, projects: list[Project], users: list[User]) -> list[Dataset]:
    """Create datasets with actual CSV files."""
    datasets = []
    domains = ["healthcare", "finance", "hr", "generic"]
    
    for project in projects:
        owner = next(u for u in users if u.id == project.owner_id)
        
        for i in range(NUM_DATASETS_PER_PROJECT):
            domain = random.choice(domains)
            filename = f"{uuid.uuid4()}_{domain}_data.csv"
            
            # Generate actual CSV file
            file_path, meta = generate_realistic_csv(filename, domain)
            
            dataset = Dataset(
                project_id=project.id,
                name=f"{domain.title()} Dataset {i+1}",
                original_filename=filename,
                file_path=str(file_path),
                size_bytes=meta["size_bytes"],
                row_count=meta["row_count"],
                schema_data=meta["schema_data"],
                status="profiled",
                checksum=meta["checksum"],
                pii_flags={col: {"type": "PII", "confidence": round(random.uniform(0.85, 0.99), 2)} for col in meta["pii_columns"]},
                profiling_data={
                    "num_rows": meta["row_count"],
                    "num_columns": len(meta["schema_data"]["columns"]),
                    "missing_values": {col: random.randint(0, 50) for col in meta["schema_data"]["columns"]},
                    "generated_at": datetime.utcnow().isoformat()
                },
                uploader_id=owner.id,
                uploaded_at=fake.date_time_between(start_date="-3m", end_date="-1d")
            )
            session.add(dataset)
            datasets.append(dataset)
    
    session.commit()
    for dataset in datasets:
        session.refresh(dataset)
    
    print(f"✓ Created {len(datasets)} datasets with CSV files")
    return datasets


def seed_generators(session: Session, datasets: list[Dataset], users: list[User]) -> list[Generator]:
    """Create generators with various statuses."""
    generators = []
    generator_types = ["ctgan", "tvae", "dp-ctgan", "dp-tvae"]
    statuses = ["completed", "completed", "completed", "training", "failed"]
    
    for dataset in datasets:
        owner = next(u for u in users if u.id == dataset.uploader_id)
        
        for i in range(NUM_GENERATORS_PER_DATASET):
            gen_type = random.choice(generator_types)
            status = random.choice(statuses)
            is_dp = gen_type.startswith("dp-")
            
            # Generate synthetic output if completed
            output_dataset_id = None
            if status == "completed":
                synth_path, synth_meta = generate_synthetic_csv(
                    Path(dataset.file_path),
                    prefix=f"{gen_type}_synthetic"
                )
                synth_dataset = Dataset(
                    project_id=dataset.project_id,
                    name=f"Synthetic - {dataset.name} ({gen_type})",
                    original_filename=synth_path.name,
                    file_path=str(synth_path),
                    size_bytes=synth_meta["size_bytes"],
                    row_count=synth_meta["row_count"],
                    schema_data=dataset.schema_data,
                    status="completed",
                    checksum=synth_meta["checksum"],
                    uploader_id=owner.id,
                    uploaded_at=datetime.utcnow()
                )
                session.add(synth_dataset)
                session.flush()
                output_dataset_id = synth_dataset.id
            
            epochs = random.choice([100, 200, 300, 500])
            batch_size = random.choice([256, 500, 1000])
            
            generator = Generator(
                dataset_id=dataset.id,
                type=gen_type,
                name=f"{gen_type.upper()} Generator - {dataset.name[:20]}",
                status=status,
                output_dataset_id=output_dataset_id,
                parameters_json={
                    "epochs": epochs,
                    "batch_size": batch_size,
                    "num_rows": dataset.row_count,
                },
                privacy_config={
                    "enabled": is_dp,
                    "target_epsilon": round(random.uniform(1, 10), 1) if is_dp else None,
                    "target_delta": 1e-5 if is_dp else None,
                    "max_grad_norm": 1.0 if is_dp else None,
                } if is_dp else None,
                privacy_spent={
                    "epsilon": round(random.uniform(0.5, 8), 2),
                    "delta": 1e-5,
                } if is_dp and status == "completed" else None,
                training_metadata={
                    "duration_seconds": random.randint(60, 600),
                    "final_loss": round(random.uniform(0.01, 0.1), 4),
                    "epochs_completed": epochs if status == "completed" else random.randint(10, epochs),
                } if status in ["completed", "training"] else None,
                model_path=f"models/{uuid.uuid4()}.pkl" if status == "completed" else None,
                created_by=owner.id,
                created_at=fake.date_time_between(start_date="-2m", end_date="-1d")
            )
            session.add(generator)
            generators.append(generator)
    
    session.commit()
    for gen in generators:
        session.refresh(gen)
    
    print(f"✓ Created {len(generators)} generators")
    return generators


def seed_evaluations(session: Session, generators: list[Generator]) -> list[Evaluation]:
    """Create evaluations for completed generators."""
    evaluations = []
    
    completed_generators = [g for g in generators if g.status == "completed"]
    
    for gen in completed_generators:
        report = generate_evaluation_report()
        risk_score = round(100 - (report["overall_score"] * 100), 1)
        
        evaluation = Evaluation(
            generator_id=gen.id,
            dataset_id=gen.dataset_id,
            report=report,
            insights={
                "summary": f"The synthetic data achieved an overall quality score of {report['overall_score']:.1%}.",
                "strengths": ["Good statistical similarity", "Low privacy risk"],
                "improvements": ["Consider increasing epochs for better utility"],
            },
            risk_score=risk_score,
            risk_level="low" if risk_score < 30 else "medium" if risk_score < 60 else "high",
            risk_details={
                "re_identification_risk": round(random.uniform(0.01, 0.1), 3),
                "attribute_disclosure_risk": round(random.uniform(0.05, 0.2), 3),
            },
            created_at=gen.created_at + timedelta(minutes=random.randint(5, 60))
        )
        session.add(evaluation)
        evaluations.append(evaluation)
    
    session.commit()
    print(f"✓ Created {len(evaluations)} evaluations")
    return evaluations


def seed_jobs(session: Session, projects: list[Project], datasets: list[Dataset], 
              generators: list[Generator], users: list[User]) -> list[Job]:
    """Create job records."""
    jobs = []
    job_types = ["training", "generation", "evaluation", "profiling", "pii_detection"]
    statuses = ["completed", "completed", "completed", "running", "queued", "failed"]
    
    for gen in generators:
        dataset = next(d for d in datasets if d.id == gen.dataset_id)
        project = next(p for p in projects if p.id == dataset.project_id)
        user = next(u for u in users if u.id == gen.created_by)
        
        job = Job(
            project_id=project.id,
            initiated_by=user.id,
            dataset_id=dataset.id,
            generator_id=gen.id,
            type="training",
            status="completed" if gen.status == "completed" else gen.status,
            celery_task_id=str(uuid.uuid4()) if gen.status != "pending" else None,
            started_at=gen.created_at if gen.status != "pending" else None,
            completed_at=gen.created_at + timedelta(minutes=random.randint(5, 30)) if gen.status == "completed" else None,
            error_message="Training failed: CUDA out of memory" if gen.status == "failed" else None,
            created_at=gen.created_at
        )
        session.add(job)
        jobs.append(job)
    
    session.commit()
    print(f"✓ Created {len(jobs)} jobs")
    return jobs


def seed_audit_logs(session: Session, users: list[User], projects: list[Project],
                    datasets: list[Dataset], generators: list[Generator]) -> list[AuditLog]:
    """Create audit log entries."""
    logs = []
    actions = [
        ("user.login", None, None),
        ("user.logout", None, None),
        ("project.create", "project", None),
        ("project.view", "project", None),
        ("dataset.upload", "dataset", None),
        ("dataset.download", "dataset", None),
        ("dataset.profile", "dataset", None),
        ("generator.create", "generator", None),
        ("generator.train", "generator", None),
        ("evaluation.run", "evaluation", None),
    ]
    
    for _ in range(100):  # 100 audit log entries
        user = random.choice(users)
        action, resource_type, _ = random.choice(actions)
        
        resource_id = None
        resource_name = None
        
        if resource_type == "project":
            proj = random.choice(projects)
            resource_id = proj.id
            resource_name = proj.name
        elif resource_type == "dataset":
            ds = random.choice(datasets)
            resource_id = ds.id
            resource_name = ds.name
        elif resource_type == "generator":
            gen = random.choice(generators)
            resource_id = gen.id
            resource_name = gen.name
        
        log = AuditLog(
            user_id=user.id,
            user_email=user.email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            timestamp=fake.date_time_between(start_date="-30d", end_date="now"),
            ip_address=fake.ipv4(),
            user_agent=fake.user_agent(),
            request_method=random.choice(["GET", "POST", "PUT", "DELETE"]),
            request_path=f"/api/{resource_type}s/{resource_id}" if resource_type else f"/api/auth/{action.split('.')[1]}",
            status_code=random.choice([200, 200, 200, 201, 400, 401, 500]),
        )
        session.add(log)
        logs.append(log)
    
    session.commit()
    print(f"✓ Created {len(logs)} audit logs")
    return logs


def seed_billing(session: Session, projects: list[Project], users: list[User]) -> tuple[list, list]:
    """Create usage records and quotas."""
    usage_records = []
    quotas = []
    
    usage_types = ["rows_generated", "models_trained", "evaluations_run", "storage_mb"]
    
    for project in projects:
        user = next(u for u in users if u.id == project.owner_id)
        
        # Create usage records
        for _ in range(random.randint(5, 20)):
            record = UsageRecord(
                project_id=project.id,
                user_id=user.id,
                type=random.choice(usage_types),
                quantity=random.randint(100, 10000),
                created_at=fake.date_time_between(start_date="-30d", end_date="now")
            )
            session.add(record)
            usage_records.append(record)
        
        # Create quotas
        for quota_type in ["rows_per_month", "models_per_month", "storage_mb"]:
            quota = Quota(
                project_id=project.id,
                quota_type=quota_type,
                limit_val=random.choice([10000, 50000, 100000]),
                used=random.randint(0, 5000),
                reset_at=datetime.utcnow() + timedelta(days=random.randint(1, 30))
            )
            session.add(quota)
            quotas.append(quota)
    
    session.commit()
    print(f"✓ Created {len(usage_records)} usage records and {len(quotas)} quotas")
    return usage_records, quotas


def seed_exports(session: Session, generators: list[Generator], users: list[User]) -> list[Export]:
    """Create export records."""
    exports = []
    export_types = ["model_card", "privacy_report", "compliance_report", "evaluation_report"]
    formats = ["pdf", "docx"]
    
    completed_generators = [g for g in generators if g.status == "completed"]
    
    for gen in completed_generators[:10]:  # Limit to 10 exports
        user = next(u for u in users if u.id == gen.created_by)
        export_type = random.choice(export_types)
        fmt = random.choice(formats)
        
        export = Export(
            export_type=export_type,
            format=fmt,
            title=f"{export_type.replace('_', ' ').title()} - {gen.name}",
            generator_id=gen.id,
            dataset_id=gen.dataset_id,
            s3_key=f"exports/{uuid.uuid4()}.{fmt}",
            s3_bucket="synth-studio-exports",
            file_size_bytes=random.randint(50000, 500000),
            metadata_json={"generator_type": gen.type, "framework": "synthstudio"},
            created_by=user.id,
            created_at=fake.date_time_between(start_date="-14d", end_date="now")
        )
        session.add(export)
        exports.append(export)
    
    session.commit()
    print(f"✓ Created {len(exports)} exports")
    return exports


def seed_compliance_reports(session: Session, projects: list[Project], datasets: list[Dataset]) -> list[ComplianceReport]:
    """Create compliance reports linking projects and datasets."""
    print("Creating compliance reports...")
    
    reports = []
    
    # Create compliance reports for some datasets
    for dataset in datasets[:8]:  # First 8 datasets
        project = next((p for p in projects if p.id == dataset.project_id), None)
        if not project:
            continue
        
        report = ComplianceReport(
            project_id=project.id,
            synthetic_dataset_id=dataset.id,
            model_card_artifact_id=None,
            evaluation_artifact_id=None,
            dp_report_artifact_id=None,
            created_at=fake.date_time_between(start_date="-7d", end_date="now")
        )
        session.add(report)
        reports.append(report)
    
    session.commit()
    print(f"✓ Created {len(reports)} compliance reports")
    return reports


def clean_database(session: Session):
    """Delete all data from tables."""
    print("🧹 Cleaning database...")
    
    # Delete in correct order (foreign key constraints)
    session.exec(select(Export)).all()
    for export in session.exec(select(Export)).all():
        session.delete(export)
    
    for record in session.exec(select(ComplianceReport)).all():
        session.delete(record)
    
    for record in session.exec(select(Artifact)).all():
        session.delete(record)
    
    for model in [AuditLog, UsageRecord, Quota, Evaluation, Job, Generator, DatasetFile, Dataset, Project, APIKey, User]:
        for record in session.exec(select(model)).all():
            session.delete(record)
    
    session.commit()
    
    # Clean upload files
    if UPLOAD_DIR.exists():
        for f in UPLOAD_DIR.glob("*.csv"):
            f.unlink()
    
    print("✓ Database cleaned")


def main():
    parser = argparse.ArgumentParser(description="Seed database with realistic fake data")
    parser.add_argument("--clean", action="store_true", help="Clean database before seeding")
    args = parser.parse_args()
    
    print("🌱 Synth Studio Database Seeder")
    print("=" * 50)
    
    # Create tables
    SQLModel.metadata.create_all(engine)
    
    ensure_upload_dir()
    
    with Session(engine) as session:
        if args.clean:
            clean_database(session)
        
        # Check if data already exists
        existing_users = session.exec(select(User)).first()
        if existing_users and not args.clean:
            print("⚠️  Database already has data. Use --clean to reset.")
            return
        
        # Seed in order of dependencies
        print("\n📝 Seeding data...")
        users = seed_users(session)
        projects = seed_projects(session, users)
        datasets = seed_datasets(session, projects, users)
        generators = seed_generators(session, datasets, users)
        evaluations = seed_evaluations(session, generators)
        jobs = seed_jobs(session, projects, datasets, generators, users)
        audit_logs = seed_audit_logs(session, users, projects, datasets, generators)
        usage_records, quotas = seed_billing(session, projects, users)
        exports = seed_exports(session, generators, users)
        compliance_reports = seed_compliance_reports(session, projects, datasets)
        
        print("\n" + "=" * 50)
        print("✅ Database seeding complete!")
        print(f"""
Summary:
  - Users: {len(users)}
  - Projects: {len(projects)}
  - Datasets: {len(datasets)} (with CSV files)
  - Generators: {len(generators)}
  - Evaluations: {len(evaluations)}
  - Jobs: {len(jobs)}
  - Audit Logs: {len(audit_logs)}
  - Usage Records: {len(usage_records)}
  - Quotas: {len(quotas)}
  - Exports: {len(exports)}
  - Compliance Reports: {len(compliance_reports)}

Demo Credentials:
  - Admin: admin@synthstudio.io / Admin123!
  - Demo:  demo@synthstudio.io / Demo123!
""")


if __name__ == "__main__":
    main()
