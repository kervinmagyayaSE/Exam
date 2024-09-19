const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Recipe Schema
const recipeSchema = new mongoose.Schema({
  name: String,
  ingredients: [String],
  instructions: String,
});

const Recipe = mongoose.model('Recipe', recipeSchema);

// API Routes
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching recipes' });
  }
});


app.get('/api/recipes/random', async (req, res) => {
  try {
    const count = await Recipe.countDocuments();
    const random = Math.floor(Math.random() * count);
    const recipe = await Recipe.findOne().skip(random);
    if (!recipe) {
      return res.status(404).json({ error: 'No recipes found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching a random recipe' });
  }
});

// server.js

app.post('/api/recipes/filter', async (req, res) => {
  const { ingredients } = req.body;
  console.log('Received ingredients:', ingredients); // Debug log

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: 'No ingredients provided' });
  }
  
  try {
    const recipes = await Recipe.find({
      ingredients: { $in: ingredients }
    }).sort({ 
      ingredients: { $size: { $setIntersection: ["$ingredients", ingredients] } }
    }).limit(10);
    
    console.log('Filtered recipes:', recipes); // Debug log
    res.json(recipes);
  } catch (error) {
    console.error('Error filtering recipes:', error);
    res.status(500).json({ error: 'An error occurred while filtering recipes' });
  }
});

// Add a new recipe (for testing purposes)
app.post('/api/recipes', async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  
  if (!name || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const newRecipe = new Recipe({ name, ingredients, instructions });
    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the recipe' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));