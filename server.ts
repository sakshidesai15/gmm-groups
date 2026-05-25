import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_PROPERTIES } from "./src/data";
import { Property, Lead } from "./src/types";

// Seed server-side state in memory so CRUD persists during dev-session
let properties: Property[] = [...INITIAL_PROPERTIES];
let leads: Lead[] = [
  {
    id: "lead-1",
    name: "Aarav Sharma",
    email: "aarav.sharma@techcorp.com",
    phone: "+91 98860 12345",
    message: "Interested in the Aura Horizon Penthouse in Whitefield. Want to schedule a virtual video tour this weekend.",
    propertyTitle: "Aura Horizon Penthouse",
    timestamp: new Date(Date.now() - 4 * 3600000).toLocaleString(),
    status: "New"
  },
  {
    id: "lead-2",
    name: "Sanjana Reddy",
    email: "sanjana.reddy@investments.in",
    phone: "+91 99000 54321",
    message: "Requested pre-approval valuation and land registration verification details for GMM Lumina Sky Mansion.",
    propertyTitle: "GMM Lumina Sky Mansion",
    timestamp: new Date(Date.now() - 12 * 3600000).toLocaleString(),
    status: "Contacted"
  }
];

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini API client to prevent startup failure if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      console.warn("GEMINI_API_KEY environment variable is not configured. Falling back to rule-based smart concierge model.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'gmm-groups-app',
        }
      }
    });
  }
  return aiClient;
}

// REST API - Properties
app.get("/api/properties", (req, res) => {
  res.json(properties);
});

app.post("/api/properties", (req, res) => {
  const newPropObject = req.body as Property;
  if (!newPropObject.id) {
    newPropObject.id = `prop-${Date.now()}`;
  }
  properties.unshift(newPropObject);
  res.status(201).json(newPropObject);
});

app.put("/api/properties/:id", (req, res) => {
  const { id } = req.params;
  const index = properties.findIndex(p => p.id === id);
  if (index !== -1) {
    properties[index] = { ...properties[index], ...req.body };
    res.json(properties[index]);
  } else {
    res.status(404).json({ error: "Property not found" });
  }
});

app.delete("/api/properties/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = properties.length;
  properties = properties.filter(p => p.id !== id);
  if (properties.length < initialLength) {
    res.json({ success: true, id });
  } else {
    res.status(404).json({ error: "Property not found" });
  }
});

// REST API - Leads
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.post("/api/leads", (req, res) => {
  const { name, email, phone, message, propertyTitle } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    name,
    email,
    phone: phone || "+91 Contact Pending",
    message: message || "Requested a callback for luxury listings.",
    propertyTitle: propertyTitle || "General Brokerage Client",
    timestamp: new Date().toLocaleString(),
    status: "New"
  };
  leads.unshift(newLead);
  res.status(201).json(newLead);
});

// AI Chatbot with property grounding and context
app.post("/api/chat", async (req, res) => {
  const { messages, userProfile } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid dynamic message payload" });
  }

  const latestMessage = messages[messages.length - 1]?.text || "Hello";

  // Check if we have standard Gemini client
  const ai = getGeminiClient();
  if (!ai) {
    // Elegant simulation fallback for zero API key configured
    // This allows testing the AI Advisor gracefully in any mock/preview deployment!
    setTimeout(() => {
      let matchedProps: Property[] = [];
      const textLower = latestMessage.toLowerCase();
      
      // Look for custom matches in active inventory
      if (textLower.includes("bangalore") || textLower.includes("karnataka")) {
        matchedProps = properties.filter(p => p.state === "Karnataka" || p.city.toLowerCase().includes("bangalore"));
      } else if (textLower.includes("hyderabad") || textLower.includes("telangana") || textLower.includes("jubilee") || textLower.includes("gachibowli")) {
        matchedProps = properties.filter(p => p.state === "Telangana" || p.city.toLowerCase().includes("hyderabad"));
      } else if (textLower.includes("vizag") || textLower.includes("ap") || textLower.includes("andhra") || textLower.includes("plot")) {
        matchedProps = properties.filter(p => p.state === "AP" || p.type === "Plot");
      } else if (textLower.includes("villa") || textLower.includes("luxury house")) {
        matchedProps = properties.filter(p => p.type === "Villa");
      } else if (textLower.includes("commercial") || textLower.includes("office") || textLower.includes("hq")) {
        matchedProps = properties.filter(p => p.type === "Commercial");
      }

      let answer = `Greetings! I am GMM's Property Advisor. Based on your prompt, here are our executive insights.
      
We represent the most exceptional properties across India. ${matchedProps.length > 0 ? `I highly recommend looking at **${matchedProps[0].title}** located in *${matchedProps[0].location}* with an asking of *${matchedProps[0].price}*.` : "Our portfolio includes pristine villas in Jubilee Hills & Indiranagar, premium beachfront developmental lands in Vizag, and obsidian technical commercial hubs in Gachibowli."}

*Note: For absolute precision, please note that the live Gemini API key is not currently declared in your secrets panel. You can easily add ` + "`GEMINI_API_KEY`" + ` in your **Settings > Secrets** workspace to unlock full cognitive reasoning capabilities and dynamic grounding.*`;

      res.json({
        id: `msg-${Date.now()}`,
        role: "model",
        text: answer,
        timestamp: new Date().toLocaleTimeString(),
        suggestedProperties: matchedProps.slice(0, 2)
      });
    }, 1000);
    return;
  }

  try {
    // Format property catalog to insert as contextual grounding inside the system prompt
    const inventoryContext = properties.map((p, i) => `${i+1}. [${p.id}] ${p.title} - ${p.price}, located at ${p.location} (${p.city}, ${p.state}). Type: ${p.type}. Specs: ${p.beds} BHK baths: ${p.baths}. Area: ${p.sqft} sqft. Features: ${p.highlights.join(", ")}. Amenities: ${p.amenities.join(", ")}. RERA: ${p.rera ? "Yes" : "No"}. Category: ${p.category}. Description: ${p.description}`).join("\n\n");

    const systemInstruction = `You are "GMM Property Advisor", an elite, senior real estate investment advisor representing GMM Groups & Services (India). 
You cater to ultra-high-net-worth investors, family offices, tech founders, and premium home-buyers.
Your tone is highly professional, sophisticated, and analytical. You speak with extreme market competence.
You strictly answer queries based on our active GMM portfolio listed below.

Here is GMM's Active Premium Catalog:
${inventoryContext}

Rules:
1. Always recommend real properties from the active GMM catalog above when the customer expresses interest in buying, renting, plots, villas or commercial office spaces in India (Bangalore, Hyderabad, Andhra Pradesh).
2. Highlight specific metrics like location prominence (Whitefield tech corridors, Jubilee Hills hilltops), RERA safety stamps, and projected architectural assets.
3. Keep answers high-end, sophisticated, concise and formatting elegant using clean markdown with bold points.
4. If the user asks general questions about Indian real estate, answer them using your knowledge but anchor them back to our stellar GMM advisory practices.`;

    // Construct history for generateContent
    const queryResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Hello, what properties do you have?` }] },
        { role: "model", parts: [{ text: `Welcome to GMM Groups & Services. I am your Property Advisor. We manage an ultra-premium portfolio of RERA-cleared luxury villas, architectural penthouses, beachfront plots, and commercial headquarters in Bangalore, Hyderabad, and Andhra Pradesh. How may I assist your structural investment goals today?` }] },
        ...messages.map((m: any) => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const botAnswerText = queryResponse.text || "I apologize, custom network constraints prevented a response. How can I guide you regarding our Jubilee Hills or Whitefield assets?";

    // Post-process the response to find which properties from our list we should recommend as structured floating visual cards
    let suggestedProperties: Property[] = [];
    const answerLower = botAnswerText.toLowerCase();
    properties.forEach(p => {
      // Check if property title, location or id is mentioned in the bot response
      if (
        answerLower.includes(p.title.toLowerCase()) || 
        answerLower.includes(p.id.toLowerCase()) ||
        (answerLower.includes(p.location.toLowerCase()) && suggestedProperties.length < 2)
      ) {
        suggestedProperties.push(p);
      }
    });

    // Fallback if no specific mentioned but user requested a city/type
    if (suggestedProperties.length === 0) {
      if (answerLower.includes("bangalore") || answerLower.includes("karnataka")) {
        suggestedProperties = properties.filter(p => p.state === "Karnataka").slice(0, 2);
      } else if (answerLower.includes("hyderabad") || answerLower.includes("telangana")) {
        suggestedProperties = properties.filter(p => p.state === "Telangana").slice(0, 2);
      } else if (answerLower.includes("villa")) {
        suggestedProperties = properties.filter(p => p.type === "Villa").slice(0, 2);
      }
    }

    res.json({
      id: `msg-${Date.now()}`,
      role: "model",
      text: botAnswerText,
      timestamp: new Date().toLocaleTimeString(),
      suggestedProperties: suggestedProperties.slice(0, 2)
    });

  } catch (error: any) {
    console.error("Gemini chatbot error:", error);
    res.status(500).json({ error: "Cognitive services are momentarily busy. Please try your advisory prompt again." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning-fast development serving
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GMM Server] Booted successfully. Running on http://localhost:${PORT}`);
  });
}

startServer();
