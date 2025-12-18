---
id: getting-started-installation
title: "Installation Guide"
sidebar_label: "Installation"
sidebar_position: 1
slug: /getting-started/installation
tags: [getting-started, install]
---
# Installation Guide

This guide will walk you through installing and setting up Synthetic Data Studio on your local machine.

##  Prerequisites

### System Requirements

- **Python**: 3.9 or higher
- **RAM**: Minimum 4GB, recommended 8GB+
- **Disk Space**: 2GB free space
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Required Software

- **Git**: For cloning the repository
- **Python**: Version 3.9 or higher
- **pip**: Python package installer (comes with Python)

##  Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Urz1/synthetic-data-studio.git

# Navigate to the backend directory
cd synthetic-data-studio/backend
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Optional: Install development dependencies
pip install -r requirements-dev.txt
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=sqlite:///./synth_studio.db

# Security Settings
SECRET_KEY=your-super-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB

# Optional: External Services
# OPENAI_API_KEY=your-openai-key
# AWS_ACCESS_KEY_ID=your-aws-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret
# S3_BUCKET=your-s3-bucket
```

### Step 5: Initialize Database

```bash
# Create database tables
python -m app.database.create_tables
```

### Step 6: Verify Installation

```bash
# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/docs to see the API documentation.

## � Docker Installation (Alternative)

If you prefer using Docker:

```bash
# Build the Docker image
docker build -t synth-studio-backend .

# Run the container
docker run -p 8000:8000 -v $(pwd)/uploads:/app/uploads synth-studio-backend
```

##  Troubleshooting

### Common Issues

#### Python Version Issues

```bash
# Check Python version
python --version

# If you have multiple Python versions, use python3
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
```

#### Database Connection Issues

```bash
# For PostgreSQL, ensure you have the driver
pip install psycopg2-binary

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/synth_studio
```

#### Port Already in Use

```bash
# Use a different port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Dependency Issues

#### CUDA/GPU Support

If you have CUDA-compatible GPU:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### Memory Issues

For systems with limited RAM:

```bash
# Use smaller batch sizes in configuration
# Set environment variable to limit memory usage
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

##  Testing Installation

### Run Basic Tests

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/test_auth.py
pytest tests/test_datasets.py

# Run with verbose output
pytest -v
```

### Health Check

```bash
# Check if server is responding
curl http://localhost:8000/health

# Should return: {"status": "healthy", "service": "synthetic-data-studio-backend"}
```

##  Project Structure

After installation, your project should look like this:

```text
synthetic-data-studio/
├── backend/
│   ├── app/                 # Main application code
│   ├── docs/                # Documentation
│   ├── tests/               # Test files
│   ├── uploads/             # Uploaded datasets
│   ├── .env                 # Environment configuration
│   ├── requirements.txt     # Python dependencies
│   └── synth_studio.db      # SQLite database (if using SQLite)
├── docker/
└── README.md
```

##  Next Steps

Now that you have Synthetic Data Studio installed:

1. **Quick Start**: Follow the [Quick Start Tutorial](../getting-started/quick-start.md)
2. **Upload Data**: Learn how to [upload your first dataset](../user-guide/uploading-data.md)
3. **Generate Data**: Try [generating synthetic data](../user-guide/generating-data.md)
4. **API Documentation**: Explore the full API at http://localhost:8000/docs

##  Support

If you encounter issues during installation:

- Check the [Troubleshooting Guide](../reference/troubleshooting.md)
- Search existing [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)
- Create a new issue with your error logs and system information

##  Updating

To update to the latest version:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt --upgrade

# Run database migrations if needed
python -m app.database.create_tables

# Restart the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

**Installation complete!**  Ready to generate your first synthetic dataset?


