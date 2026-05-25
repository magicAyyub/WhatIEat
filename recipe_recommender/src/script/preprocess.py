"""
scripts/preprocess.py
──────────────────────
Parse le dataset RecipeNLG (CSV Kaggle) et produit data/recipes.json
avec ingrédients + étapes traduits EN → FR via MarianMT.

Dataset source :
  https://www.kaggle.com/datasets/saldenisov/recipenlg

Téléchargement :
  kaggle datasets download -d saldenisov/recipenlg
  unzip recipenlg.zip -d data/raw/

Colonnes du CSV :
  index, title, ingredients, directions, link, source, NER

Stratégie :
  - `NER`         → champ `ner`  dans le JSON (EN, sans quantités, pour le matching TF-IDF)
  - `ingredients` → traduit FR   → champ `ingredients` (avec quantités, pour l'affichage)
  - `directions`  → traduit FR   → champ `steps`
  - `title`       → traduit FR   → champ `title`

La traduction se fait UNE SEULE FOIS ici.
Le recommender n'a plus besoin de MarianMT au runtime.

Usage :
  # Sans traduction (rapide, données EN — pour dev)
  python scripts/preprocess.py --max 500 --no-translate

  # Avec traduction EN→FR (production)
  python scripts/preprocess.py --max 500

  # Tout le dataset
  python scripts/preprocess.py

  # Avec GPU
  python scripts/preprocess.py --max 5000 --device cuda

Installation :
  pip install pandas transformers sentencepiece torch sacremoses
"""

import argparse
import ast
import json
import logging
import re
import sys
import time
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

try:
    import pandas as pd
except ImportError:
    sys.exit("pandas requis : pip install pandas")

# ── Configuration ──────────────────────────────────────────────────────────
RAW_CSV         = Path("data/full_dataset.csv")
OUTPUT          = Path("data/recipes.json")
MIN_INGREDIENTS = 3
MIN_STEPS       = 1


# ── Parsing des champs liste ───────────────────────────────────────────────

def parse_list_field(raw) -> list[str]:
    """
    Parse un champ qui contient une liste Python sérialisée.
    Ex: "['1 cup flour', '2 eggs']" → ['1 cup flour', '2 eggs']
    """
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    if not isinstance(raw, str) or not raw.strip():
        return []
    try:
        parsed = ast.literal_eval(raw)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    items = re.split(r"[\n\r]+|,(?![^[]*\])", raw)
    return [x.strip().strip("'\"") for x in items if x.strip()]


# ── Traduction par batch ───────────────────────────────────────────────────

def translate_batch(translator, texts: list[str], desc: str) -> list[str]:
    """Traduit une liste de textes avec log de progression."""
    total   = len(texts)
    results = []
    bs      = translator.batch_size

    for start in range(0, total, bs):
        chunk      = texts[start : start + bs]
        translated = translator.translate(chunk)
        results.extend(translated if isinstance(translated, list) else [translated])
        logger.info(f"  {desc}: {min(start + bs, total)}/{total}")

    return results


# ── Construction du dataset sans traduction ────────────────────────────────

def build_dataset_no_translate(df: pd.DataFrame, output: Path) -> None:
    """Génère recipes.json en gardant les données en anglais (rapide)."""
    n = len(df)
    logger.info(f"Traitement de {n} recettes (sans traduction)…")

    recipes: list[dict] = []
    skipped = 0

    for _, row in df.iterrows():
        title       = str(row.get("title", "")).strip()
        ingredients = parse_list_field(row.get("ingredients", ""))
        steps       = parse_list_field(row.get("directions", ""))
        ner         = parse_list_field(row.get("NER", ""))

        if len(ingredients) < MIN_INGREDIENTS or len(steps) < MIN_STEPS:
            skipped += 1
            continue

        recipe: dict = {
            "title":       title,
            "ingredients": ingredients,
            "steps":       steps,
            "ner":         ner,          # EN — matching TF-IDF
        }

        source = str(row.get("source", "")).strip()
        if source:
            recipe["source"] = source

        recipes.append(recipe)

    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

    logger.info(f"\n✅  {len(recipes)} recettes sauvegardées → {output}")
    logger.info(f"   {skipped} recettes ignorées (trop peu d'ingrédients/étapes)")


# ── Construction du dataset avec traduction EN→FR ──────────────────────────

def build_dataset_with_translate(df: pd.DataFrame, translator, output: Path) -> None:
    """Génère recipes.json avec titre, ingrédients et étapes traduits en français."""
    n = len(df)
    logger.info(f"Traitement de {n} recettes (avec traduction EN→FR)…")

    titles_en:      list[str] = []
    ingredients_en: list[str] = []
    steps_en:       list[str] = []
    ing_offsets:    list[int] = []
    step_offsets:   list[int] = []
    rows_valid:     list[dict] = []
    skipped = 0

    for _, row in df.iterrows():
        title       = str(row.get("title", "")).strip()
        ingredients = parse_list_field(row.get("ingredients", ""))
        steps       = parse_list_field(row.get("directions", ""))
        ner         = parse_list_field(row.get("NER", ""))

        if len(ingredients) < MIN_INGREDIENTS or len(steps) < MIN_STEPS:
            skipped += 1
            continue

        rows_valid.append({
            "title":       title,
            "ingredients": ingredients,
            "steps":       steps,
            "ner":         ner,
            "source":      str(row.get("source", "")).strip(),
        })

        titles_en.append(title)

        ing_offsets.append(len(ingredients_en))
        ingredients_en.extend(ingredients)

        step_offsets.append(len(steps_en))
        steps_en.extend(steps)

    logger.info(f"  {len(rows_valid)} recettes valides ({skipped} ignorées)")
    logger.info(f"  {len(ingredients_en)} ingrédients à traduire")
    logger.info(f"  {len(steps_en)} étapes à traduire")

    logger.info("Étape 1/3 — Traduction des titres…")
    t0        = time.time()
    titles_fr = translate_batch(translator, titles_en, "titres")
    logger.info(f"  ✅ Titres traduits en {time.time() - t0:.0f}s")

    logger.info("Étape 2/3 — Traduction des ingrédients…")
    t0             = time.time()
    ingredients_fr = translate_batch(translator, ingredients_en, "ingrédients")
    logger.info(f"  ✅ Ingrédients traduits en {time.time() - t0:.0f}s")

    logger.info("Étape 3/3 — Traduction des étapes…")
    t0       = time.time()
    steps_fr = translate_batch(translator, steps_en, "étapes")
    logger.info(f"  ✅ Étapes traduites en {time.time() - t0:.0f}s")

    recipes: list[dict] = []

    for i, row in enumerate(rows_valid):
        start_ing = ing_offsets[i]
        end_ing   = ing_offsets[i + 1] if i + 1 < len(ing_offsets) else len(ingredients_fr)
        ings_fr   = [t for t in ingredients_fr[start_ing:end_ing] if t.strip()]

        start_stp = step_offsets[i]
        end_stp   = step_offsets[i + 1] if i + 1 < len(step_offsets) else len(steps_fr)
        stps_fr   = [t for t in steps_fr[start_stp:end_stp] if t.strip()]

        if not ings_fr or not stps_fr:
            continue

        recipe: dict = {
            "title":       titles_fr[i],   # FR — affiché
            "ingredients": ings_fr,        # FR — affiché
            "steps":       stps_fr,        # FR — affiché
            "ner":         row["ner"],      # EN — matching TF-IDF
        }

        if row["source"]:
            recipe["source"] = row["source"]

        recipes.append(recipe)

    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

    logger.info(f"\n✅  {len(recipes)} recettes sauvegardées → {output}")


# ── Point d'entrée ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Parse RecipeNLG (Kaggle) et traduit EN→FR."
    )
    parser.add_argument(
        "--csv", type=str, default=str(RAW_CSV),
        help=f"Chemin du CSV source (défaut: {RAW_CSV})"
    )
    parser.add_argument(
        "--output", type=str, default=str(OUTPUT),
        help=f"Chemin du JSON de sortie (défaut: {OUTPUT})"
    )
    parser.add_argument(
        "--max", type=int, default=None,
        help="Nombre max de recettes à traiter (défaut: tout le dataset)"
    )
    parser.add_argument(
        "--batch-size", type=int, default=32,
        help="Taille des batches de traduction (défaut: 32)"
    )
    parser.add_argument(
        "--no-translate", action="store_true",
        help="Désactive la traduction, garde les données en anglais (rapide)"
    )
    parser.add_argument(
        "--device", type=str, default="cpu",
        help="'cpu' ou 'cuda' (défaut: cpu)"
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        sys.exit(
            f"Fichier introuvable : {csv_path}\n"
            "Télécharge le dataset depuis :\n"
            "  https://www.kaggle.com/datasets/saldenisov/recipenlg\n"
            "  kaggle datasets download -d saldenisov/recipenlg\n"
            "  unzip recipenlg.zip -d data/raw/"
        )

    logger.info(f"Lecture de {csv_path}…")
    df = pd.read_csv(csv_path, encoding="utf-8")
    logger.info(f"  {len(df)} lignes brutes")

    df.columns = [c.strip() for c in df.columns]
    logger.info(f"  Colonnes : {list(df.columns)}")

    if args.max:
        df = df.head(args.max)
        logger.info(f"  Limité à {args.max} recettes")

    if args.no_translate:
        build_dataset_no_translate(df, Path(args.output))
    else:
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from src.models.translator import Translator

        translator = Translator(
            batch_size=args.batch_size,
            device=args.device,
        )
        build_dataset_with_translate(df, translator, Path(args.output))


if __name__ == "__main__":
    main()