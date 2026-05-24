import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path: str):
    """
    Extract text from PDF file
    """

    doc = fitz.open(pdf_path)

    full_text = ""

    for page in doc:
        full_text += page.get_text()

    return full_text