from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.dependencies import get_pipeline
from src.rag.pipeline_manager import PipelineManager

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Natural language question")
    session_id: str = Field(..., description="Session ID to scope the search")
    limit: int = Field(3, ge=1, le=10, description="Number of pages to retrieve")


class QueryResponse(BaseModel):
    answer: str
    session_id: str
    pages: list[dict]


@router.post("", response_model=QueryResponse)
def query_documents(
    body: QueryRequest,
    pipeline: PipelineManager = Depends(get_pipeline),
):
    try:
        result = pipeline.query(body.text, body.limit, session_id=body.session_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Query failed: {exc}") from exc

    return QueryResponse(
        answer=result["answer"],
        session_id=body.session_id,
        pages=result["pages"],
    )
