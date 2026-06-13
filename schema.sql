-- Enable UUID extension for secure random IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ONBOARDING & PROFILE TABLE
CREATE TYPE sports_objective_type AS ENUM ('weight-loss', 'muscle-gain', 'maintenance');
CREATE TYPE activity_level_type AS ENUM ('sedentary', 'lightly-active', 'moderately-active', 'very-active');

CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL DEFAULT 'User',
    age INTEGER,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    sports_objective sports_objective_type DEFAULT 'maintenance',
    activity_level activity_level_type DEFAULT 'sedentary',
    calorie_target INTEGER DEFAULT 2000,
    dietary_restrictions TEXT[] DEFAULT '{}', -- E.g. ['gluten-free', 'vegan']
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FRIDGE INVENTORY TABLE
CREATE TABLE fridge_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- French display name (e.g. 'Poulet')
    category VARCHAR(100) NOT NULL, -- E.g. 'Protéines', 'Légumes'
    icon VARCHAR(100) NOT NULL, -- MaterialCommunityIcons name (e.g. 'food-drumstick')
    quantity VARCHAR(100) DEFAULT '1', -- E.g. '500g', '3 pièces'
    unit VARCHAR(50), -- E.g. 'g', 'count', 'level'
    expires_at DATE, -- Expiration date (YYYY-MM-DD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate ingredients for the same user (allows updating quantity instead of inserting)
    CONSTRAINT unique_user_ingredient UNIQUE(user_id, name)
);

-- 4. RECIPES TABLE
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(1024),
    calories INTEGER NOT NULL,
    protein_g INTEGER NOT NULL,
    carbs_g INTEGER NOT NULL,
    fat_g INTEGER NOT NULL,
    prep_time_minutes INTEGER NOT NULL,
    tags TEXT[] DEFAULT '{}', -- E.g. ['Sans gluten', 'Riche en protéines']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. RECIPE INGREDIENTS RELATION (For matching recipes to fridge stock)
CREATE TABLE recipe_ingredients (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Match name (e.g. 'poulet', 'tomate')
    quantity VARCHAR(100), -- E.g. '200g'
    PRIMARY KEY (recipe_id, name)
);

-- 6. USER FAVORITE RECIPES (Optional but very useful)
CREATE TABLE user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id)
);
