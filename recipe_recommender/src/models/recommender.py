"""
models/recommender.py
──────────────────────
Moteur de recommandation RecipeNLG — BM25 + Jaccard.

Stratégie :
  - Matching  → champ `ner` (ingrédients normalisés EN, sans quantités)
                BM25Okapi remplace le TF-IDF from scratch pour un meilleur ranking.
  - Affichage → champ `ingredients` + `steps` (traduits FR si translate=True)

Score = α × BM25_normalisé(fridge, recette_ner)
       + (1-α) × jaccard(fridge_tokens, recette_ner_tokens)

Installation :
  pip install rank-bm25
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

from rank_bm25 import BM25Okapi

from src.models.vectorizer import tokenize
from src.utils.schemas import RecipeResult, RecipeStep

logger = logging.getLogger(__name__)

ALPHA = 0.7   # poids BM25 vs jaccard (BM25 est plus fiable → poids plus élevé)


# ── helpers ────────────────────────────────────────────────────────────────

def jaccard_similarity(sa: set, sb: set) -> float:
    if not sa or not sb:
        return 0.0
    inter = len(sa & sb)
    union = len(sa | sb)
    return inter / union if union else 0.0


# ── recommender ────────────────────────────────────────────────────────────

class RecipeRecommender:
    def __init__(
        self,
        dataset_path: str = "data/recipes.json",
        translate: bool = False,
    ):
        self.dataset_path = Path(dataset_path)
        self.translate    = translate

        self._recipes: List[Dict[str, Any]] = []
        self._corpus_tokens: List[List[str]] = []
        self._recipe_token_sets: List[set] = []
        self._bm25: BM25Okapi | None = None
        self._fitted = False

        self._translator = None

    # ------------------------------------------------------------------
    # Traducteur (lazy)
    # ------------------------------------------------------------------

    def _get_translator(self):
        if self._translator is None:
            from src.models.translator import Translator
            self._translator = Translator()
        return self._translator

    # ------------------------------------------------------------------
    # Fit
    # ------------------------------------------------------------------

    def fit(self) -> "RecipeRecommender":
        logger.info(f"Chargement du dataset : {self.dataset_path}")
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            self._recipes = json.load(f)

        # Tokenisation du corpus NER (EN)
        self._corpus_tokens = []
        for recipe in self._recipes:
            ner_list = recipe.get("ner") or recipe.get("ingredients", [])
            tokens = []
            for item in ner_list:
                tokens.extend(tokenize(item))
            # BM25 requiert au moins un token par document
            self._corpus_tokens.append(tokens if tokens else ["_empty_"])

        self._recipe_token_sets = [set(t) for t in self._corpus_tokens]

        # Indexation BM25
        logger.info("Indexation BM25…")
        self._bm25 = BM25Okapi(self._corpus_tokens)

        self._fitted = True
        logger.info(
            f"Modèle prêt — {len(self._recipes)} recettes indexées (BM25)"
        )
        return self

    # ------------------------------------------------------------------
    # Recommend
    # ------------------------------------------------------------------

    def recommend(
        self,
        ingredients: List[str],
        top_n: int = 5,
        min_score: float = 0.1,
    ) -> List[RecipeResult]:
        if not self._fitted:
            raise RuntimeError("Appeler fit() avant recommend().")

        # Tokenisation des ingrédients du frigo
        fridge_tokens = []
        for ing in ingredients:
            fridge_tokens.extend(tokenize(ing))
        fridge_set = set(fridge_tokens)

        if not fridge_tokens:
            return []

        # ── Scoring BM25 ───────────────────────────────────────────────
        bm25_scores = self._bm25.get_scores(fridge_tokens)

        # Normalisation BM25 sur [0, 1]
        bm25_max = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        bm25_norm = [s / bm25_max for s in bm25_scores]

        # ── Score hybride BM25 + Jaccard ───────────────────────────────
        scored = []
        for i in range(len(self._recipes)):
            jac   = jaccard_similarity(fridge_set, self._recipe_token_sets[i])
            score = ALPHA * bm25_norm[i] + (1 - ALPHA) * jac
            if score >= min_score:
                scored.append((score, i))

        scored.sort(key=lambda x: x[0], reverse=True)
        scored = scored[:top_n]

        # ── Construction des résultats ─────────────────────────────────
        results = []
        for score, idx in scored:
            recipe = self._recipes[idx]

            all_ingredients_en = recipe.get("ingredients") or recipe.get("ner", [])
            steps_en           = recipe.get("steps", [])
            title_en           = recipe.get("title", "Untitled")

            matched_en = [
                ing for ing in all_ingredients_en
                if any(t in fridge_set for t in tokenize(ing))
            ]
            missing_en = [
                ing for ing in all_ingredients_en
                if ing not in matched_en
            ]

            # ── Traduction EN → FR (optionnelle) ──────────────────────
            if self.translate:
                tr = self._get_translator()
                title_fr           = tr.translate(title_en)
                all_ingredients_fr = tr.translate_batch(all_ingredients_en)
                matched_fr         = tr.translate_batch(matched_en)
                missing_fr         = tr.translate_batch(missing_en)
                steps_fr           = tr.translate_steps(steps_en)
            else:
                title_fr           = title_en
                all_ingredients_fr = all_ingredients_en
                matched_fr         = matched_en
                missing_fr         = missing_en
                steps_fr           = steps_en

            steps_out = [
                RecipeStep(step=j + 1, instruction=s)
                for j, s in enumerate(steps_fr)
            ]

            results.append(
                RecipeResult(
                    title               = title_fr,
                    score               = round(score, 4),
                    matched_ingredients = matched_fr,
                    missing_ingredients = missing_fr,
                    all_ingredients     = all_ingredients_fr,
                    steps               = steps_out,
                    total_time_minutes  = recipe.get("total_time_minutes"),
                    servings            = recipe.get("servings"),
                    category            = recipe.get("category"),
                )
            )

        return results

    # ------------------------------------------------------------------
    # Propriétés
    # ------------------------------------------------------------------

    @property
    def n_recipes(self) -> int:
        return len(self._recipes)

    @property
    def vocabulary(self) -> List[str]:
        """Tokens uniques dans le corpus NER."""
        vocab = set()
        for tokens in self._corpus_tokens:
            vocab.update(tokens)
        return sorted(vocab)