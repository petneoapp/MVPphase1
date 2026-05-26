from azure.storage.blob import BlobServiceClient, ContentSettings
from uuid import uuid4
import os


AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "images")

#
# Initialize the blob service client
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)


def upload_file_to_azure(file_path: str, content_type: str, overwrite: bool = False) -> str:
    """
    Upload a file to Azure Blob Storage and return the public URL.
    """
    try:
        # Unique blob name to avoid collision
        blob_name = f"{uuid4()}_{os.path.basename(file_path)}"

        # Create a blob client
        blob_client = container_client.get_blob_client(blob_name)

        # Upload the file
        with open(file_path, "rb") as data:
            blob_client.upload_blob(
                data,
                overwrite=overwrite,
                content_settings=ContentSettings(content_type=content_type)
            )

        # Construct the blob URL (assuming public access)
        blob_url = blob_client.url
        return blob_url

    except Exception as e:
        print(f"Upload failed: {e}")
        return None
