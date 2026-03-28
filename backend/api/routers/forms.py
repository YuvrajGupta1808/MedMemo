"""Form generation endpoint — uses RAG context + Gemini to auto-populate medical forms."""

import json
import os
from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from api.dependencies import get_pipeline
from src.rag.pipeline_manager import PipelineManager

router = APIRouter()

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class FormType(str, Enum):
    referral = "referral"
    prescription = "prescription"
    prior_auth = "prior_auth"


class FormGenerateRequest(BaseModel):
    form_type: FormType = Field(..., description="Type of form to generate")
    session_id: str = Field(..., description="Session ID to pull patient data from")
    patient_id: str = Field(..., description="Patient identifier")


class FormField(BaseModel):
    label: str
    value: str
    editable: bool
    type: str  # text, textarea, date, select, number
    options: Optional[list[str]] = None


class FormGenerateResponse(BaseModel):
    form_type: str
    title: str
    fields: list[FormField]


# ---------------------------------------------------------------------------
# Form-type specific prompts
# ---------------------------------------------------------------------------

FORM_PROMPTS: dict[FormType, dict[str, str]] = {
    FormType.referral: {
        "title": "Specialist Referral Form",
        "prompt": (
            "Extract information to fill a specialist referral form. "
            "Return JSON with these fields: patient_name, date_of_birth, "
            "referring_physician, specialist_type, reason_for_referral, "
            "clinical_history, current_medications, urgency (routine/urgent/emergent). "
            "Use the patient documents below. Leave blank if not found."
        ),
    },
    FormType.prescription: {
        "title": "Prescription Form",
        "prompt": (
            "Extract information to fill a prescription form. "
            "Return JSON with these fields: patient_name, date_of_birth, "
            "medication_name, dosage, frequency, duration, refills, "
            "prescriber_name, dea_number, diagnosis. "
            "Use the patient documents below. Leave blank if not found."
        ),
    },
    FormType.prior_auth: {
        "title": "Prior Authorization Request",
        "prompt": (
            "Extract information to fill a prior authorization form. "
            "Return JSON with these fields: patient_name, insurance_id, "
            "procedure_or_medication, diagnosis_codes, clinical_justification, "
            "supporting_documentation. "
            "Use the patient documents below. Leave blank if not found."
        ),
    },
}

# Field templates per form type — defines UI rendering
FIELD_TEMPLATES: dict[FormType, list[dict]] = {
    FormType.referral: [
        {"label": "Patient Name", "key": "patient_name", "type": "text", "editable": True},
        {"label": "Date of Birth", "key": "date_of_birth", "type": "date", "editable": True},
        {"label": "Referring Physician", "key": "referring_physician", "type": "text", "editable": True},
        {"label": "Specialist Type", "key": "specialist_type", "type": "text", "editable": True},
        {"label": "Reason for Referral", "key": "reason_for_referral", "type": "textarea", "editable": True},
        {"label": "Clinical History", "key": "clinical_history", "type": "textarea", "editable": True},
        {"label": "Current Medications", "key": "current_medications", "type": "textarea", "editable": True},
        {"label": "Urgency", "key": "urgency", "type": "select", "editable": True, "options": ["Routine", "Urgent", "Emergent"]},
    ],
    FormType.prescription: [
        {"label": "Patient Name", "key": "patient_name", "type": "text", "editable": True},
        {"label": "Date of Birth", "key": "date_of_birth", "type": "date", "editable": True},
        {"label": "Medication Name", "key": "medication_name", "type": "text", "editable": True},
        {"label": "Dosage", "key": "dosage", "type": "text", "editable": True},
        {"label": "Frequency", "key": "frequency", "type": "select", "editable": True, "options": ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed", "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours"]},
        {"label": "Duration", "key": "duration", "type": "text", "editable": True},
        {"label": "Refills", "key": "refills", "type": "number", "editable": True},
        {"label": "Prescriber Name", "key": "prescriber_name", "type": "text", "editable": True},
        {"label": "DEA Number", "key": "dea_number", "type": "text", "editable": True},
        {"label": "Diagnosis", "key": "diagnosis", "type": "text", "editable": True},
    ],
    FormType.prior_auth: [
        {"label": "Patient Name", "key": "patient_name", "type": "text", "editable": True},
        {"label": "Insurance ID", "key": "insurance_id", "type": "text", "editable": True},
        {"label": "Procedure / Medication", "key": "procedure_or_medication", "type": "text", "editable": True},
        {"label": "Diagnosis Codes", "key": "diagnosis_codes", "type": "text", "editable": True},
        {"label": "Clinical Justification", "key": "clinical_justification", "type": "textarea", "editable": True},
        {"label": "Supporting Documentation", "key": "supporting_documentation", "type": "textarea", "editable": False},
    ],
}


# ---------------------------------------------------------------------------
# Gemini client (lazy singleton)
# ---------------------------------------------------------------------------
_genai_client: genai.Client | None = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        _genai_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _genai_client


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/generate", response_model=FormGenerateResponse)
def generate_form(
    body: FormGenerateRequest,
    pipeline: PipelineManager = Depends(get_pipeline),
):
    """Generate an auto-populated medical form using RAG context + Gemini."""
    form_cfg = FORM_PROMPTS[body.form_type]
    field_templates = FIELD_TEMPLATES[body.form_type]

    # 1. Retrieve relevant documents from the session via RAG
    try:
        rag_result = pipeline.query(
            f"patient information for {body.form_type.value} form",
            limit=5,
            session_id=body.session_id,
        )
    except Exception:
        rag_result = {"answer": "", "pages": []}

    # Build context text from RAG answer
    context_text = rag_result.get("answer", "") or "No patient documents found."

    # 2. Ask Gemini to extract structured fields
    prompt = (
        f"{form_cfg['prompt']}\n\n"
        f"Patient context from medical records:\n{context_text}\n\n"
        "Return ONLY valid JSON with the field keys specified above. "
        "Use empty string for fields you cannot determine."
    )

    extracted: dict = {}
    try:
        client = _get_genai_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        extracted = json.loads(response.text) if response.text else {}
    except Exception:
        # If Gemini fails, return empty form — still usable
        pass

    # 3. Map extracted values onto field templates
    fields: list[FormField] = []
    for tmpl in field_templates:
        value = str(extracted.get(tmpl["key"], ""))
        fields.append(
            FormField(
                label=tmpl["label"],
                value=value,
                editable=tmpl.get("editable", True),
                type=tmpl["type"],
                options=tmpl.get("options"),
            )
        )

    return FormGenerateResponse(
        form_type=body.form_type.value,
        title=form_cfg["title"],
        fields=fields,
    )
