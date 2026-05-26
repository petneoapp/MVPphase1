import os
from datetime import datetime
from fastapi import UploadFile, HTTPException
from azure.storage.blob import BlobServiceClient, ContentSettings

# Fetch connection string from environment
AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "petneo")

# Mapping entity to subfolder
UPLOAD_PATHS = {
    "vet_profile": "vet/profile",
    "vet_cert": "vet/cert",
    "pet_image": "pet/images",
    "user_image": "user/images",
    "pet_prescription": "pet/prescriptions"
}


async def upload_file_local(file: UploadFile, entity_type: str, entity_id: int) -> str:
    """
    Backward-compatible wrapper. Reads the UploadFile and delegates to upload_file_bytes.
    """
    content = await file.read()
    filename = file.filename or "upload"
    content_type = file.content_type or "application/octet-stream"
    try:
        return await upload_file_bytes(content, filename, content_type, entity_type, entity_id)
    finally:
        try:
            file.file.close()
        except Exception:
            pass


async def upload_file_bytes(content: bytes, filename: str, content_type: str, entity_type: str, entity_id: int) -> str:
    """
    Uploads raw bytes directly to Azure Blob Storage and returns the public blob URL.
    This avoids all UploadFile / SpooledTemporaryFile issues on Python 3.14.
    """
    import time
    start_time = time.time()
    print(f"[TRACE] [{time.time() - start_time:.3f}s] upload_file_bytes: entity_type={entity_type}, entity_id={entity_id}, filename={filename}, size={len(content)} bytes")

    # ==========================================
    # TEMPORARY AZURE BYPASS FOR DEBUGGING
    # ==========================================
    BYPASS_AZURE = False
    if BYPASS_AZURE:
        print(f"[TRACE] [{time.time() - start_time:.3f}s] upload_file_bytes: BYPASS_AZURE=True. Returning dummy URL instantly.")
        return "https://dummyimage.com/600x400/000/fff&text=Upload+Bypass"
    # ==========================================

    try:
        if entity_type not in UPLOAD_PATHS:
            raise HTTPException(status_code=400, detail=f"Unknown entity_type: {entity_type}")

        if not AZURE_CONNECTION_STRING:
            raise HTTPException(status_code=500, detail="Azure Storage Connection String is not configured in env.")

        # Fast DNS check to prevent 90-second getaddrinfo hangs on unresolvable hosts
        try:
            parts = dict(item.split("=", 1) for item in AZURE_CONNECTION_STRING.split(";") if "=" in item)
            account_name = parts.get("AccountName")
            if account_name:
                hostname = f"{account_name}.blob.core.windows.net"
                print(f"[TRACE] Pre-checking DNS for {hostname}...")
                import concurrent.futures
                import socket
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(socket.gethostbyname, hostname)
                    future.result(timeout=1.0)
        except Exception as dns_err:
            raise Exception(f"Azure storage host is unreachable: {dns_err}")

        print(f"[TRACE] [{time.time() - start_time:.3f}s] upload_file_bytes: Initializing BlobServiceClient...")
        blob_service_client = BlobServiceClient.from_connection_string(
            AZURE_CONNECTION_STRING,
            connection_timeout=2,
            read_timeout=3
        )
        container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

        name, ext = os.path.splitext(filename)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        unique_filename = f"{entity_type}_{entity_id}_{timestamp}{ext}"
        blob_name = f"{UPLOAD_PATHS[entity_type]}/{unique_filename}"

        print(f"[TRACE] [{time.time() - start_time:.3f}s] upload_file_bytes: Target blob: {blob_name}")

        blob_client = container_client.get_blob_client(blob_name)
        content_settings = ContentSettings(content_type=content_type) if content_type else None

        print(f"[TRACE] [{time.time() - start_time:.3f}s] upload_file_bytes: Starting upload_blob...")
        blob_client.upload_blob(content, overwrite=True, content_settings=content_settings)
        print(f"[TRACE] [{time.time() - start_time:.3f}s] upload_file_bytes: Upload complete. URL={blob_client.url}")

        return blob_client.url

    except Exception as e:
        print(f"[WARNING] Azure upload failed: {str(e)}. Falling back to local storage.")
        try:
            name, ext = os.path.splitext(filename)
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
            unique_filename = f"{entity_type}_{entity_id}_{timestamp}{ext}"
            
            if not os.path.exists("uploads"):
                os.makedirs("uploads")
                
            local_path = os.path.join("uploads", unique_filename)
            with open(local_path, "wb") as f:
                f.write(content)
                
            base_url = os.getenv("BASE_URL", "https://unbiased-dane-new.ngrok-free.app")
            local_url = f"{base_url.rstrip('/')}/uploads/{unique_filename}"
            print(f"[TRACE] Saved to local storage fallback: {local_url}")
            return local_url
        except Exception as local_err:
            print(f"[ERROR] Local fallback storage also failed: {str(local_err)}")
            raise HTTPException(status_code=500, detail=f"Upload failed: Azure error: {str(e)}. Local fallback error: {str(local_err)}")
