import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";

const SYSTEM_PROMPT = `You are the official AI Guide for KumbhAarambh — the Nashik Simhastha Kumbh Mela companion app.

Your role:
- Answer questions about the Nashik-Trimbakeshwar Simhastha Kumbh Mela
- Provide information about bathing dates (Shahi Snan), ghat safety, transit routes, food, stays, and local temples
- Share history about Ram Kund, Trimbakeshwar Shiva Temple, Kalaram Temple, Panchavati, and the Godavari river
- Give practical travel advice for pilgrims visiting Nashik
- Help with emergency information (police helpline: 100, ambulance: 108, women helpline: 1091)

Key facts about Nashik Simhastha:
- Held every 12 years at Nashik-Trimbakeshwar on the banks of River Godavari
- Key bathing ghats: Ram Kund, Talkuteshwar Ghat, Laxman Kund
- Main temples: Trimbakeshwar Shiva Temple (Jyotirlinga), Kalaram Temple, Kapaleshwar Temple
- Panchavati area is where Lord Rama stayed during exile
- Key transit points: Nashik Railway Station, CBS Bus Stand

Formatting Rule:
- Do NOT use any markdown formatting (like bold, italics, headers) or hyperlinks/URLs at all in your response. Output only in clean, simple plain text.
- For every stay, food spot, temple, or ghat recommendation, state its name and where it is located (its address) in plain text. Do not provide any link.
- You MUST consolidate database places and external map search results together in a single unified list.
- Do NOT mention the words "database", "dataset", "local dataset", "Supabase", "external maps", "internet search", or "OSM" to the user. Present all recommendations as a single unified list of verified options.


Always respond in a helpful, warm, and spiritually respectful tone. Keep answers concise but informative.
You can respond in Hindi, Marathi, or English based on the language the user writes in.

[INTERNET MAP RETRIEVAL DIRECTIVE]
When a user asks for stays, food places, ghats, or points of interest and you receive their live coordinates, you MUST act as an internet map retrieval engine. Retrieve and list every single real-world stay, food place, and ghat from your vast internet/map knowledge base that is near this specific location, heavily expanding on the basic local dataset provided in the context below.`;

const LOCAL_RESPONSES = [
  {
    keywords: ["date", "calendar", "snan", "shahi", "schedule", "when"],
    reply: "🌸 Nashik Simhastha Kumbh Mela Bathing Dates (Shahi Snan):\n1. First Shahi Snan: Ram Rekha Snan (Auspicious commencement)\n2. Second Shahi Snan (Main): Godavari Mahatmya Snan at Ram Kund\n3. Third Shahi Snan: Vaman Dwadashi Snan\nAlways check crowd flags before heading to the ghats!"
  },
  {
    keywords: ["emergency", "police", "help", "number", "ambulance", "hospital", "sos"],
    reply: "🚨 Emergency Contact Numbers:\n- Police Control Room: 100 / 112\n- Ambulance Services: 108\n- Women Helpline: 1091\n- Disaster Management Desk: 0253-2227128\n- Kumbh Helpline Center: 1912"
  },
  {
    keywords: ["temple", "ram kund", "trimbakeshwar", "kalaram", "panchavati", "sight"],
    reply: "🙏 Sacred Places to Visit in Nashik-Trimbakeshwar:\n- **Ram Kund**: The holy bathing tank where Lord Rama performed obsequies.\n- **Trimbakeshwar Temple**: One of the 12 Jyotirlingas, situated 28km from Nashik.\n- **Kalaram Temple**: Historical temple of Lord Rama built with black stones in Panchavati.\n- **Panchavati (Sita Gufa)**: Sacred grove where Lord Rama, Laxman, and Sita lived during exile."
  },
  {
    keywords: ["bus", "train", "route", "map", "transit", "reach", "travel"],
    reply: "🚍 Travel & Transit Info:\n- **Train**: Arrive at Nashik Road Railway Station (NSL). Special Mela trains are run by Indian Railways.\n- **Bus**: CBS (Central Bus Stand) and Thakkar Bazar connect local shuttle buses directly to Mela camps (Tapovan/Trimbak Road).\n- **Shuttle**: Free green shuttle buses run frequently between major satellite parking lots and ghat entry points."
  },
  {
    keywords: ["food", "bhandara", "prasad", "eat"],
    reply: "🍛 Food Finder Guidelines:\n- Free Prasad/Meals are available 24/7 at the **Simhastha Seva Maha Bhandaras** located in Tapovan sectors.\n- For local delicacies like the authentic Nashik Misal Pav, check out popular spots on gangapur road or near College Road using our Food Finder tab."
  },
  {
    keywords: ["stay", "hotel", "ashram", "matha", "booking"],
    reply: "🏨 Accommodation Guide:\n- Budget-friendly ashrams and pilgrim mathas are located along the Godavari banks in Panchavati.\n- Use the Stay Finder in the app to locate verified rooms or register your spot under Explore mode."
  }
];

const BACKEND_STAYS = [
  { name: "Kailas Matha Ashram & Gurukul", lat: 20.0080, lng: 73.7890, price: "₹100 / night (Donation)", type: "Matha", address: "Panchavati River Road, Ramghat" },
  { name: "Hotel Panchvati Yatri", lat: 19.9982, lng: 73.7845, price: "₹650 / night", type: "Guest House", address: "Panchavati Karanja, Main Road" },
  { name: "Trimbakeshwar Yatrik Niwas", lat: 19.9310, lng: 73.5290, price: "Free / Donation", type: "Matha", address: "Trimbakeshwar Shiva Campus" },
  { name: "Ginger Hotel Nashik", lat: 20.0195, lng: 73.7655, price: "₹1,200 / night", type: "Hotel", address: "Trimbak Road" },
  { name: "MTDC Resort Grape Park", lat: 19.9950, lng: 73.7050, price: "₹1,800 / night", type: "Resort", address: "Near Gangapur Dam" },
  { name: "Gajanan Maharaj Sansthan", lat: 19.9350, lng: 73.5350, price: "Free", type: "Matha", address: "Trimbakeshwar" },
  { name: "Swami Samarth Kendra", lat: 20.0500, lng: 73.8000, price: "₹200 / night", type: "Matha", address: "Dindori Road" },
  { name: "Ibis Nashik", lat: 19.9800, lng: 73.7650, price: "₹2,500 / night", type: "Hotel", address: "Trimbakeshwar Road" }
];

const BACKEND_FOOD = [
  { name: "Simhastha Seva Maha Bhandara", lat: 20.0152, lng: 73.7985, price: "Free (Prasad)", type: "Bhandara", specialty: "Pure Ghee Sheera & Khichdi" },
  { name: "Sadhana Restaurant", lat: 19.9990, lng: 73.7240, price: "₹120 / plate", type: "Restaurant", specialty: "Chulivarchi Misal Pav" },
  { name: "Panchavati Gaurav Pure Veg", lat: 20.0035, lng: 73.7780, price: "₹250 thali", type: "Restaurant", specialty: "Maharashtrian Thali" },
  { name: "Krishna Vijay Halwai", lat: 20.0102, lng: 73.7912, price: "₹60 / plate", type: "Sweets", specialty: "Saffron Jalebi" },
  { name: "Bapu Ki Misal", lat: 19.9650, lng: 73.8150, price: "₹100 / plate", type: "Restaurant", specialty: "Nashik Misal" },
  { name: "Vihar Restaurant", lat: 19.9900, lng: 73.7500, price: "₹180 / thali", type: "Restaurant", specialty: "Veg Thali" },
  { name: "Nandan Sweets", lat: 20.0100, lng: 73.7900, price: "₹50", type: "Sweets", specialty: "Pedhas" },
  { name: "Gajanan Maharaj Prasadalaya", lat: 19.9350, lng: 73.5350, price: "Free", type: "Bhandara", specialty: "Varan Bhaat" }
];

const BACKEND_GHATS = [
  { name: "Ram Kund (Main Ghat)", lat: 20.0087, lng: 73.7899, type: "Ghat", region: "Nashik" },
  { name: "Talkuteshwar Ghat", lat: 20.0014, lng: 73.7963, type: "Ghat", region: "Nashik" },
  { name: "Laxman Kund", lat: 20.0081, lng: 73.7893, type: "Ghat", region: "Nashik" },
  { name: "Kushavarta Kund", lat: 19.9327, lng: 73.5276, type: "Ghat", region: "Trimbakeshwar" },
  { name: "Ahilya Godavari Sangam Ghat", lat: 19.9323, lng: 73.5322, type: "Ghat", region: "Trimbakeshwar" },
  { name: "Someshwar Ghat", lat: 20.0231, lng: 73.7278, type: "Ghat", region: "Nashik" },
  { name: "Sita Kund", lat: 20.0079, lng: 73.7898, type: "Ghat", region: "Nashik" },
  { name: "Gautama Kund", lat: 19.9310, lng: 73.5303, type: "Ghat", region: "Trimbakeshwar" }
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getOfflineReply(message: string): string {
  const query = message.toLowerCase();
  for (const item of LOCAL_RESPONSES) {
    if (item.keywords.some(keyword => query.includes(keyword))) {
      return item.reply;
    }
  }
  return "Pranam! The live AI guide is currently offline. I can assist you with:\n1. Shahi Snan Dates\n2. Emergency Contacts & SOS\n3. Sacred Temples\n4. Transit & Shuttle routes\n5. Free Bhandaras & Stay zones.\n\nPlease ask me a question about any of these!";
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, location } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    // Fetch stays, food spots, and ghats in real-time from Supabase database
    const [staysRes, foodRes, ghatsRes] = await Promise.all([
      supabase.from("stays").select("*"),
      supabase.from("food_spots").select("*"),
      supabase.from("ghats").select("*"),
    ]);

    const staysList = (staysRes.data || []).map((s: any) => ({
      name: s.title,
      lat: s.lat,
      lng: s.lng,
      price: s.price,
      type: s.category,
      address: s.address,
    }));

    const foodList = (foodRes.data || []).map((f: any) => ({
      name: f.name,
      lat: f.lat,
      lng: f.lng,
      price: f.price,
      type: f.category,
      specialty: f.specialty,
    }));

    const ghatsList = (ghatsRes.data || []).map((g: any) => ({
      name: g.name,
      lat: g.lat,
      lng: g.lng,
      type: "Ghat",
      region: g.region,
    }));

    // Dynamic OpenStreetMap (Nominatim) search for real map places near user
    let osmStays: any[] = [];
    let osmFood: any[] = [];
    let queryLat = location?.lat;
    let queryLng = location?.lng;

    try {
      // If coordinates aren't shared, try to geocode search term if user mentions a place
      if (!queryLat || !queryLng) {
        const placeMatch = message.match(/(?:near|at|in)\s+([A-Za-z\s]+)(?:\?|\.|$)/i);
        if (placeMatch && placeMatch[1]) {
          const searchLoc = placeMatch[1].trim();
          const geocodeRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLoc + ", Nashik, Maharashtra, India")}&limit=1`,
            { headers: { "User-Agent": "KumbhAarambh-App" } }
          );
          if (geocodeRes.ok) {
            const geocodeData = await geocodeRes.json();
            if (geocodeData && geocodeData[0]) {
              queryLat = parseFloat(geocodeData[0].lat);
              queryLng = parseFloat(geocodeData[0].lon);
            }
          }
        }
      }

      // If location is available (either passed or geocoded)
      if (queryLat && queryLng) {
        const [osmStaysRes, osmFoodRes] = await Promise.all([
          fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=hotel&lat=${queryLat}&lon=${queryLng}&limit=15`,
            { headers: { "User-Agent": "KumbhAarambh-App" } }
          ),
          fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=restaurant&lat=${queryLat}&lon=${queryLng}&limit=15`,
            { headers: { "User-Agent": "KumbhAarambh-App" } }
          )
        ]);

        if (osmStaysRes.ok) {
          const data = await osmStaysRes.json();
          if (Array.isArray(data)) {
            osmStays = data.map((item: any) => ({
              name: item.name || item.display_name?.split(",")[0] || "Stay Place",
              address: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }));
          }
        }

        if (osmFoodRes.ok) {
          const data = await osmFoodRes.json();
          if (Array.isArray(data)) {
            osmFood = data.map((item: any) => ({
              name: item.name || item.display_name?.split(",")[0] || "Dining Place",
              address: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }));
          }
        }
      }
    } catch (e) {
      console.error("Nominatim dynamic search failed:", e);
    }

    // Construct the database context dynamically
    const databaseContext = `\n\n[VERIFIED PLACES DATABASE (SUPABASE)]
Here is the real-time list of verified Stays and Food Spots available in our database. Rely on these when answering questions about local recommendations:
Stays:
${staysList.map(s => `- ${s.name} (${s.type}, Price: ${s.price}) located at ${s.address} [Coords: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}]`).join("\n")}

Food Spots:
${foodList.map(f => `- ${f.name} (${f.type}, Specialty: ${f.specialty}, Price: ${f.price}) [Coords: ${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}]`).join("\n")}

Bathing Ghats:
${ghatsList.map(g => `- ${g.name} in ${g.region} [Coords: ${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}]`).join("\n")}
`;

    // Add external maps context
    const externalMapsContext = `\n\n[REAL-TIME EXTERNAL MAPS SEARCH RESULTS (OSM/NOMINATIM)]
These are real-world places fetched in real-time from open map directories near the user's location/target:
Stays (External Maps):
${osmStays.map(s => `- ${s.name} at ${s.address} [Coords: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}]`).join("\n")}

Food Spots (External Maps):
${osmFood.map(f => `- ${f.name} at ${f.address} [Coords: ${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}]`).join("\n")}
`;

    let locationContext = "";
    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
      const userLat = location.lat;
      const userLng = location.lng;

      const staysWithDist = staysList.map((s) => ({
        ...s,
        dist: getDistance(userLat, userLng, s.lat, s.lng),
      })).sort((a, b) => a.dist - b.dist);

      const foodWithDist = foodList.map((f) => ({
        ...f,
        dist: getDistance(userLat, userLng, f.lat, f.lng),
      })).sort((a, b) => a.dist - b.dist);

      const ghatsWithDist = ghatsList.map((g) => ({
        ...g,
        dist: getDistance(userLat, userLng, g.lat, g.lng),
      })).sort((a, b) => a.dist - b.dist);

      locationContext = `\n\n[USER LOCATION CONTEXT]\nUser live coordinates: Latitude ${userLat.toFixed(4)}, Longitude ${userLng.toFixed(4)}.\nNearest Stays (from database):\n${staysWithDist.slice(0, 3).map((s, idx) => `${idx+1}. ${s.name} - ${s.dist.toFixed(2)} km away.`).join("\n")}\n\nNearest Food Spots (from database):\n${foodWithDist.slice(0, 3).map((f, idx) => `${idx+1}. ${f.name} - ${f.dist.toFixed(2)} km away.`).join("\n")}\n\nNearest Ghats (from database):\n${ghatsWithDist.slice(0, 3).map((g, idx) => `${idx+1}. ${g.name} - ${g.dist.toFixed(2)} km away.`).join("\n")}\n\nPlease suggest these nearby options contextually, BUT DO NOT STOP HERE. Execute the [INTERNET MAP RETRIEVAL DIRECTIVE] and combine these with additional real locations from your internal web knowledge base. Advise them on transit options if needed.`;
    }

    const activeSystemPrompt = SYSTEM_PROMPT + databaseContext + externalMapsContext + locationContext;

    // Try Groq if key is present
    if (groqApiKey && !groqApiKey.includes("placeholder") && groqApiKey !== "") {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        
        const messages = [
          { role: "system", content: activeSystemPrompt },
          ...(history || []).map((msg: { sender: string; text: string }) => ({
            role: msg.sender === "ai" ? "assistant" : "user",
            content: msg.text
          })),
          { role: "user", content: message }
        ];

        const chatCompletion = await groq.chat.completions.create({
          messages,
          model: "llama-3.3-70b-versatile",
        });

        const reply = chatCompletion.choices[0]?.message?.content;
        if (reply) {
          return NextResponse.json({ reply });
        }
      } catch (groqError) {
        console.warn("Groq API call failed, falling back:", groqError);
      }
    }

    // Fallback to offline rule-based matches
    return NextResponse.json({ reply: getOfflineReply(message) });

  } catch (error: any) {
    console.error("Chat API handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}
