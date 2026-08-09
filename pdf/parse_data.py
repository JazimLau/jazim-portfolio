# -*- coding: utf-8 -*-
"""Parse portfolio TS data files into pdf/data/pdf-data.json for the PDF generation.

Reads real data only (no invented copy). lt('zh','en') pairs are extracted as-is.
"""
import re, json, os, sys

BASE = r"D:\Desktop\jazim-portfolio\jazim-portfolio"
SRC = os.path.join(BASE, "src", "data")
OUT = os.path.join(BASE, "pdf", "data")
os.makedirs(OUT, exist_ok=True)

LT_RE = re.compile(r"^\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*$")


def lt_val(text):
    """Parse the inside of lt('zh','en') — i.e. "'zh', 'en'" — into [zh, en].
    Returns the literal string when it is not a zh/en pair."""
    m = LT_RE.match(text.strip())
    if m:
        return [m.group(1), m.group(2)]
    return text


def read(name):
    with open(os.path.join(SRC, name), "r", encoding="utf-8") as fh:
        return fh.read()


def get_block(lines, target_id):
    """Return (start_line_index, end_line_index) for object starting with id: '<target>'.
    The object's opening '{' is on the line before the id line, so we start depth at 1
    and scan from the line AFTER the id line."""
    for i, l in enumerate(lines):
        m = re.match(r"^(\s*)id: '([^']+)',\s*$", l)
        if m and m.group(2) == target_id:
            depth = 1
            j = i + 1
            while j < len(lines):
                for ch in lines[j]:
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                if depth == 0:
                    return i, j
                j += 1
    return None, None


# ---------------- projects.ts ----------------
projects_ts = read("projects.ts")
plines = projects_ts.splitlines(keepends=True)

# Top-level projects
project_ids = [
    "leihuo-external-motion",
    "game-ui-motion-studies",
    "game-ad-films",
    "game-promotion-films",
    "game-social-videos",
]


def parse_lt_field(body, field):
    m = re.search(rf"^\s*{field}:\s*lt\(((?:[^()]|\([^()]*\))*)\),?\s*$", body, re.M)
    if m:
        return lt_val(m.group(1))
    return None


def parse_str_field(body, field):
    m = re.search(rf"^\s*{field}:\s*'([^']*)',?\s*$", body, re.M)
    return m.group(1) if m else None


def parse_list_field(body, field):
    """Parse `field: [ <items> ],` where items are lt(...) or plain strings."""
    m = re.search(rf"^\s*{field}:\s*\[(.*?)\],?\s*$", body, re.M | re.S)
    if not m:
        return None
    raw = m.group(1)
    items = []
    for im in re.finditer(r"lt\(((?:[^()]|\([^()]*\))*)\)|'((?:[^'\\]|\\.)*)'", raw):
        if im.group(1) is not None:
            items.append(lt_val(im.group(1)))
        elif im.group(2) is not None:
            items.append(im.group(2))
    return items


def parse_metric_value(s):
    """value 可能是 lt('14','14') 或 '14' 或裸字符串。"""
    s = s.strip()
    m = re.fullmatch(r"lt\((.*)\)", s, re.S)
    if m:
        return lt_val(m.group(1))
    m = re.fullmatch(r"'([^']*)'", s)
    if m:
        return m.group(1)
    return s


def parse_metric_list(body):
    m = re.search(r"metrics:\s*\[(.*?)\],?\s*\n", body, re.M | re.S)
    if not m:
        return []
    raw = m.group(1)
    out = []
    for cm in re.finditer(r"\{\s*label:\s*'([^']*)'\s*,\s*value:\s*((?:lt\([^)]*\)|'[^']*'))\s*\}", raw):
        out.append({"label": cm.group(1), "value": parse_metric_value(cm.group(2))})
    return out


def parse_sections(body):
    m = re.search(r"sections:\s*\[(.*?)\n    \],", body, re.M | re.S)
    if not m:
        return []
    raw = m.group(1)
    out = []
    for sm in re.finditer(r"\{\s*id: '([^']+)',(.*?)\n      \}", raw, re.S):
        sid, sbody = sm.group(1), sm.group(2)
        label = re.search(r"label:\s*'([^']*)'", sbody)
        labelZh = parse_lt_field(sbody, "labelZh") or lt_val("''")
        sec = {
            "id": sid,
            "label": label.group(1) if label else sid,
            "labelZh": labelZh,
        }
        for f in ("body", "list", "flow"):
            v = parse_list_field(sbody, f)
            if v:
                sec[f] = v
        out.append(sec)
    return out


def parse_cases(body):
    """Parse `cases: [ ... ]` array with nested works."""
    m = re.search(r"cases:\s*\[(.*?)\n    \],", body, re.M | re.S)
    if not m:
        return []
    raw = m.group(1)
    cases = []
    # case objects at indent 6 ('      { id: ...')
    for cm in re.finditer(r"\{\s*id: '([^']+)',(.*?)\n      \}", raw, re.S):
        cid, cbody = cm.group(1), cm.group(2)
        c = {"id": cid}
        for f in ("name", "product", "meta", "description", "date", "role", "projectType"):
            v = parse_lt_field(cbody, f)
            if v:
                c[f] = v
        v = parse_list_field(cbody, "tags")
        if v:
            c["tags"] = v
        v = parse_list_field(cbody, "responsibility")
        if v:
            c["responsibility"] = v
        v = parse_list_field(cbody, "videos")
        if v:
            c["videos"] = v
        # works
        wm = re.search(r"works:\s*\[(.*?)\n        \],", cbody, re.M | re.S)
        works = []
        if wm:
            for w in re.finditer(r"\{\s*id: '([^']+)',(.*?)\n          \}", wm.group(1), re.S):
                wid, wbody = w.group(1), w.group(2)
                wobj = {"id": wid}
                for f in ("name", "description", "meta", "date", "role"):
                    v = parse_lt_field(wbody, f)
                    if v:
                        wobj[f] = v
                v = parse_list_field(wbody, "tags")
                if v:
                    wobj["tags"] = v
                v = parse_list_field(wbody, "videos")
                if v:
                    wobj["videos"] = v
                # detail (simplified: background/objectives/role/process/result/tools)
                dm = re.search(r"detail:\s*\{(.*?)\n            \}", wbody, re.S)
                if dm:
                    db = dm.group(1)
                    det = {}
                    for f in ("background", "role", "result"):
                        v = parse_lt_field(db, f)
                        if v:
                            det[f] = v
                    for f in ("objectives", "process", "delivery"):
                        v = parse_list_field(db, f)
                        if v:
                            det[f] = v
                    v = parse_list_field(db, "tools")
                    if v:
                        det["tools"] = v
                    wobj["detail"] = det
                works.append(wobj)
        if works:
            c["works"] = works
        # case-level detail
        dm = re.search(r"detail:\s*\{(.*?)\n      \}", cbody, re.S)
        if dm:
            db = dm.group(1)
            det = {}
            for f in ("background", "role", "result"):
                v = parse_lt_field(db, f)
                if v:
                    det[f] = v
            for f in ("objectives", "process", "delivery"):
                v = parse_list_field(db, f)
                if v:
                    det[f] = v
            v = parse_list_field(db, "tools")
            if v:
                det["tools"] = v
            c["detail"] = det
        cases.append(c)
    return cases


def parse_project(pid):
    s, e = get_block(plines, pid)
    if s is None:
        return None
    body = "".join(plines[s : e + 1])
    p = {"id": pid}
    p["slug"] = parse_str_field(body, "slug")
    p["index"] = parse_str_field(body, "index")
    p["title"] = parse_str_field(body, "title")
    p["titleZh"] = parse_lt_field(body, "titleZh")
    p["category"] = parse_lt_field(body, "category")
    p["description"] = parse_lt_field(body, "description")
    p["status"] = parse_str_field(body, "status")
    p["year"] = parse_str_field(body, "year")
    p["cover"] = parse_str_field(body, "cover")
    p["video"] = parse_str_field(body, "video")
    p["role"] = parse_list_field(body, "role")
    p["tools"] = parse_list_field(body, "tools")
    p["services"] = parse_list_field(body, "services")
    p["metrics"] = parse_metric_list(body)
    p["sections"] = parse_sections(body)
    p["cases"] = parse_cases(body)
    return p


projects = [p for p in (parse_project(pid) for pid in project_ids) if p]

# ---------------- profile.ts ----------------
prof = read("profile.ts")

def prof_field(name):
    m = re.search(rf"^\s*{name}:\s*lt\(((?:[^()]|\([^()]*\))*)\),?\s*$", prof, re.M)
    if m:
        return lt_val(m.group(1))
    m = re.search(rf"^\s*{name}:\s*'([^']*)',?\s*$", prof, re.M)
    return m.group(1) if m else None

profile = {
    "name": prof_field("name"),
    "nameEn": prof_field("nameEn"),
    "build": prof_field("build"),
    "roleEn": prof_field("roleEn"),
    "roleZh": prof_field("roleZh"),
    "positioning": prof_field("positioning"),
    "taglineEn": prof_field("taglineEn"),
    "disciplines": [d.strip().strip("'").strip('"') for d in re.search(r"disciplines:\s*\[(.*?)\],", prof, re.S).group(1).split(",")] if re.search(r"disciplines:\s*\[(.*?)\],", prof, re.S) else [],
    "email": prof_field("email"),
    "phone": prof_field("phone"),
    "wechat": prof_field("wechat"),
    "location": prof_field("location"),
    "school": prof_field("school"),
    "cvPath": prof_field("cvPath"),
    "tools": [
        {"name": m.group(1), "role": m.group(2), "state": m.group(3)}
        for m in re.finditer(
            r"\{\s*name:\s*'([^']*)',\s*role:\s*'([^']*)',\s*state:\s*'([^']*)'\s*\}",
            prof,
        )
    ],
}

# ---------------- timeline.ts ----------------
tl = read("timeline.ts")
timeline = []
for tm in re.finditer(r"\{\s*id: '([^']+)',(.*?)\n  \},", tl, re.S):
    tid, tbody = tm.group(1), tm.group(2)
    e = {"id": tid}
    for f in ("index", "period", "kind", "status"):
        v = re.search(rf"^\s*{f}:\s*'([^']*)',?\s*$", tbody, re.M)
        if v:
            e[f] = v.group(1)
    for f in ("org", "role", "dept"):
        v = lt_val(re.search(rf"^\s*{f}:\s*lt\(((?:[^()]|\([^()]*\))*)\),?\s*$", tbody, re.M).group(1)) if re.search(rf"^\s*{f}:\s*lt\(((?:[^()]|\([^()]*\))*)\),?\s*$", tbody, re.M) else None
        if v:
            e[f] = v
    # duties / keywords / results
    for f in ("duties", "keywords", "results"):
        m = re.search(rf"^\s*{f}:\s*\[(.*?)\],?\s*$", tbody, re.M | re.S)
        if m:
            raw = m.group(1)
            items = []
            for im in re.finditer(r"lt\(((?:[^()]|\([^()]*\))*)\)|'((?:[^'\\]|\\.)*)'", raw):
                if im.group(1) is not None:
                    items.append(lt_val(im.group(1)))
                elif im.group(2) is not None:
                    items.append(im.group(2))
            e[f] = items
    timeline.append(e)

# ---------------- skills.ts ----------------
sk = read("skills.ts")
skills = []
for sm in re.finditer(r"\{\s*id: '([^']+)',(.*?)\n  \},", sk, re.S):
    sid, sbody = sm.group(1), sm.group(2)
    e = {"id": sid}
    for f in ("index", "code", "state", "linkedFilter", "accent"):
        v = re.search(rf"^\s*{f}:\s*'([^']*)',?\s*$", sbody, re.M)
        if v:
            e[f] = v.group(1)
    m = re.search(r"nameZh:\s*lt\(((?:[^()]|\([^()]*\))*)\),", sbody)
    if m:
        e["nameZh"] = lt_val(m.group(1))
    m = re.search(r"summary:\s*lt\(((?:[^()]|\([^()]*\))*)\),", sbody)
    if m:
        e["summary"] = lt_val(m.group(1))
    m = re.search(r"nodes:\s*\[(.*?)\n    \],", sbody, re.S)
    if m:
        nodes = []
        for nm in re.finditer(r"\{\s*name:\s*lt\(((?:[^()]|\([^()]*\))*)\),\s*state:\s*'([^']*)'", m.group(1)):
            nodes.append({"name": lt_val(nm.group(1)), "state": nm.group(2)})
        e["nodes"] = nodes
    skills.append(e)

# 网页广告产品展示顺序（projectSubFilters.ad，去掉 all）
_sf = re.search(r"\n  ad:\s*\[(.*?)\],", projects_ts, re.S)
adProductOrder = (
    [x for x in re.findall(r"id:\s*'([^']+)'", _sf.group(1)) if x != "all"]
    if _sf
    else []
)

data = {
    "generatedAt": "2026-08-09",
    "profile": profile,
    "timeline": timeline,
    "skills": skills,
    "projects": projects,
    "adProductOrder": adProductOrder,
}

with open(os.path.join(OUT, "pdf-data.json"), "w", encoding="utf-8") as fh:
    json.dump(data, fh, ensure_ascii=False, indent=1)
print("projects:", [p["id"] for p in projects])
print("cases per project:", {p["id"]: [c["id"] for c in p["cases"]] for p in projects})
print("timeline entries:", [t["id"] for t in timeline])
print("skills:", [s["id"] for s in skills])
print("profile name:", profile.get("name"), profile.get("nameEn"))
print("OK ->", os.path.join(OUT, "pdf-data.json"))
