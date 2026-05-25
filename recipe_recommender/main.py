"""
Recipe Recommendation Microservice — RecipeNLG + MarianMT
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from src.utils.schemas import IngredientsInput, RecipeRecommendationResponse
from src.models.recommender import RecipeRecommender

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

recommender: RecipeRecommender = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global recommender
    logger.info("Chargement du modèle de recommandation...")
    recommender = RecipeRecommender(
        dataset_path="data/recipes.json",
        translate=False,   # MarianMT chargé en lazy au 1er appel /recommend
    )
    recommender.fit()
    logger.info(f"Modèle prêt — {recommender.n_recipes} recettes indexées.")
    yield


app = FastAPI(
    title="WhatIEat — Recipe Service",
    description=(
        "Microservice de recommandation de recettes (RecipeNLG) "
        "avec traduction EN→FR via MarianMT."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "recipes_loaded": recommender.n_recipes if recommender else 0,
    }


@app.post("/recommend", response_model=RecipeRecommendationResponse)
def recommend_recipes(payload: IngredientsInput):
    """
    Reçoit les ingrédients détectés par fridge_detector (EN)
    et retourne les N meilleures recettes traduites en français.

    Formats acceptés :
      {"fridge_dict": {"egg": 4, "tomato": 3}}
      {"ingredients": ["egg", "tomato"]}
    """
    if not recommender:
        raise HTTPException(status_code=503, detail="Modèle non chargé.")

    results = recommender.recommend(
        ingredients=payload.ingredients,
        top_n=payload.top_n,
        min_score=payload.min_score,
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="Aucune recette trouvée pour ces ingrédients.",
        )

    return RecipeRecommendationResponse(
        query_ingredients=payload.ingredients,
        recipes=results,
    )


@app.get("/vocabulary")
def vocabulary():
    """Retourne les tokens connus du modèle (ingrédients NER indexés)."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Modèle non chargé.")
    return {"size": len(recommender.vocabulary), "tokens": sorted(recommender.vocabulary)}