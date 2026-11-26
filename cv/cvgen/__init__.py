"""CV generator: one master data file + one profile per job -> .docx (and an HTML preview).

model.py        pure logic: load YAML, pick items for a profile, build the render context
render_docx.py  writes the Word document
render_html.py  writes the HTML preview (same layout, for viewing in a browser or as an artifact)
"""
