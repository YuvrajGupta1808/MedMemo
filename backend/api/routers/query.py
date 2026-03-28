import json
import os

from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
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


# ---------------------------------------------------------------------------
# POST /query/structured — extract structured lab data via Gemini
# ---------------------------------------------------------------------------

class StructuredQueryRequest(BaseModel):
    session_id: str = Field(..., description="Session ID to scope the search")
    query_text: str = Field(..., min_length=1, description="Query to find lab results")


class LabResult(BaseModel):
    test_name: str
    value: float
    unit: str
    date: str
    normal_min: float
    normal_max: float


class StructuredQueryResponse(BaseModel):
    results: list[LabResult]


_STRUCTURED_EXTRACTION_PROMPT = """You are a medical lab data extraction assistant.
Given the following medical document text, extract ALL lab test results you can find.

For each lab result, provide:
- test_name: The name of the lab test (e.g. "Hemoglobin", "Glucose", "WBC")
- value: The numeric test value as a float
- unit: The unit of measurement (e.g. "g/dL", "mg/dL", "cells/mcL")
- date: The date the test was performed in ISO format "YYYY-MM-DD". If only a partial date is available, use the best approximation. If no date is found, use "unknown".
- normal_min: The lower bound of the normal reference range as a float
- normal_max: The upper bound of the normal reference range as a float

If a normal range is not explicitly stated, use commonly accepted clinical reference ranges.
Only include results where you can determine a numeric value.
Return a JSON array of objects. If no lab results are found, return an empty array.
"""


@router.post("/structured", response_model=StructuredQueryResponse)
def query_structured(
    body: StructuredQueryRequest,
    pipeline: PipelineManager = Depends(get_pipeline),
):
    """Retrieve documents for a session and extract structured lab data via Gemini."""
    try:
        result = pipeline.query(body.query_text, limit=5, session_id=body.session_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {exc}") from exc

    # Collect text from retrieved pages (answer contains a summary of all pages)
    context_text = result.get("answer", "")
    if not context_text.strip():
        return StructuredQueryResponse(results=[])

    # Use Gemini to extract structured lab data
    try:
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                f"Medical document content:\n\n{context_text}\n\n{_STRUCTURED_EXTRACTION_PROMPT}",
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.ARRAY,
                    items=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "test_name": types.Schema(type=types.Type.STRING),
                            "value": types.Schema(type=types.Type.NUMBER),
                            "unit": types.Schema(type=types.Type.STRING),
                            "date": types.Schema(type=types.Type.STRING),
                            "normal_min": types.Schema(type=types.Type.NUMBER),
                            "normal_max": types.Schema(type=types.Type.NUMBER),
                        },
                        required=["test_name", "value", "unit", "date", "normal_min", "normal_max"],
                    ),
                ),
            ),
        )
        raw = json.loads(response.text)
        lab_results = [LabResult(**item) for item in raw]
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Structured extraction failed: {exc}"
        ) from exc

    return StructuredQueryResponse(results=lab_results)
