from PyPDF2 import PdfReader

def extract_text_from_pdf(file_storage):
    reader = PdfReader(file_storage.stream)
    text = ''
    for page in reader.pages:
        text += page.extract_text() or ''
    return text


