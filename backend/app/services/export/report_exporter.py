"""
Report Export Service.

Handles conversion of LLM Markdown outputs to PDF and Word documents.
Uses WeasyPrint for PDF generation and python-docx for Word documents.
"""

import os
import datetime
import markdown2
from pathlib import Path
from typing import Optional, Dict, Any
import logging

# Template engine
from jinja2 import Environment, FileSystemLoader

# PDF generation
from weasyprint import HTML, CSS

# Word generation
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

logger = logging.getLogger(__name__)

class ReportExporter:
    """Service for exporting reports to PDF and Word formats."""
    
    def __init__(self):
        self.templates_dir = Path(__file__).parent / "templates"
        self.env = Environment(loader=FileSystemLoader(str(self.templates_dir)))
        self.css_path = self.templates_dir / "styles.css"
        
    def _markdown_to_html(self, markdown_text: str) -> str:
        """Convert Markdown to HTML with extras."""
        return markdown2.markdown(
            markdown_text,
            extras=[
                "fenced-code-blocks",
                "tables",
                "header-ids",
                "break-on-newline",
                "target-blank-links"
            ]
        )

    def export_to_pdf(
        self,
        content_markdown: str,
        title: str,
        metadata: Dict[str, Any] = None,
        output_path: Optional[str] = None
    ) -> bytes:
        """
        Export Markdown content to PDF.
        
        Args:
            content_markdown: The markdown content (e.g., from LLM)
            title: Report title
            metadata: Additional metadata (generator_id, date, etc.)
            output_path: Optional path to save the file
            
        Returns:
            PDF bytes
        """
        try:
            # Convert Markdown to HTML
            html_content = self._markdown_to_html(content_markdown)
            
            # Prepare context for template
            context = {
                "title": title,
                "content": html_content,
                "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "year": datetime.datetime.now().year,
                **(metadata or {})
            }
            
            # Render HTML template
            template = self.env.get_template("base_report.html")
            rendered_html = template.render(**context)
            
            # Generate PDF
            pdf_doc = HTML(string=rendered_html, base_url=str(self.templates_dir))
            pdf_bytes = pdf_doc.write_pdf(stylesheets=[CSS(self.css_path)])
            
            # Save to file if path provided
            if output_path:
                with open(output_path, "wb") as f:
                    f.write(pdf_bytes)
                    
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Failed to export PDF: {e}")
            raise

    def export_to_docx(
        self,
        content_markdown: str,
        title: str,
        metadata: Dict[str, Any] = None,
        output_path: Optional[str] = None
    ) -> str:
        """
        Export Markdown content to Word document.
        
        Note: This is a simplified conversion. For complex Markdown,
        we parse line by line or use a library like pypandoc (requires system install).
        Here we'll do a basic mapping for headers and paragraphs.
        
        Args:
            content_markdown: The markdown content
            title: Report title
            metadata: Additional metadata
            output_path: Path to save the file
            
        Returns:
            Path to saved file
        """
        try:
            doc = Document()
            
            # Title
            heading = doc.add_heading(title, 0)
            heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            # Metadata
            if metadata:
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                run.italic = True
                
                for key, value in metadata.items():
                    if value:
                        run = p.add_run(f"{key.replace('_', ' ').title()}: {value}\n")
                        run.font.size = Pt(9)
            
            doc.add_paragraph()  # Spacer
            
            # Process Markdown content (Basic parser)
            # In a real enterprise app, we might use `pandoc` but that requires system dependencies.
            # We'll stick to a python-only approach for portability.
            
            lines = content_markdown.split('\n')
            code_block = False
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Code blocks
                if line.startswith('```'):
                    code_block = not code_block
                    continue
                    
                if code_block:
                    p = doc.add_paragraph(line)
                    p.style = 'Quote'  # Use Quote style for code
                    p.paragraph_format.left_indent = Inches(0.5)
                    continue
                
                # Headers
                if line.startswith('# '):
                    doc.add_heading(line[2:], 1)
                elif line.startswith('## '):
                    doc.add_heading(line[3:], 2)
                elif line.startswith('### '):
                    doc.add_heading(line[4:], 3)
                
                # Lists
                elif line.startswith('- ') or line.startswith('* '):
                    doc.add_paragraph(line[2:], style='List Bullet')
                elif line[0].isdigit() and line[1:3] == '. ':
                    doc.add_paragraph(line[3:], style='List Number')
                    
                # Blockquotes
                elif line.startswith('> '):
                    p = doc.add_paragraph(line[2:])
                    p.style = 'Quote'
                    
                # Normal text
                else:
                    doc.add_paragraph(line)
            
            # Footer
            section = doc.sections[0]
            footer = section.footer
            p = footer.paragraphs[0]
            p.text = f"Confidential - Generated by Synthetic Data Studio - {datetime.datetime.now().year}"
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            # Save
            if not output_path:
                # Create temp path if none provided
                import tempfile
                fd, output_path = tempfile.mkstemp(suffix=".docx")
                os.close(fd)
                
            doc.save(output_path)
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to export DOCX: {e}")
            raise

# Singleton instance
report_exporter = ReportExporter()
