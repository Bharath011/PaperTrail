"""Convert the shared literature workbook into the app's TypeScript seed data."""

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "literature-source.xlsx"
OUTPUT = ROOT / "db" / "seed-papers.ts"
MAIN_COLLECTIONS = {
    "Reasoning",
    "Latent Reasoning",
    "Distillation+ Reasoning",
    "Basic Papers",
    "Interpretability",
}
NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def read_workbook():
    with zipfile.ZipFile(SOURCE) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [
                "".join(node.text or "" for node in item.iter(f"{{{NS['m']}}}t"))
                for item in root.findall("m:si", NS)
            ]

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relation_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        relations = {node.attrib["Id"]: node.attrib["Target"] for node in relation_root}
        sheets = []

        for sheet in workbook.find("m:sheets", NS):
            name = sheet.attrib["name"]
            relation_id = sheet.attrib[f"{{{NS['r']}}}id"]
            target = relations[relation_id].lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            root = ET.fromstring(archive.read(target))
            rows = []

            for row in root.findall(".//m:sheetData/m:row", NS):
                cells = {}
                for cell in row.findall("m:c", NS):
                    match = re.match(r"[A-Z]+", cell.attrib.get("r", ""))
                    if not match:
                        continue
                    column = match.group(0)
                    cell_type = cell.attrib.get("t")
                    value_node = cell.find("m:v", NS)
                    inline = cell.find("m:is", NS)
                    value = ""
                    if inline is not None:
                        value = "".join(node.text or "" for node in inline.iter(f"{{{NS['m']}}}t"))
                    elif value_node is not None:
                        value = value_node.text or ""
                        if cell_type == "s":
                            value = shared[int(value)]
                    value = re.sub(r"\s+", " ", str(value)).strip()
                    if value:
                        cells[column] = value
                if cells:
                    rows.append((int(row.attrib["r"]), cells))
            sheets.append((name, rows))
        return sheets


def is_url(value):
    return value.startswith(("https://", "http://"))


def make_papers(sheets):
    papers = []
    for section, rows in sheets:
        if section not in MAIN_COLLECTIONS:
            continue
        for row_number, cells in rows:
            values = list(cells.values())
            url = next((value for value in values if is_url(value)), "")
            title = ""
            for column in ("D", "C", "A", "B", "E", "F", "G", "I", "K"):
                candidate = cells.get(column, "")
                if candidate and not is_url(candidate) and not re.fullmatch(r"\d+(\.0)?", candidate):
                    title = candidate
                    break
            if not title:
                title = f"Research resource {row_number}"
            remaining = [
                value for value in values
                if value not in (title, url) and not re.fullmatch(r"\d+(\.0)?", value)
            ]
            remarks = " · ".join(dict.fromkeys(remaining))
            year_match = re.search(r"\b(19|20)\d{2}\b", " ".join(values))
            papers.append({
                "title": title,
                "authors": "",
                "year": year_match.group(0) if year_match else "",
                "section": section,
                "url": url,
                "remarks": remarks,
                "isRead": 0,
            })
    return papers


sheets = read_workbook()
sections = [name for name, _ in sheets]
papers = make_papers(sheets)
source = (
    "// Generated from the shared literature survey workbook.\n"
    "export const sourceSections = " + json.dumps(sections, ensure_ascii=False) + " as const;\n\n"
    "export const seedPapers = " + json.dumps(papers, ensure_ascii=False, indent=2) + " as const;\n"
)
OUTPUT.write_text(source, encoding="utf-8")
print(f"Imported {len(papers)} paper/resource rows across {len(sections)} sheet sections.")
