// scripts/seed.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

// This is the data directly copied from your lib/data/products.dart,
// but simplified to just the objects.
// ENSURE this matches your Flutter Product model structure exactly.
const productsData = [
  {
    id: 1,
    name: "Roasted Flax Seeds - Javsashtak",
    image: "https://i.postimg.cc/ZK27vqLk/Chat-GPT-Image-Jun-2-2025-01-26-48-PM.avif",
    images: [
      "https://i.postimg.cc/ZK27vqLk/Chat-GPT-Image-Jun-2-2025-01-26-48-PM.avif",
      "https://i.postimg.cc/26QBz089/javsashtak-2.avif",
    ],
    description: "Nutrient-rich roasted flax seeds, ideal for daily intake. Enhances heart health and digestion, naturally high in omega-3 and fiber.",
    shortDescription: "Roasted flax seeds rich in omega-3 and fiber.",
    category: "seeds",
    benefits: ["High in Omega-3", "Boosts digestion", "Supports heart health"],
    price: "100", // Keep as string to match Flutter model
    stock: "80",  // Keep as string to match Flutter model
    unit: "250g",
    isPopular: true,
    nutrition: {
      calories: 534,
      protein: 18,
      carbs: 29,
      fat: 42,
      fiber: 27,
    },
    farmInfo: "Grown in the foothills of the Himalayas using traditional organic farming methods. No pesticides or chemical fertilizers used. Hand-harvested and sun-dried.",
    methods: null,
  },
  {
    id: 2,
    name: "Chia Seeds - Organically Grown",
    image: "https://i.postimg.cc/jSf8Hr8D/Chat-GPT-Image-Jun-2-2025-01-26-10-PM.avif",
    images: [
      "https://i.postimg.cc/jSf8Hr8D/Chat-GPT-Image-Jun-2-2025-01-26-10-PM.avif",
      "https://i.postimg.cc/ZY6d3FmM/photo-2-2025-05-26-21-21-50-removebg-preview.png",
    ],
    description: "Pure, organically grown chia seeds. Great source of plant-based protein, fiber, and omega-3. Perfect for smoothies, puddings, and baking.",
    shortDescription: "Organic chia seeds rich in fiber and omega-3.",
    category: "seeds",
    benefits: ["High in fiber", "Rich in Omega-3", "Boosts metabolism"],
    price: "100",
    stock: "60",
    unit: "250g",
    isPopular: true,
    nutrition: {
      calories: 486,
      protein: 17,
      carbs: 42,
      fat: 31,
      fiber: 34,
    },
    farmInfo: "Sourced from high-altitude farms in Bolivia and Peru. Grown using organic methods with minimal water, preserving local ecosystems.",
    methods: null,
  },
  {
    id: 3,
    name: "Khadisakhar Gulkand - 100% Pure and Natural",
    image: "https://i.postimg.cc/s2RTK08w/Chat-GPT-Image-Jun-2-2025-01-22-04-PM.avif",
    images: [
      "https://i.postimg.cc/s2RTK08w/Chat-GPT-Image-Jun-2-2025-01-22-04-PM.avif",
      "https://i.postimg.cc/d13r92q5/Chat-GPT-Image-Jun-2-2025-01-18-57-PM.avif",
    ],
    description: "Sun-cooked rose petal jam made with khadisakhar (rock sugar). Traditional Ayurvedic formulation to boost digestion, reduce heat, and enhance skin glow.",
    shortDescription: "Natural rose petal jam with rock sugar, Ayurvedic remedy.",
    category: "herbal",
    benefits: ["Cools body", "Aids digestion", "Natural detox"],
    price: "100",
    stock: "45",
    unit: "300g",
    isPopular: false,
    nutrition: {
      calories: 320,
      protein: 1,
      carbs: 80,
      fat: 0,
      fiber: 3,
    },
    farmInfo: "Cultivated in Rajasthan’s semi-arid regions under organic practices. Farmers rotate crops to maintain soil fertility without synthetic inputs.",
    methods: null,
  },
  {
    id: 4,
    name: "RAGI SHOTS NACHANI LADDU",
    image: "https://i.postimg.cc/7LcpxNQz/Image-Editor-5.png",
    images: [
      "https://i.postimg.cc/7LcpxNQz/Image-Editor-5.png",
      "https://i.postimg.cc/8cksTDYs/Ragi-2.avif"
    ],
    description: "Delicious and healthy Ragi Nachani Laddu, made from hygienically processed ragi. A traditional Indian sweet perfect for a nutritious snack, promoting weight loss and skin health.",
    shortDescription: "Healthy Ragi Nachani Laddu for weight loss and skin care.",
    category: "laddu",
    benefits: ["Promotes weight loss", "Prevents skin damage"],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "-",
    methods: [
      "Cultivation: Ragi seeds are sown at the onset of the monsoon",
      "Harvesting: Mature ragi stalks are cut using sickles",
      "Post-Harvest: The stalks are dried & threshed",
      "Making Laddu: The ragi mixture is hygienically formed into laddu, ensuring a clean environment"
    ],
  },
  {
    id: 5,
    name: "Healthy Ragi Biscuits",
    image: "https://i.postimg.cc/vBf54QXz/Biscuit-1.avif",
    images: [
      "https://i.postimg.cc/vBf54QXz/Biscuit-1.avif",
      "https://i.postimg.cc/1R0pP38R/Biscuit-2.avif"
    ],
    description: "Wholesome and healthy Ragi biscuits, perfect for a nutritious snack. Aids in digestion, lowers inflammation, and supports skin and bone health.",
    shortDescription: "Nutritious Ragi biscuits for overall health.",
    category: "biscuits",
    benefits: [
      "Aids digestion & Lowers inflammation",
      "Skin health",
      "Bone health"
    ],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "-",
    methods: [
      "Harvesting Ragi",
      "Drying & Cleaning",
      "Milling Into Flour",
      "Preparing the Dough",
      "Baking"
    ],
  },
  {
    id: 6,
    name: "100% Natural Jaggery Cubes",
    image: "https://i.postimg.cc/J08ZJ92W/cube-1.avif",
    images: [
      "https://i.postimg.cc/J08ZJ92W/cube-1.avif",
      "https://i.postimg.cc/2yxvx2sL/cube-2.avif"
    ],
    description: "Pure and natural jaggery cubes, a traditional Indian sweetener made from organic, chemical-free sugarcane juice. Offers various health benefits including headache relief and blood sugar regulation.",
    shortDescription: "Natural jaggery cubes, traditional sweetener.",
    category: "sweetener",
    benefits: [
      "Helps with headaches & migraines",
      "Regulates blood sugar",
      "Helps with premenstrual syndrome",
      "Improves skin health"
    ],
    price: "100",
    stock: "-",
    unit: "200gm",
    isPopular: true,
    nutrition: null,
    farmInfo: "Produced from organic, chemical-free sugarcane juice.",
    methods: ["Boiled and molded using traditional, natural methods."],
  },
  {
    id: 7,
    name: "Curry Leaves Powder",
    image: "https://i.postimg.cc/BQq2vfFT/Curry-1.avif",
    images: [
      "https://i.postimg.cc/BQq2vfFT/Curry-1.avif",
      "https://i.postimg.cc/K8WTQKHf/Curry-2.avif"
    ],
    description: "Finely ground curry leaves powder, made from hand-picked and gently dried leaves without additives. Supports digestion, eye sight, cholesterol levels, and is beneficial for diabetes patients.",
    shortDescription: "Natural curry leaves powder for digestion and eye health.",
    category: "powder",
    benefits: [
      "Good for digestion",
      "Eye sight",
      "Reduces cholesterol",
      "Good for diabetes patient"
    ],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "-",
    methods: [
      "Hand-picked curry leaves are gently dried",
      "Finely-ground without additives"
    ],
  },
  {
    id: 8,
    name: "Arogyam Jamoon Juice",
    image: "https://i.postimg.cc/DyBLJpQt/jamoon-1.avif",
    images: [
      "https://i.postimg.cc/DyBLJpQt/jamoon-1.avif",
      "https://i.postimg.cc/1zNqdmxQ/jamoon-2.avif"
    ],
    description: "Refreshing and healthy Arogyam Jamoon Juice. Helps in digestion and constipation, manages blood sugar levels, and supports oral health. Rich in antioxidants and 100% natural.",
    shortDescription: "Healthy Jamoon juice, rich in antioxidants.",
    category: "juice",
    benefits: [
      "Helps in digestion and constipation",
      "Manages blood sugar levels",
      "Helps with oral health",
      "Rich in antioxidants"
    ],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "100% Natural, Non GMO.",
    methods: ["-"],
  },
  {
    id: 10,
    name: "Guimaat Jaggery Powder",
    image: "https://i.postimg.cc/3N94GWGg/juggery-1.avif",
    images: [
      "https://i.postimg.cc/3N94GWGg/juggery-1.avif",
      "https://i.postimg.cc/155NQcxM/juggery-2.avif"
    ],
    description: "100% Natural Guimaat Jaggery Powder, a traditional Indian sweetener. Made from organically grown sugarcane, processed without additives, and sun-dried. Helps with respiratory problems and boosts immunity.",
    shortDescription: "Natural jaggery powder for immunity and respiratory health.",
    category: "sweetener",
    benefits: [
      "Helps with respiratory problems",
      "Regulates blood sugar",
      "Prevents anemia",
      "Boosts immunity"
    ],
    price: "100",
    stock: "-",
    unit: "500gm",
    isPopular: true,
    nutrition: null,
    farmInfo: "Made from organically grown sugarcane. No chemicals, pesticides, or preservatives used.",
    methods: [
      "Processed without any additives, colors, or preservatives.",
      "Naturally sun-dried, crushed, and packed in eco-friendly conditions."
    ],
  },
  {
    id: 11,
    name: "Super Quality Lemon Ginger Honey Syrup",
    image: "https://i.postimg.cc/kMytzYHB/Lemon-honey-1.avif",
    images: [
      "https://i.postimg.cc/kMytzYHB/Lemon-honey-1.avif",
      "https://i.postimg.cc/NfJ2f9Bt/Lemon-honey-2.avif"
    ],
    description: "A super quality syrup made with the natural goodness of lemon, ginger, and honey. A refreshing and healthy concoction perfect for a soothing drink.",
    shortDescription: "Refreshing lemon, ginger, and honey syrup.",
    category: "syrup",
    benefits: ["-"],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "-",
    methods: ["-"],
  },
  {
    id: 12,
    name: "Moringa Powder",
    image: "https://i.postimg.cc/wj1ytqjm/moringa-1.avif",
    images: [
      "https://i.postimg.cc/wj1ytqjm/moringa-1.avif",
      "https://i.postimg.cc/TPmK9tm2/Moringa-2.avif"
    ],
    description: "Hygienically powdered Moringa made from fresh, shade-dried leaves. A superfood that helps lower blood sugar levels, cholesterol, and protects the liver.",
    shortDescription: "Nutrient-rich Moringa powder for overall wellness.",
    category: "powder",
    benefits: [
      "Lowers blood sugar level",
      "Lowers cholesterol",
      "Protects the liver"
    ],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "-",
    methods: ["Fresh Moringa leaves are shade-dried", "Hygienically powdered"],
  },
  {
    id: 13,
    name: "Panchatav Ghee",
    image: "https://i.postimg.cc/t481WKsm/Panchtatav-1.avif",
    images: [
      "https://i.postimg.cc/t481WKsm/Panchtatav-1.avif",
      "https://i.postimg.cc/ZRSCD6F8/Panchtatav-2.avif"
    ],
    description: "Panchatav Ghee, ethically sourced and traditionally prepared. Nutrient-rich in vitamins A, D, E, K. Made from hand-churning curd in earthen pots following traditional Maharashtrian methods.",
    shortDescription: "Ethically sourced, traditionally prepared Ghee rich in vitamins.",
    category: "ghee",
    benefits: ["Nutrient rich in vitamins A, D, E, K"],
    price: "100",
    stock: "-",
    unit: "-",
    isPopular: true,
    nutrition: null,
    farmInfo: "Ethically Sourced: Ghee source begins with indigenous cows raised in peaceful, green fields of rural Maharashtra. Free-grazing, stress-free, these cows yield milk that's pure, potent and full of nourishment.",
    methods: [
      "Traditionally prepared: Made by hand churning curd using traditional methods in earthen pots, just like in Maharashtra."
    ],
  },
];


const seedDB = async () => {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const db = client.db('sanskar_organics_db'); // Replace with your actual database name
        const collection = db.collection('products'); // Your products collection name

        console.log("Connected to MongoDB for seeding...");

        // Clear existing data (optional, but good for fresh seeds)
        await collection.deleteMany({});
        console.log("Existing products cleared.");

        // Insert new data
        await collection.insertMany(productsData);
        console.log(`Successfully seeded ${productsData.length} products.`);

    } catch (error) {
        console.error("Error during seeding:", error);
    } finally {
        await client.close();
        console.log("MongoDB connection closed after seeding.");
    }
};

seedDB();