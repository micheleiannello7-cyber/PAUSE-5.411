# PAUSE — PRD

## Problema originale
App premium di micro-apprendimento (curiosità + lezioni) in IT/EN. Importata da GitHub (PAUSE-5.40). Richiesta: rendere la preview completa + audit qualitativo di ogni storia.

## Stato (2026-06)
- Import completo del repo; backend + frontend attivi.
- EMERGENT_LLM_KEY in backend/.env; Universal Key a budget 0 → covers/TTS/scoring LLM in pausa finché non si ricarica.
- 12 categorie, 493 storie caricate. API /api/ e /api/categories OK.

## Audit qualità storie (lettura manuale integrale, tutte le 493)
Verdetto: qualità ALTA e coerente; la maggioranza ha un vero "wow", non sembra cheap.
Rischio principale "cheap" = DUPLICATI/sovrapposizioni, non singole storie deboli.

### Duplicati da consolidare
- Atomo: v4-lez-atomo vs chemistry-basics
- Ghiaccio galleggia: lez-ghiaccio-galleggia vs v4-ghiaccio-galleggia
- Interesse composto: lez-interesse-composto vs eco-compound-interest
- Inflazione: lez-inflazione vs eco-inflation
- Domanda/offerta: v4-lez-domanda-offerta vs eco-supply-demand
- Fotosintesi: v4-lez-fotosintesi vs photosynthesis-basics
- Tempo che vola: cur-why-time-flies vs why-time-flies
- GPS: how-gps-works vs v4-gps
- Fusi orari: lez-fusi-orari vs geo-why-timezones vs v7-fusi-orari-strani
- Internet/cavi: how-internet-works vs v4-cavi-sottomarini
- Memoria: lez-memoria-tecniche vs memory-basics
- Brividi musica: v5-brividi-musica vs arte-music-emotion

### Storie "soft"/generiche da rinforzare o tagliare
- geo-why-travel; alcune "Perché X ci affascina/cambia" col tono blog.

## Backlog
- P1: Ricaricare Universal Key → copertine mancanti + TTS + scoring automatico.
- P1: Consolidare duplicati (tenere la migliore per tipo).
- P2: Scoring LLM multi-agente (script pronto: backend/story_quality_audit.py).

## UI — badge 3 icone (fatto, 2026-06)
- `src/components/story-info-grid.tsx` ridisegnato a tre pill individuali uniformi
  (fondo scuro traslucido + bordo luminoso). Pill 1 = icona tipo, pill 2 = icona
  categoria (solo icone, nessun testo), pill 3 = orologio + tempo lettura.
  Icone originali invariate. Usato in home card (embedded), lettore (inline) e morph.
