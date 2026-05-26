import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are the official AI Guide for KumbhAarambh — the Nashik Simhastha Kumbh Mela companion app.

Your role:
- Answer questions about the Nashik-Trimbakeshwar Simhastha Kumbh Mela
- Provide information about bathing dates (Shahi Snan), ghat safety, transit routes, food, stays, and local temples
- Share history about Ram Kund, Trimbakeshwar Shiva Temple, Kalaram Temple, Panchavati, and the Godavari river
- Give practical travel advice for pilgrims visiting Nashik
- Help with emergency information (police helpline: 100, ambulance: 108, women helpline: 1091)

Key facts about Nashik Simhastha:
- Held every 12 years at Nashik-Trimbakeshwar on the banks of River Godavari
- Key bathing ghats: Ram Kund, Talkuteshwar Ghat, Lakshman Kund
- Main temples: Trimbakeshwar Shiva Temple (Jyotirlinga), Kalaram Temple, Kapaleshwar Temple
- Panchavati area is where Lord Rama stayed during exile
- Key transit points: Nashik Railway Station, CBS Bus Stand

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
  { name: "Ram Kund (Main Ghat)", lat: 20.0092, lng: 73.7915, type: "Ghat" },
  { name: "Talkuteshwar Ghat", lat: 20.0158, lng: 73.7995, type: "Ghat" },
  { name: "Lakshman Kund", lat: 20.0078, lng: 73.7885, type: "Ghat" },
  { name: "Kushavarta Kund", lat: 19.9324, lng: 73.5303, type: "Ghat" },
  { name: "Ahilya Godavari Sangam Ghat", lat: 20.0069, lng: 73.7850, type: "Ghat" },
  { name: "Someshwar Ghat", lat: 19.9855, lng: 73.7310, type: "Ghat" }
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

    let locationContext = "";
    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
      const userLat = location.lat;
      const userLng = location.lng;

      const staysWithDist = BACKEND_STAYS.map((s) => ({
        ...s,
        dist: getDistance(userLat, userLng, s.lat, s.lng),
      })).sort((a, b) => a.dist - b.dist);

      const foodWithDist = BACKEND_FOOD.map((f) => ({
        ...f,
        dist: getDistance(userLat, userLng, f.lat, f.lng),
      })).sort((a, b) => a.dist - b.dist);

      const ghatsWithDist = BACKEND_GHATS.map((g) => ({
        ...g,
        dist: getDistance(userLat, userLng, g.lat, g.lng),
      })).sort((a, b) => a.dist - b.dist);

      locationContext = `\n\n[USER LOCATION CONTEXT]\nUser live coordinates: Latitude ${userLat.toFixed(4)}, Longitude ${userLng.toFixed(4)}.\nNearest Stays (Local Dataset):\n1. ${staysWithDist[0].name} - ${staysWithDist[0].dist.toFixed(2)} km away.\n2. ${staysWithDist[1].name} - ${staysWithDist[1].dist.toFixed(2)} km away.\n\nNearest Food Spots (Local Dataset):\n1. ${foodWithDist[0].name} - ${foodWithDist[0].dist.toFixed(2)} km away.\n2. ${foodWithDist[1].name} - ${foodWithDist[1].dist.toFixed(2)} km away.\n\nNearest Ghats (Local Dataset):\n1. ${ghatsWithDist[0].name} - ${ghatsWithDist[0].dist.toFixed(2)} km away.\n\nPlease suggest these nearby options contextually, BUT DO NOT STOP HERE. Execute the [INTERNET MAP RETRIEVAL DIRECTIVE] and combine these with additional real locations from your internal web knowledge base. Advise them on transit options if needed.`;
    }

    const activeSystemPrompt = SYSTEM_PROMPT + locationContext;

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

    // 3. Fallback to offline rule-based matches
    return NextResponse.json({ reply: getOfflineReply(message) });

  } catch (error: any) {
    console.error("Chat API handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}
