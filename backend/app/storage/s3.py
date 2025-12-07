"""
AWS S3 Storage Service for Synth Studio.

Handles all file storage operations for datasets, models, synthetic data, and exports.
"""

import os
import uuid
import logging
from datetime import datetime
from typing import BinaryIO, Optional, List, Dict, Any
from pathlib import Path

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.config import Config

logger = logging.getLogger(__name__)


class S3StorageError(Exception):
    """Base exception for S3 storage operations."""
    pass


class S3ConfigurationError(S3StorageError):
    """Raised when S3 is not properly configured."""
    pass


class S3UploadError(S3StorageError):
    """Raised when upload fails."""
    pass


class S3DownloadError(S3StorageError):
    """Raised when download fails."""
    pass


class S3StorageService:
    """
    AWS S3 Storage Service for managing files in Synth Studio.
    
    Bucket Structure:
    {bucket}/
    ├── datasets/{user_id}/raw/{filename}
    ├── datasets/{user_id}/processed/{filename}
    ├── models/{user_id}/{filename}
    ├── synthetic/{user_id}/{dataset_id}/{filename}
    └── exports/{user_id}/{filename}
    """
    
    def __init__(
        self,
        bucket_name: Optional[str] = None,
        region: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ):
        """
        Initialize S3 storage service.
        
        Args:
            bucket_name: S3 bucket name (or AWS_S3_BUCKET env var)
            region: AWS region (or AWS_REGION env var)
            access_key: AWS access key (or AWS_ACCESS_KEY_ID env var)
            secret_key: AWS secret key (or AWS_SECRET_ACCESS_KEY env var)
        """
        self.bucket_name = bucket_name or os.getenv("AWS_S3_BUCKET")
        self.region = region or os.getenv("AWS_REGION", "us-east-1")
        
        if not self.bucket_name:
            raise S3ConfigurationError(
                "S3 bucket name not configured. Set AWS_S3_BUCKET environment variable."
            )
        
        # Configure boto3 client
        config = Config(
            region_name=self.region,
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "adaptive"},
        )
        
        # Use explicit credentials if provided, otherwise rely on AWS credential chain
        client_kwargs = {"config": config}
        
        access_key = access_key or os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = secret_key or os.getenv("AWS_SECRET_ACCESS_KEY")
        
        if access_key and secret_key:
            client_kwargs["aws_access_key_id"] = access_key
            client_kwargs["aws_secret_access_key"] = secret_key
        
        try:
            self.s3_client = boto3.client("s3", **client_kwargs)
            # Verify bucket exists and we have access
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"S3 Storage initialized: bucket={self.bucket_name}, region={self.region}")
        except NoCredentialsError:
            raise S3ConfigurationError(
                "AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
            )
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "404":
                raise S3ConfigurationError(f"S3 bucket '{self.bucket_name}' does not exist.")
            elif error_code == "403":
                raise S3ConfigurationError(
                    f"Access denied to S3 bucket '{self.bucket_name}'. Check IAM permissions."
                )
            raise S3ConfigurationError(f"Failed to connect to S3: {e}")
    
    # ==================== Path Helpers ====================
    
    def _get_dataset_key(
        self,
        user_id: str,
        filename: str,
        processed: bool = False
    ) -> str:
        """Generate S3 key for dataset files."""
        subfolder = "processed" if processed else "raw"
        return f"datasets/{user_id}/{subfolder}/{filename}"
    
    def _get_model_key(self, user_id: str, filename: str) -> str:
        """Generate S3 key for model files."""
        return f"models/{user_id}/{filename}"
    
    def _get_synthetic_key(
        self,
        user_id: str,
        dataset_id: str,
        filename: str
    ) -> str:
        """Generate S3 key for synthetic data files."""
        return f"synthetic/{user_id}/{dataset_id}/{filename}"
    
    def _get_export_key(self, user_id: str, filename: str) -> str:
        """Generate S3 key for export files."""
        return f"exports/{user_id}/{filename}"
    
    # ==================== Upload Operations ====================
    
    def upload_file(
        self,
        file_obj: BinaryIO,
        key: str,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Upload a file to S3.
        
        Args:
            file_obj: File-like object to upload
            key: S3 object key
            content_type: MIME type of the file
            metadata: Optional metadata to attach to the object
            
        Returns:
            Dict with upload details (key, url, size, etag)
        """
        try:
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type
            if metadata:
                extra_args["Metadata"] = metadata
            
            # Get file size
            file_obj.seek(0, 2)  # Seek to end
            file_size = file_obj.tell()
            file_obj.seek(0)  # Seek back to start
            
            response = self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                key,
                ExtraArgs=extra_args if extra_args else None,
            )
            
            # Get ETag for verification
            head_response = self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            etag = head_response.get("ETag", "").strip('"')
            
            logger.info(f"Uploaded file to S3: {key} ({file_size} bytes)")
            
            return {
                "key": key,
                "bucket": self.bucket_name,
                "size": file_size,
                "etag": etag,
                "url": f"s3://{self.bucket_name}/{key}",
            }
            
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise S3UploadError(f"Upload failed: {e}")
    
    def upload_dataset(
        self,
        file_obj: BinaryIO,
        user_id: str,
        filename: str,
        content_type: Optional[str] = None,
        processed: bool = False,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Upload a dataset file.
        
        Args:
            file_obj: File-like object
            user_id: Owner's user ID
            filename: Original filename
            content_type: MIME type
            processed: Whether this is a processed/cleaned dataset
            metadata: Additional metadata
            
        Returns:
            Upload result with S3 key and details
        """
        # Generate unique filename to avoid collisions
        ext = Path(filename).suffix
        unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
        key = self._get_dataset_key(user_id, unique_filename, processed)
        
        file_metadata = metadata or {}
        file_metadata["original_filename"] = filename
        file_metadata["user_id"] = user_id
        file_metadata["upload_timestamp"] = datetime.utcnow().isoformat()
        
        return self.upload_file(file_obj, key, content_type, file_metadata)
    
    def upload_model(
        self,
        file_obj: BinaryIO,
        user_id: str,
        filename: str,
        model_type: str = "unknown",
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Upload a model file (e.g., trained generator).
        
        Args:
            file_obj: File-like object
            user_id: Owner's user ID
            filename: Model filename
            model_type: Type of model (ctgan, tvae, etc.)
            metadata: Additional metadata
            
        Returns:
            Upload result with S3 key and details
        """
        unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
        key = self._get_model_key(user_id, unique_filename)
        
        file_metadata = metadata or {}
        file_metadata["original_filename"] = filename
        file_metadata["user_id"] = user_id
        file_metadata["model_type"] = model_type
        file_metadata["upload_timestamp"] = datetime.utcnow().isoformat()
        
        return self.upload_file(file_obj, key, "application/octet-stream", file_metadata)
    
    def upload_synthetic_data(
        self,
        file_obj: BinaryIO,
        user_id: str,
        dataset_id: str,
        filename: str,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Upload generated synthetic data.
        
        Args:
            file_obj: File-like object
            user_id: Owner's user ID
            dataset_id: Associated dataset ID
            filename: Output filename
            content_type: MIME type
            metadata: Additional metadata
            
        Returns:
            Upload result with S3 key and details
        """
        unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{filename}"
        key = self._get_synthetic_key(user_id, dataset_id, unique_filename)
        
        file_metadata = metadata or {}
        file_metadata["user_id"] = user_id
        file_metadata["dataset_id"] = dataset_id
        file_metadata["generation_timestamp"] = datetime.utcnow().isoformat()
        
        return self.upload_file(file_obj, key, content_type, file_metadata)
    
    def upload_export(
        self,
        file_obj: BinaryIO,
        user_id: str,
        filename: str,
        export_type: str = "data",
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Upload an export file (reports, bundles, etc.).
        
        Args:
            file_obj: File-like object
            user_id: Owner's user ID
            filename: Export filename
            export_type: Type of export (data, report, bundle)
            content_type: MIME type
            metadata: Additional metadata
            
        Returns:
            Upload result with S3 key and details
        """
        unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{filename}"
        key = self._get_export_key(user_id, unique_filename)
        
        file_metadata = metadata or {}
        file_metadata["user_id"] = user_id
        file_metadata["export_type"] = export_type
        file_metadata["export_timestamp"] = datetime.utcnow().isoformat()
        
        return self.upload_file(file_obj, key, content_type, file_metadata)
    
    # ==================== Download Operations ====================
    
    def generate_presigned_url(
        self,
        key: str,
        expires_in: int = 3600,
        response_content_type: Optional[str] = None,
        response_content_disposition: Optional[str] = None,
    ) -> str:
        """
        Generate a presigned URL for downloading a file.
        
        Args:
            key: S3 object key
            expires_in: URL expiration time in seconds (default 1 hour)
            response_content_type: Force specific content type on download
            response_content_disposition: Force download with specific filename
            
        Returns:
            Presigned URL string
        """
        try:
            params = {
                "Bucket": self.bucket_name,
                "Key": key,
            }
            
            if response_content_type:
                params["ResponseContentType"] = response_content_type
            if response_content_disposition:
                params["ResponseContentDisposition"] = response_content_disposition
            
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expires_in,
            )
            
            logger.debug(f"Generated presigned URL for: {key}")
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise S3DownloadError(f"Failed to generate download URL: {e}")
    
    def generate_download_url(
        self,
        key: str,
        filename: Optional[str] = None,
        expires_in: int = 3600,
    ) -> str:
        """
        Generate a presigned URL that forces file download with optional custom filename.
        
        Args:
            key: S3 object key
            filename: Filename to use for download (optional)
            expires_in: URL expiration in seconds
            
        Returns:
            Presigned download URL
        """
        disposition = None
        if filename:
            disposition = f'attachment; filename="{filename}"'
        
        return self.generate_presigned_url(
            key,
            expires_in=expires_in,
            response_content_disposition=disposition,
        )
    
    def download_file(self, key: str, file_obj: BinaryIO) -> int:
        """
        Download a file from S3.
        
        Args:
            key: S3 object key
            file_obj: File-like object to write to
            
        Returns:
            Number of bytes downloaded
        """
        try:
            self.s3_client.download_fileobj(self.bucket_name, key, file_obj)
            file_obj.seek(0, 2)
            size = file_obj.tell()
            file_obj.seek(0)
            logger.info(f"Downloaded file from S3: {key} ({size} bytes)")
            return size
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "404":
                raise S3DownloadError(f"File not found: {key}")
            logger.error(f"Failed to download file from S3: {e}")
            raise S3DownloadError(f"Download failed: {e}")
    
    def get_file_stream(self, key: str, chunk_size: int = 1024 * 1024):
        """
        Get a generator that yields file content chunks from S3.
        
        Args:
            key: S3 object key
            chunk_size: Size of chunks to yield (default 1MB)
            
        Yields:
            Bytes chunks of the file
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            stream = response['Body']
            for chunk in stream.iter_chunks(chunk_size):
                yield chunk
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "404":
                raise S3DownloadError(f"File not found: {key}")
            logger.error(f"Failed to stream file from S3: {e}")
            raise S3DownloadError(f"Download failed: {e}")
    
    def delete_file(self, key: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            key: S3 object key
            
        Returns:
            True if deleted successfully
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            logger.info(f"Deleted file from S3: {key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return False
    
    def delete_prefix(self, prefix: str) -> int:
        """
        Delete all files under a prefix (folder).
        
        Args:
            prefix: S3 key prefix to delete
            
        Returns:
            Number of files deleted
        """
        try:
            # List all objects with the prefix
            paginator = self.s3_client.get_paginator("list_objects_v2")
            
            deleted_count = 0
            for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
                if "Contents" not in page:
                    continue
                
                objects = [{"Key": obj["Key"]} for obj in page["Contents"]]
                if objects:
                    self.s3_client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={"Objects": objects},
                    )
                    deleted_count += len(objects)
            
            logger.info(f"Deleted {deleted_count} files with prefix: {prefix}")
            return deleted_count
            
        except ClientError as e:
            logger.error(f"Failed to delete prefix from S3: {e}")
            return 0
    
    def delete_user_data(self, user_id: str) -> Dict[str, int]:
        """
        Delete all data for a user (GDPR compliance).
        
        Args:
            user_id: User ID to delete data for
            
        Returns:
            Dict with counts of deleted files by category
        """
        results = {}
        prefixes = [
            f"datasets/{user_id}/",
            f"models/{user_id}/",
            f"synthetic/{user_id}/",
            f"exports/{user_id}/",
        ]
        
        for prefix in prefixes:
            category = prefix.split("/")[0]
            results[category] = self.delete_prefix(prefix)
        
        logger.info(f"Deleted all data for user {user_id}: {results}")
        return results
    
    # ==================== List Operations ====================
    
    def list_files(
        self,
        prefix: str,
        max_keys: int = 1000,
    ) -> List[Dict[str, Any]]:
        """
        List files under a prefix.
        
        Args:
            prefix: S3 key prefix
            max_keys: Maximum number of results
            
        Returns:
            List of file info dicts
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_keys,
            )
            
            files = []
            for obj in response.get("Contents", []):
                files.append({
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat(),
                    "etag": obj["ETag"].strip('"'),
                })
            
            return files
            
        except ClientError as e:
            logger.error(f"Failed to list files in S3: {e}")
            return []
    
    def list_user_datasets(
        self,
        user_id: str,
        processed: bool = False,
    ) -> List[Dict[str, Any]]:
        """List all datasets for a user."""
        subfolder = "processed" if processed else "raw"
        return self.list_files(f"datasets/{user_id}/{subfolder}/")
    
    def list_user_models(self, user_id: str) -> List[Dict[str, Any]]:
        """List all models for a user."""
        return self.list_files(f"models/{user_id}/")
    
    def list_user_synthetic(
        self,
        user_id: str,
        dataset_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List synthetic data for a user, optionally filtered by dataset."""
        prefix = f"synthetic/{user_id}/"
        if dataset_id:
            prefix += f"{dataset_id}/"
        return self.list_files(prefix)
    
    def list_user_exports(self, user_id: str) -> List[Dict[str, Any]]:
        """List all exports for a user."""
        return self.list_files(f"exports/{user_id}/")
    
    # ==================== Utility Methods ====================
    
    def file_exists(self, key: str) -> bool:
        """Check if a file exists in S3."""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError:
            return False
    
    def get_file_info(self, key: str) -> Optional[Dict[str, Any]]:
        """Get metadata about a file."""
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return {
                "key": key,
                "size": response["ContentLength"],
                "content_type": response.get("ContentType"),
                "last_modified": response["LastModified"].isoformat(),
                "etag": response["ETag"].strip('"'),
                "metadata": response.get("Metadata", {}),
            }
        except ClientError:
            return None
    
    def copy_file(self, source_key: str, dest_key: str) -> bool:
        """Copy a file within the bucket."""
        try:
            self.s3_client.copy_object(
                Bucket=self.bucket_name,
                CopySource={"Bucket": self.bucket_name, "Key": source_key},
                Key=dest_key,
            )
            logger.info(f"Copied file in S3: {source_key} -> {dest_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to copy file in S3: {e}")
            return False


# ==================== Singleton Instance ====================

_storage_service: Optional[S3StorageService] = None


def get_storage_service() -> S3StorageService:
    """
    Get the singleton S3 storage service instance.
    
    Returns:
        S3StorageService instance
        
    Raises:
        S3ConfigurationError: If S3 is not properly configured
    """
    global _storage_service
    
    if _storage_service is None:
        _storage_service = S3StorageService()
    
    return _storage_service


def init_storage_service(
    bucket_name: Optional[str] = None,
    region: Optional[str] = None,
    access_key: Optional[str] = None,
    secret_key: Optional[str] = None,
) -> S3StorageService:
    """
    Initialize the S3 storage service with explicit configuration.
    
    Use this during application startup to configure S3 with custom settings.
    
    Args:
        bucket_name: S3 bucket name
        region: AWS region
        access_key: AWS access key
        secret_key: AWS secret key
        
    Returns:
        Configured S3StorageService instance
    """
    global _storage_service
    
    _storage_service = S3StorageService(
        bucket_name=bucket_name,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
    )
    
    return _storage_service


# ==================== Legacy Compatibility ====================

def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """
    Legacy function for generating presigned URLs.
    
    This maintains backward compatibility with existing code.
    For new code, use get_storage_service().generate_presigned_url()
    """
    try:
        service = get_storage_service()
        return service.generate_presigned_url(key, expires_in)
    except S3ConfigurationError:
        # Fallback for development/testing without S3
        logger.warning("S3 not configured, returning mock URL")
        return f"https://mock-s3.example.com/{key}?expires_in={expires_in}"
