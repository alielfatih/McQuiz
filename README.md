# McQuiz

A free, static MCQ practice app. Pick a prebuilt set from a catalog, or paste or load your own. Runs entirely in the browser and is hosted on GitHub Pages. No server, no account, no build step.

## Features

- **Catalog of sets**, grouped by module, then optionally subject, then optionally topic, with a question count per set
- **One set at a time by default**, or tick several sets and combine them into one quiz
- **Paste / file tab** to use your own MCQs (`.txt` or `.json`)
- **Multiple catalogs**, including ones you add from the page
- **Instant feedback** after each answer, with optional explanations
- **Pause and resume**: progress autosaves in your browser
- **Options**: questions per page, shuffle options, shuffle questions
- **Light and dark themes** (auto, light or dark), tuned for comfortable reading

## Repo layout

```
index.html                     the app (edit once, rarely)
sets/index.json                the catalog (the file you edit to add sets)
sets/<module>/<subject>/*.txt  question sets
```

## Quick start

1. Create a repo named `McQuiz` and upload these files, keeping the folder structure.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. Open `https://<your-username>.github.io/McQuiz/`.

To test locally, run `python -m http.server` in the repo folder and open `http://localhost:8000`. Opening `index.html` directly from disk will not load the catalog, because browsers block `fetch` on `file://` pages.

## Adding a set

1. Add a `.txt` file in the MCQ format below, for example `sets/head-neck/anatomy/skull.txt`.
2. Add one entry to `sets/index.json`. You never need to edit `index.html`.

```json
{
  "name": "My MCQ library",
  "catalogs": [],
  "sets": [
    {
      "title": "Skull",
      "module": "Head & Neck",
      "subject": "Anatomy",
      "topic": "Skull",
      "file": "head-neck/anatomy/skull.txt",
      "count": 25
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Name shown in the list |
| `file` | yes | Path relative to the catalog, or a full URL |
| `module` | no | Top-level group (defaults to "General") |
| `subject` | no | Second-level group |
| `topic` | no | Third-level group |
| `count` | no | Shown immediately. If omitted, the page counts after loading |

## MCQ format

Plain text, with one blank line between questions.

```
Q: Foramen spinosum transmits which structure?
A) Mandibular nerve
B) Middle meningeal artery
C) Maxillary nerve
D) Internal carotid artery
Answer: B
Explanation: Optional, one line.
```

Rules:

1. Each question starts with `Q:` (`Q1.` and `1.` also work).
2. Options are labelled `A)` to `F)`, one per line, 2 to 6 options.
3. Exactly one `Answer:` line, a single letter that exists in the options.
4. `Explanation:` is optional and shown after answering.
5. No other text between questions.

JSON is also accepted:

```json
[{"q":"Question","options":["a","b","c","d"],"answer":"B","explanation":"optional"}]
```

`answer` can be a letter, a 0-based index, or the exact option text. Invalid questions are skipped and reported by number.

## Generating questions with AI

The **Paste / file** tab has a **Copy AI prompt** button. Paste that prompt into any AI assistant, fill in the count, topic and level, and paste the reply back into the page or save it as a `.txt` set.

## Multiple catalogs

- Reference other catalogs inside `sets/index.json` with `"catalogs": ["https://example.com/other.json"]`.
- Or add a catalog from the page under **Catalogs**. It is saved in that browser only.
- Or share a link ending in `?catalog=<catalog url>`.

Hosts must allow cross-site loading. `raw.githubusercontent.com` links work.

## Private or unlisted sets

A raw URL from a **private** repo will not load, and a GitHub Pages site is public. For sets you don't want in this repo:

- Host them in a **secret gist** and use its raw URL as `file`. Secret gists are unlisted, not private: anyone with the link can read them.
- Put those entries in a separate catalog (also a secret gist) and add it from the page, so the link isn't in your public repo.
- Or just use the **Paste / file** tab, which never uploads anything.

## Notes and limits

- Progress and saved catalogs are stored in your browser (`localStorage`). They don't sync between devices, and private browsing or clearing site data removes them.
- One paused quiz is kept at a time.
- Don't publish copyrighted or confidential question banks in a public repo.

## License

[MIT](LICENSE). This covers the app code. Question sets you add are your own responsibility and may be under different terms.
