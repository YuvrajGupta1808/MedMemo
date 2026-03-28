from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

import src.notes.supabase_store as db
from api.dependencies import get_pipeline
from src.rag.pipeline_manager import PipelineManager

router = APIRouter(prefix="/ingest", tags=["ingest"])

CONTENT_TYPE_MAP = {
    "application/pdf": "pdf",
    "image/jpeg": "jpeg",
    "image/png": "png",
}


class FileResult(BaseModel):
    file_name: str
    document_id: str
    storage_path: str
    pages_ingested: int
    status: str
    error: str | None = None


class IngestResponse(BaseModel):
    session_id: str
    results: list[FileResult]
    total_pages: int


@router.post("", response_model=IngestResponse)
async def ingest_documents(
    files: list[UploadFile] = File(...),
    user_id: str = Form(...),
    session_id: str = Form(...),
    pipeline: PipelineManager = Depends(get_pipeline),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    user = db.get_or_create_user(user_id)
    internal_user_id = user["id"]

    results: list[FileResult] = []
    total_pages = 0

    for file in files:
        file_type = CONTENT_TYPE_MAP.get(file.content_type)
        if not file_type:
            results.append(FileResult(
                file_name=file.filename or "unknown",
                document_id="",
                storage_path="",
                pages_ingested=0,
                status="failed",
                error=f"Unsupported type '{file.content_type}'",
            ))
            continue

        file_bytes = await file.read()
        if not file_bytes:
            results.append(FileResult(
                file_name=file.filename or "unknown",
                document_id="",
                storage_path="",
                pages_ingested=0,
                status="failed",
                error="File is empty",
            ))
            continue

        document_id = None
        try:
            storage_path = db.upload_file(
                file_bytes=file_bytes,
                file_name=file.filename or f"upload.{file_type}",
                content_type=file.content_type,
                user_id=internal_user_id,
                session_id=session_id,
            )
            doc = db.create_document_record(
                user_id=internal_user_id,
                session_id=session_id,
                file_name=file.filename or f"upload.{file_type}",
                file_type=file_type,
                storage_path=storage_path,
            )
            document_id = doc["id"]
            db.update_document_status(document_id, "processing")

            pages_ingested = pipeline.ingest(
                file_bytes=file_bytes,
                document_id=document_id,
                file_type=file_type,
                user_id=internal_user_id,
                session_id=session_id,
            )
            db.update_document_status(document_id, "ingested", pages_ingested)
            total_pages += pages_ingested

            results.append(FileResult(
                file_name=file.filename or f"upload.{file_type}",
                document_id=document_id,
                storage_path=storage_path,
                pages_ingested=pages_ingested,
                status="ingested",
            ))

        except Exception as exc:
            if document_id:
                db.update_document_status(document_id, "failed")
            results.append(FileResult(
                file_name=file.filename or "unknown",
                document_id=document_id or "",
                storage_path="",
                pages_ingested=0,
                status="failed",
                error=str(exc),
            ))

    return IngestResponse(session_id=session_id, results=results, total_pages=total_pages)



@router.delete("/documents/{document_id}", response_model=dict, summary="Delete a document from Weaviate and Supabase")
def delete_document(document_id: str, pipeline: PipelineManager = Depends(get_pipeline)):
    doc = db.delete_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    # Remove from Weaviate
    pipeline.delete_document(document_id)
    return {"deleted": True, "document_id": document_id}