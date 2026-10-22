# Phyt Brain: Disease AI Agent and Custom ERP Program

Phyt Brain is a working prototype of an AI assistant for farmers, agronomists and agricultural supply stores in Greece. It answers questions in Greek like an experienced agronomist, diagnoses plant problems from photos, turns voice notes and photos of handwritten orders into structured orders, and runs the day to day business of a supply store (clients, products, orders, staff) in one web app.

I built it to solve problems I saw first hand working in an agricultural supply store and in a subsidy (OSDE) office: farmers ask the same questions every day, orders arrive by phone and on paper, and product advice depends on who is behind the counter.

**Status:** prototype, not deployed. Built with Firebase Studio, Next.js and Google Gemini through Genkit.

## What it does

| Module | What the user gets | How it works |
|---|---|---|
| AgroAssist chat (`ask-agro-greek-flow`) | Agronomic advice in Greek, product recommendations with cost per stremma, weather aware answers | Long Greek system prompt with explicit rules, product catalog in context, conversation history, two tools (weather, image generation) |
| Disease diagnosis from a photo (`examine-product-flow`) | Identifies the likely problem on a leaf, fruit or product and suggests the right product category | Multimodal prompt (image plus optional user note), structured output with Zod |
| Order from voice (`extract-order-from-audio-flow`) | A spoken order becomes a list of products and quantities | Transcribe first, then extract fields into a schema |
| Order from photo (`extract-order-from-image-flow`) | A photo of a handwritten or printed order becomes a structured order | OCR plus extraction into a schema |
| Product recommendation (`product-recommendation-flow`) | Advice on a basket of selected products (compatibility, timing) | Greek prompt over the selected items |
| Smart crop planning (`smart-crop-planning`) | Analysis of a field picked on a map: soil, climate, suitable crops | Coordinates from a map selector into a structured prompt |
| Custom ERP screens | Clients, product catalog, orders, staff, roles and plans | Next.js pages on Firebase Auth and Firestore |

## Prompt engineering in this project

The interesting part for me is the prompt and agent design, not the UI.

- **One persona, strict output rules.** The assistant is "Phyt", an agronomist. The system prompt forces answers fully in Greek, grounded in the whole conversation, short and direct, with no technical placeholders leaking into the text.
- **Grounding on a catalog.** Recommendations must come from the product catalog passed in context (active substance, targets, pre harvest interval, dose, indicative price). The model is told how to handle a recommendation, a full list, a request for alternatives (never repeat the previous pick), a single product detail, and a comparison of a whole category (analyze each product, then give one comparative recommendation).
- **Calculations inside the prompt.** When a product has a price and a dose range, the model takes the mid dose, converts units and shows the cost per stremma right after the product name.
- **Diagnosis rules.** The prompt teaches the model to separate fungal from bacterial symptoms and to suggest the matching product category, so a bacterial problem does not get a fungicide.
- **Tool use with clear triggers.** The weather tool is called only when the question needs weather (planting, frost risk, spraying). The image tool is called only when the user asks to see something, with an English prompt written by the model for the image model. If the user shares no location, a second prompt variant without the weather tool is used.
- **Structured outputs.** Every flow has typed input and output schemas (Zod), so the UI receives fields, not free text.
- **Guardrails.** A fixed disclaimer is added whenever a product is recommended, and the flow cleans empty or malformed answers before they reach the user.

## Tech stack

Next.js (App Router, TypeScript), Tailwind CSS and shadcn/ui, Firebase Auth, Firestore and Storage, Google Gemini through Genkit (flows, prompts, tools), OpenWeather style weather API.

## Project structure

```
src/
  ai/
    flows/      Genkit flows: chat, diagnosis, voice and image orders, recommendations, crop planning
    tools/      weather tool and plant image generation tool
    data/       demo product catalog used as context
  actions/      server actions that call the flows
  app/          pages (chat, my business, orders, clients, products, settings, admin)
  components/   UI components
  config/       server side config (reads API keys from environment variables)
  firebase/     Firebase client setup (reads config from environment variables)
```

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your own Gemini key, weather key and Firebase project values.
3. `npm run dev` for the app, `npm run genkit:dev` for the Genkit developer UI.

No API keys or credentials are stored in this repository. All of them are read from environment variables.

## Notes

- The product catalog in `src/ai/data` is demo data put together from public product labels and websites (active substance, targets, dose, pre harvest interval). Prices are indicative, for testing the cost calculation only. Nothing here is spraying advice.
- This is a portfolio prototype. Code and design: Spyros Papastergiou. All rights reserved.

## About me

Economist and licensed tax accountant moving into data and AI roles. More projects: [phytai.com](https://phytai.com) and [github.com/papastergiousp-maker](https://github.com/papastergiousp-maker).
