import json
import subprocess
import os

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend"))
PDF_SCRIPT_PATH = os.path.join(FRONTEND_DIR, "dist-pdf", "renderReport.mjs")

def generate_pdf_from_report_data(report_data: dict) -> bytes:
    """
    Calls the Node.js script to generate a PDF from the report data.
    """
    if not os.path.exists(PDF_SCRIPT_PATH):
        raise FileNotFoundError(f"PDF script not found at {PDF_SCRIPT_PATH}. Have you run 'npm run build:pdf'?")

    try:
        # We use subprocess.run, piping stdin and capturing stdout
        process = subprocess.run(
            ["node", PDF_SCRIPT_PATH],
            input=json.dumps(report_data).encode("utf-8"),
            capture_output=True,
            check=True
        )
        return process.stdout
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode("utf-8") if e.stderr else str(e)
        raise RuntimeError(f"Failed to generate PDF: {error_msg}")
