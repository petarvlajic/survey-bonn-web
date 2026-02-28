# Alignment: uk-bonn-survey-web ↔ API ↔ uk-bonn-survey (mobile)

Sve je usklađeno između web aplikacije, API-ja i mobilne aplikacije.

## Base URL

| Projekt        | URL |
|----------------|-----|
| **API**        | `https://survey-api.herz-check-bonn.de/api` (produkcija) |
| **Web**        | `process.env.NEXT_PUBLIC_API_BASE_URL` ili isti URL kao gore |
| **Mobile**     | `https://survey-api.herz-check-bonn.de/api` (iz `src/config/api.ts`) |

---

## API response formati (uk-bonn-survey-api)

| Endpoint | API vraća | Web normalizacija |
|----------|-----------|-------------------|
| `GET /surveys` | `{ surveys: Survey[] }` | `use-survey.ts` → `normalizeSurveysList(raw)` → uvek niz |
| `GET /surveys/:id` | `{ survey: Survey }` | `normalizeSurvey(raw)` → `raw.survey` ili `raw.data` |
| `GET /responses` | `{ responses, total, page, limit }` | `use-responses.ts` → `normalizeResponsesList` + total/page/limit |
| `GET /responses/:id` | `{ response: Response }` | `normalizeResponse(raw)` → `raw.response` ili `raw.data` |
| `GET /responses/export/csv` | CSV blob | `responsesAPI.exportCSV(filters)` |
| `GET /responses/:id/export/pdf` | PDF blob | `responsesAPI.exportPDF(id)` |

---

## Query parametri (responses)

| Parametar | API očekuje | Web šalje |
|-----------|-------------|------------|
| Status | `draft` (boolean) | `status: "draft" \| "completed"` → mapirano u `draft` u `lib/api/responses.ts` |
| Datum | `completedAtFrom`, `completedAtTo` | ✓ |
| Paginacija | `page`, `limit` | ✓ (default limit 50) |
| Sort | `sortBy`, `sortOrder` | ✓ (`createdAt` \| `completedAt`, `asc` \| `desc`) |

---

## Mobilna app (uk-bonn-survey)

- Isti API base URL i isti response formati.
- `useSurveys` i `useResponses` rade istu normalizaciju (`surveys`, `data`, `responses`, `items`).
- Web koristi istu logiku u `lib/hooks/use-survey.ts` i `lib/hooks/use-responses.ts`.

Ako API promeni format, ažuriraj normalizaciju u ovim hook-ovima i u mobilnoj app.
