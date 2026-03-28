import base64
import io
from typing import TypedDict

from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFPageCountError, PDFSyntaxError
from PIL import Image, UnidentifiedImageError


class PageData(TypedDict):
    document_id: str
    page_number: int
    image_b64: str          # base64-encoded JPEG bytes
    mime_type: str          # "image/jpeg" or "image/png"
    document_type: str      # "pdf_page" | "jpeg_image" | "png_image"


class FileProcessor:
    """Converts uploaded files into a list of base64-encoded page images."""

    def process(self, file_bytes: bytes, document_id: str, file_type: str) -> list[PageData]:
        """Convert file bytes to a list of PageData dicts.

        Args:
            file_bytes: Raw file content.
            document_id: Identifier to associate with each page.
            file_type: One of "pdf", "jpeg", or "png".

        Returns:
            List of PageData dicts with document_id, page_number (1-based), image_b64,
            mime_type, and document_type.

        Raises:
            ValueError: If file_bytes is empty, the file cannot be parsed, or file_type
                        is unsupported.
        """
        if file_type == "pdf":
            return self._process_pdf(file_bytes, document_id)
        elif file_type == "jpeg":
            return self._process_image(file_bytes, document_id, mime_type="image/jpeg", document_type="jpeg_image")
        elif file_type == "png":
            return self._process_image(file_bytes, document_id, mime_type="image/png", document_type="png_image")
        else:
            raise ValueError(f"Unsupported file_type: {file_type!r}. Must be 'pdf', 'jpeg', or 'png'.")

    def _process_pdf(self, file_bytes: bytes, document_id: str) -> list[PageData]:
        if not file_bytes:
            raise ValueError("File is empty — cannot process an empty PDF.")

        try:
            images = convert_from_bytes(file_bytes, dpi=150)
        except (PDFPageCountError, PDFSyntaxError) as exc:
            raise ValueError(f"Could not parse PDF: {exc}") from exc
        except Exception as exc:
            raise ValueError(f"Failed to convert PDF to images: {exc}") from exc

        if not images:
            raise ValueError("PDF produced no pages — the file may be corrupt or empty.")

        return [
            PageData(
                document_id=document_id,
                page_number=page_number,
                image_b64=self._image_to_base64(image),
                mime_type="image/jpeg",
                document_type="pdf_page",
            )
            for page_number, image in enumerate(images, start=1)
        ]

    def _process_image(
        self, file_bytes: bytes, document_id: str, mime_type: str, document_type: str
    ) -> list[PageData]:
        if not file_bytes:
            raise ValueError("File is empty — cannot process an empty image.")

        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.verify()  # raises if corrupt
        except UnidentifiedImageError as exc:
            raise ValueError(f"Could not identify image format: {exc}") from exc
        except Exception as exc:
            raise ValueError(f"Image file is corrupt or cannot be read: {exc}") from exc

        # Re-open after verify() (verify() closes the file handle)
        try:
            image = Image.open(io.BytesIO(file_bytes))
            if document_type == "png_image":
                image = image.convert("RGB")
        except UnidentifiedImageError as exc:
            raise ValueError(f"Could not identify image format: {exc}") from exc
        except Exception as exc:
            raise ValueError(f"Image file is corrupt or cannot be read: {exc}") from exc

        return [
            PageData(
                document_id=document_id,
                page_number=1,
                image_b64=self._image_to_base64(image),
                mime_type=mime_type,
                document_type=document_type,
            )
        ]

    def _image_to_base64(self, image: Image.Image) -> str:
        """Encode a PIL Image as a base64 JPEG string.

        Args:
            image: PIL Image to encode.

        Returns:
            Base64-encoded JPEG string.
        """
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
