from pdf_extractor import extract_text_from_pdf

text = extract_text_from_pdf("sample.pdf")

print(text[:300])