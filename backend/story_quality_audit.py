"""
PAUSE — Audit qualitativo di ogni storia del catalogo.

Legge OGNI capitolo di OGNI storia e, con un LLM che recita due ruoli
(utente medio annoiato + editor esigente), assegna a ciascuna storia:
  - engagement 1-10 (quanto cattura un utente medio)
  - quality 1-10 (accuratezza, scrittura, originalita, "non cheap")
  - verdict: keep | revise | cut
  - hook_ok: se l'aggancio iniziale invoglia a leggere
  - reason: motivo in una frase (italiano)

Produce:
  /app/backend/audit_out/story_quality.json   (dati grezzi per storia)
  /app/backend/audit_out/story_quality.md     (report leggibile in italiano)
"""
import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
sys.path.insert(0, str(Path(__file__).parent))
from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402

MODEL = ("openai", "gpt-5.4")
OUT = Path(__file__).parent / "audit_out"
OUT.mkdir(exist_ok=True)

SYSTEM = (
    "Sei un doppio valutatore per PAUSE, un'app premium di micro-apprendimento in italiano "
    "che sostituisce lo scrolling con brevi spiegazioni affascinanti. "
    "Valuti ogni storia con DUE sguardi severi contemporaneamente: "
    "(1) un UTENTE MEDIO che si annoia facilmente e scrolla via se non viene catturato nei primi secondi; "
    "(2) un EDITOR ESIGENTE che odia i contenuti banali, ovvi, scolastici, imprecisi o 'da riempitivo' "
    "che farebbero sembrare l'app cheap. "
    "Sei spietato ma giusto: una storia merita voti alti SOLO se contiene una vera curiosita', "
    "un fatto sorprendente o un 'wow' che un adulto curioso racconterebbe agli amici. "
    "Rispondi SEMPRE ed ESCLUSIVAMENTE con JSON valido, senza markdown, senza commenti."
)

INSTRUCTION = (
    "Valuta le seguenti storie. Per CIASCUNA leggi titolo, hook e TUTTI i capitoli. "
    "Restituisci un array JSON 'results'; ogni elemento con ESATTAMENTE queste chiavi:\n"
    '  "id": string (l\'id fornito),\n'
    '  "engagement": intero 1-10 (quanto cattura un utente medio annoiato),\n'
    '  "quality": intero 1-10 (accuratezza+scrittura+originalita, 1=cheap/banale, 10=eccellente),\n'
    '  "wow": true/false (contiene almeno un fatto sorprendente/memorabile),\n'
    '  "hook_ok": true/false (l\'hook iniziale invoglia davvero a leggere),\n'
    '  "verdict": "keep" | "revise" | "cut",\n'
    '  "reason": stringa breve in ITALIANO (max 18 parole, concreta, niente frasi vuote).\n'
    "Criterio verdetto: cut se banale/ovvia/scolastica/imprecisa o senza wow (farebbe sembrare l'app cheap); "
    "revise se l'idea e' buona ma scrittura/hook deboli o fatto poco sorprendente; "
    "keep solo se davvero interessante e ben scritta. Sii severo: non regalare 'keep'.\n"
    'Formato: {"results": [ {...}, {...} ]}\n\n'
)


def parse_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
    start, end = raw.find("{"), raw.rfind("}")
    return json.loads(raw[start:end + 1])


def story_payload(s: dict) -> dict:
    return {
        "id": s["id"],
        "categoria": s.get("category_name", ""),
        "tipo": "lezione" if s.get("kind") == "lesson" else "curiosita",
        "titolo": s.get("title", ""),
        "hook": s.get("hook", ""),
        "capitoli": [
            {"t": c.get("title", ""), "testo": c.get("body", "")}
            for c in s.get("chapters", [])
        ],
    }


async def eval_batch(batch, idx, sem):
    prompt = INSTRUCTION + json.dumps(
        {"storie": [story_payload(s) for s in batch]}, ensure_ascii=False
    )
    async with sem:
        for attempt in range(4):
            try:
                chat = LlmChat(
                    api_key=os.environ["EMERGENT_LLM_KEY"],
                    session_id=f"audit-{idx}-{attempt}",
                    system_message=SYSTEM,
                )
                chat.with_model(*MODEL)
                raw = await chat.send_message(UserMessage(text=prompt))
                data = parse_json(raw)
                res = data.get("results", [])
                print(f"batch {idx}: {len(res)}/{len(batch)} ok", flush=True)
                return res
            except Exception as e:  # noqa: BLE001
                print(f"batch {idx} attempt {attempt} err: {e}", flush=True)
                await asyncio.sleep(3 + attempt * 4)
        return [{"id": s["id"], "error": True} for s in batch]


async def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    batch_size = 6
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    cur = db.stories.find({}, {"_id": 0})
    stories = await cur.to_list(length=None)
    stories.sort(key=lambda s: (s.get("category_id", ""), s.get("kind", ""), s.get("id", "")))
    if limit:
        stories = stories[:limit]
    print(f"Totale storie da valutare: {len(stories)}", flush=True)

    batches = [stories[i:i + batch_size] for i in range(0, len(stories), batch_size)]
    sem = asyncio.Semaphore(5)
    tasks = [eval_batch(b, i, sem) for i, b in enumerate(batches)]
    all_res = []
    for coro in asyncio.as_completed(tasks):
        all_res.extend(await coro)

    by_id = {s["id"]: s for s in stories}
    merged = []
    for r in all_res:
        s = by_id.get(r.get("id"))
        if not s:
            continue
        merged.append({
            "id": r["id"],
            "titolo": s.get("title", ""),
            "categoria": s.get("category_name", ""),
            "categoria_id": s.get("category_id", ""),
            "tipo": "lezione" if s.get("kind") == "lesson" else "curiosita",
            "engagement": r.get("engagement"),
            "quality": r.get("quality"),
            "wow": r.get("wow"),
            "hook_ok": r.get("hook_ok"),
            "verdict": r.get("verdict", "error" if r.get("error") else "?"),
            "reason": r.get("reason", ""),
        })
    (OUT / "story_quality.json").write_text(
        json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Valutate: {len(merged)} storie -> {OUT/'story_quality.json'}", flush=True)
    # quick stats
    from collections import Counter
    vc = Counter(m["verdict"] for m in merged)
    print("Verdetti:", dict(vc), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
