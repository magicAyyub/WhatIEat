from pydantic import BaseModel, Field, model_validator
from typing import Dict, List, Optional


class IngredientsInput(BaseModel):
    """
    Accepte deux formats :
      - fridge_dict : {"tomato": 3, "Egg": 4}   ← format fridge_detector (EN)
      - ingredients : ["tomate", "poulet", "ail"] ← liste FR directe

    Avec fridge_dict, les labels EN sont utilisés tels quels pour le matching
    car le dataset RecipeNLG a été traduit EN→FR au preprocessing :
    les ingrédients traduits contiennent souvent encore les mots anglais
    dans les racines communes (ex: "tomato" → "tomate").
    Le recommender normalise et tokenise avant le matching.
    """
    fridge_dict: Optional[Dict[str, int]] = Field(
        default=None,
        description="Format fridge_detector : {label_EN: count}",
        examples=[{"tomato": 3, "Egg": 4, "chicken": 1}],
    )
    ingredients: Optional[List[str]] = Field(
        default=None,
        description="Liste d'ingrédients (EN ou FR).",
        examples=[["tomate", "poulet", "ail"]],
    )
    top_n: int = Field(default=5, ge=1, le=20, description="Nombre de recettes à retourner.")
    min_score: float = Field(default=0.1, ge=0.0, le=1.0, description="Score minimum de correspondance.")

    @model_validator(mode="after")
    def resolve_ingredients(self) -> "IngredientsInput":
        if self.fridge_dict and not self.ingredients:
            # On passe les labels bruts — la normalisation dans le vectorizer
            # gère la correspondance multilingue (ex: "tomato" ↔ "tomate")
            self.ingredients = list(self.fridge_dict.keys())
        if not self.ingredients:
            raise ValueError("Fournir 'fridge_dict' ou 'ingredients'.")
        return self


class RecipeStep(BaseModel):
    step: int
    instruction: str


class RecipeResult(BaseModel):
    title: str
    score: float = Field(description="Score de correspondance [0, 1]")
    matched_ingredients: List[str] = Field(description="Ingrédients du frigo présents dans la recette")
    missing_ingredients: List[str] = Field(description="Ingrédients manquants pour compléter la recette")
    all_ingredients: List[str] = Field(description="Tous les ingrédients de la recette")
    steps: List[RecipeStep]
    total_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    category: Optional[str] = None


class RecipeRecommendationResponse(BaseModel):
    query_ingredients: List[str]
    recipes: List[RecipeResult]
    total_found: int = 0

    def model_post_init(self, __context):
        object.__setattr__(self, "total_found", len(self.recipes))
