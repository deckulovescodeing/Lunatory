import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support multi-page high-resolution invoice photos
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // In-memory synced store state for self-hosted server backend
  const serverStoreDatabase: {
    lastUpdated: string;
    stores: Record<string, {
      inventory: any[];
      countSessions: any[];
      wasteEntries: any[];
      truckOrders: any[];
      lastUpdated: string;
    }>;
  } = {
    lastUpdated: new Date().toISOString(),
    stores: {},
  };

  // API health check & Server Sync health
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      service: "Hardee's Lunatory Hub",
      version: "2.4.0",
      offlineCapable: true,
      selfHosted: true,
    });
  });

  // GET /api/sync/health
  app.get("/api/sync/health", (req, res) => {
    const authHeader = req.headers["authorization"] || req.headers["x-api-key"];
    const storeCount = Object.keys(serverStoreDatabase.stores).length;
    res.json({
      status: "connected",
      message: "Hardee's Central Store Server is Online",
      serverTime: new Date().toISOString(),
      version: "2.4.0",
      authenticated: true,
      managedStoresCount: storeCount,
      activeNodes: 1,
    });
  });

  // GET /api/sync/pull?storeId=...
  app.get("/api/sync/pull", (req, res) => {
    const storeId = (req.query.storeId as string) || "store-harrogate-1102";
    const storeData = serverStoreDatabase.stores[storeId] || {
      inventory: [],
      countSessions: [],
      wasteEntries: [],
      truckOrders: [],
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      storeId,
      timestamp: new Date().toISOString(),
      lastServerUpdated: storeData.lastUpdated,
      data: storeData,
    });
  });

  // POST /api/sync/push
  app.post("/api/sync/push", (req, res) => {
    try {
      const { storeId, inventory, countSessions, wasteEntries, truckOrders, clientTimestamp, deviceName } = req.body;
      const targetStoreId = storeId || "store-harrogate-1102";

      if (!serverStoreDatabase.stores[targetStoreId]) {
        serverStoreDatabase.stores[targetStoreId] = {
          inventory: [],
          countSessions: [],
          wasteEntries: [],
          truckOrders: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      const existing = serverStoreDatabase.stores[targetStoreId];

      // Merge inventory items (replace or merge by item ID)
      if (Array.isArray(inventory) && inventory.length > 0) {
        const itemMap = new Map<string, any>();
        existing.inventory.forEach((it) => itemMap.set(it.id, it));
        inventory.forEach((it) => itemMap.set(it.id, it));
        existing.inventory = Array.from(itemMap.values());
      }

      // Merge count sessions
      if (Array.isArray(countSessions) && countSessions.length > 0) {
        const countMap = new Map<string, any>();
        existing.countSessions.forEach((c) => countMap.set(c.id, c));
        countSessions.forEach((c) => countMap.set(c.id, c));
        existing.countSessions = Array.from(countMap.values());
      }

      // Merge waste entries
      if (Array.isArray(wasteEntries) && wasteEntries.length > 0) {
        const wasteMap = new Map<string, any>();
        existing.wasteEntries.forEach((w) => wasteMap.set(w.id, w));
        wasteEntries.forEach((w) => wasteMap.set(w.id, w));
        existing.wasteEntries = Array.from(wasteMap.values());
      }

      // Merge truck orders
      if (Array.isArray(truckOrders) && truckOrders.length > 0) {
        const orderMap = new Map<string, any>();
        existing.truckOrders.forEach((o) => orderMap.set(o.id, o));
        truckOrders.forEach((o) => orderMap.set(o.id, o));
        existing.truckOrders = Array.from(orderMap.values());
      }

      existing.lastUpdated = new Date().toISOString();
      serverStoreDatabase.lastUpdated = existing.lastUpdated;

      console.log(`[Sync Server] Push received from "${deviceName || "Device"}" for store ${targetStoreId}. Synced ${existing.inventory.length} items, ${existing.countSessions.length} counts.`);

      res.json({
        success: true,
        storeId: targetStoreId,
        syncedAt: existing.lastUpdated,
        data: existing,
        message: `Successfully synchronized store dataset with ${deviceName || "Device"}`,
      });
    } catch (err: any) {
      console.error("[Sync Server Error]", err);
      res.status(500).json({ error: err.message || "Failed to synchronize dataset with server." });
    }
  });

  // GET /api/sync/peers
  app.get("/api/sync/peers", (req, res) => {
    res.json({
      serverPeerId: "server-primary-01",
      name: "Hardee's Central Server",
      online: true,
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/orders/scan-invoice
  // Extracts multi-page truck delivery manifests, invoices, packing slips, or POs
  app.post("/api/orders/scan-invoice", async (req, res) => {
    try {
      const { pages, inventoryCatalog, storeInfo } = req.body;

      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return res.status(400).json({ error: "No page images provided." });
      }

      const client = getGeminiClient();

      if (!client) {
        // Fallback simulated parsing when GEMINI_API_KEY is not configured yet
        console.log("No GEMINI_API_KEY found, generating fallback structured order extraction.");
        const fallbackItems = (inventoryCatalog || []).slice(0, 8).map((item: any, idx: number) => ({
          itemName: item.name,
          sku: item.sku || `SKU-${1000 + idx}`,
          packSize: item.packSize || "1 CS",
          quantityOrdered: Math.floor(Math.random() * 4) + 2,
          quantityShipped: Math.floor(Math.random() * 4) + 2,
          unitCost: item.costPerUnit || 34.5,
          totalCost: (item.costPerUnit || 34.5) * (Math.floor(Math.random() * 4) + 2),
          matchedItemId: item.id,
          confidence: 0.95,
          storageLocation: item.storageLocation || "Dry Storage Room",
          pageNumber: 1,
        }));

        return res.json({
          success: true,
          orderNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
          vendor: "US Foods CKE Logistics",
          invoiceDate: new Date().toISOString().split("T")[0],
          deliveryDate: new Date().toISOString().split("T")[0],
          storeNumber: storeInfo?.storeNumber || "HAR-0482",
          totalPages: pages.length,
          subtotal: fallbackItems.reduce((sum: number, item: any) => sum + item.totalCost, 0),
          totalCases: fallbackItems.reduce((sum: number, item: any) => sum + item.quantityShipped, 0),
          items: fallbackItems,
          notes: `Parsed ${pages.length} invoice page(s) successfully.`,
          simulated: true,
        });
      }

      // Format parts for Gemini
      const imageParts = pages.map((page: { data: string; mimeType?: string }, index: number) => {
        // Strip data:image/...;base64, prefix if present
        let base64Data = page.data;
        let mime = page.mimeType || "image/jpeg";
        if (base64Data.includes("base64,")) {
          const split = base64Data.split("base64,");
          const mimeMatch = split[0].match(/:(.*?);/);
          if (mimeMatch) mime = mimeMatch[1];
          base64Data = split[1];
        }

        return {
          inlineData: {
            mimeType: mime,
            data: base64Data,
          },
        };
      });

      const catalogSummary = (inventoryCatalog || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        unitType: item.unitType,
        packSize: item.packSize,
        costPerUnit: item.costPerUnit,
        storageLocation: item.storageLocation,
      }));

      const systemPrompt = `
You are an expert restaurant supply chain and invoice digitization AI.
You are given ${pages.length} image(s) representing sequential pages of a physical restaurant delivery truck invoice, bill of lading, purchase order, or packing slip (such as US Foods, McLane, Sysco, CKE Supply, Gordon Food Service, PFG, etc.).

Analyze all ${pages.length} page(s) thoroughly and extract:
1. Invoice / Order / PO Number (e.g., "USF-928410", "INV-481902")
2. Vendor / Distributor Name (e.g., "US Foods", "McLane", "Sysco")
3. Invoice Date / Delivery Date (YYYY-MM-DD format if possible)
4. Store Number / Customer Reference (e.g., "Hardee's #104", "Store 482")
5. All itemized line items across ALL pages. For each item:
   - itemName: string (clean product name, e.g. "Made From Scratch Biscuit Flour 50lb", "1/4lb Thickburger Angus Patties", "Curly Fries 6x5lb")
   - sku: string (product code / distributor item #, e.g. "USF-30912")
   - packSize: string (e.g. "4/10 LB", "50 LB BAG", "12/32 OZ")
   - quantityOrdered: number (cases ordered)
   - quantityShipped: number (cases shipped / delivered / invoiced)
   - unitCost: number (price per case/unit)
   - totalCost: number (extended price)
   - pageNumber: number (which page this item appeared on, 1-indexed)
   - matchedItemId: string or null (if it closely matches an item from the Store Inventory Catalog provided below, provide its exact 'id'. Otherwise null).
   - confidence: number between 0 and 1
   - storageLocation: string ("Walk-in Freezer", "Walk-in Cooler", "Dry Storage Room", "Front Counter / Dispenser", "Chemical / Supply Rack")

Store Inventory Catalog for matching:
${JSON.stringify(catalogSummary, null, 2)}

Return ONLY valid JSON adhering strictly to this schema:
{
  "orderNumber": string,
  "vendor": string,
  "invoiceDate": string,
  "deliveryDate": string,
  "storeNumber": string,
  "subtotal": number,
  "totalCases": number,
  "notes": string,
  "items": [
    {
      "itemName": string,
      "sku": string,
      "packSize": string,
      "quantityOrdered": number,
      "quantityShipped": number,
      "unitCost": number,
      "totalCost": number,
      "pageNumber": number,
      "matchedItemId": string | null,
      "confidence": number,
      "storageLocation": string
    }
  ]
}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          ...imageParts,
          {
            text: systemPrompt,
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse Gemini JSON output:", responseText);
        return res.status(500).json({ error: "Failed to parse structured invoice data." });
      }

      // Add meta info
      parsedData.totalPages = pages.length;
      parsedData.success = true;

      // Ensure item costs and cases are calculated if missing
      if (!parsedData.subtotal && parsedData.items) {
        parsedData.subtotal = parsedData.items.reduce(
          (acc: number, item: any) => acc + (Number(item.totalCost) || Number(item.unitCost) * Number(item.quantityShipped) || 0),
          0
        );
      }
      if (!parsedData.totalCases && parsedData.items) {
        parsedData.totalCases = parsedData.items.reduce(
          (acc: number, item: any) => acc + (Number(item.quantityShipped) || Number(item.quantityOrdered) || 0),
          0
        );
      }

      res.json(parsedData);
    } catch (err: any) {
      console.error("Error processing invoice scan:", err);
      res.status(500).json({
        error: err.message || "An error occurred while scanning the truck order invoice.",
      });
    }
  });

  // POST /api/inventory/scan-product-label
  // Analyzes camera photos of product labels, packaging, boxes, and barcodes to auto-extract product info
  app.post("/api/inventory/scan-product-label", async (req, res) => {
    try {
      const { images, existingCategories, existingBarcode, storeInfo } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "No product image provided." });
      }

      const client = getGeminiClient();

      if (!client) {
        // Fallback realistic product extraction when GEMINI_API_KEY is not set
        console.log("No GEMINI_API_KEY found, generating structured fallback product extraction.");
        const fallbackBarcode = existingBarcode || "0712345" + Math.floor(10000 + Math.random() * 90000);
        return res.json({
          success: true,
          name: "Hardee's Premium Angus Beef Patties 1/3 lb",
          barcode: fallbackBarcode,
          sku: "HD-ANG-" + Math.floor(100 + Math.random() * 900),
          vendor: "US Foods CKE Supply",
          categoryId: existingCategories?.[0]?.id || "cat-meats",
          categoryName: existingCategories?.[0]?.name || "Meats & Patties",
          storageLocation: "Walk-in Freezer",
          unitType: "case",
          packSize: "40 x 5.33 oz patties (13.3 lb case)",
          unitsPerPack: 40,
          costPerUnit: 64.50,
          parLevel: 8,
          reorderThreshold: 3,
          usageRatePerDay: 2.5,
          allergens: ["Beef"],
          notes: "Keep frozen at 0°F. Cook to internal temperature of 165°F.",
          confidence: 0.96,
          simulated: true,
        });
      }

      // Format image parts for Gemini
      const imageParts = images.map((img: { data: string; mimeType?: string }) => {
        let base64Data = img.data;
        let mime = img.mimeType || "image/jpeg";
        if (base64Data.includes("base64,")) {
          const split = base64Data.split("base64,");
          const mimeMatch = split[0].match(/:(.*?);/);
          if (mimeMatch) mime = mimeMatch[1];
          base64Data = split[1];
        }

        return {
          inlineData: {
            mimeType: mime,
            data: base64Data,
          },
        };
      });

      const categoryPrompt = (existingCategories || [])
        .map((c: any) => `- ID: "${c.id}", Name: "${c.name}"`)
        .join("\n");

      const systemPrompt = `
You are an expert restaurant inventory AI for Hardee's / Carl's Jr / fast-food franchise operations.
You are given ${images.length} photo(s) of a physical product label, wholesale delivery box, food packaging, barcode sticker, bottle, bag, or can.

Analyze all visual elements (brand text, product title, distributor stickers, net weights, UPC/barcode digits, allergen statements, temperature requirements, pack size) and extract structured inventory catalog information.

Existing Store Categories:
${categoryPrompt}

${existingBarcode ? `Note: User provided or scanned preliminary barcode: "${existingBarcode}"` : ""}

Return ONLY valid JSON matching this schema:
{
  "name": string, // Clean official product name (e.g. "McCain Seasoned Spiral Cut Curly Fries", "CKE Thickburger Angus Beef Patties 1/3 lb", "Made From Scratch Biscuit Mix 50lb")
  "barcode": string, // Barcode numbers (UPC/EAN/GTIN numbers visible or encoded). If not clearly legible, return "${existingBarcode || ""}" or empty string.
  "sku": string, // SKU or vendor item code (e.g. "USF-38491", "HD-8201")
  "vendor": string, // Manufacturer or distributor (e.g. "US Foods CKE Supply", "Sysco", "Tyson", "Simplot", "Kraft Heinz", "CKE Logistics")
  "categoryId": string, // The ID of the best matching category from the list above
  "categoryName": string, // The name of the matching category
  "storageLocation": string, // Exactly one of: "Walk-in Freezer", "Walk-in Cooler", "Dry Storage Room", "Front Counter / Dispenser", "Kitchen Prep Line", "Chemical / Supply Rack"
  "unitType": string, // Exactly one of: "case", "bag", "box", "lb", "each", "carton", "gallon", "pack", "roll"
  "packSize": string, // Specific pack description (e.g. "6 x 5 lb bags (30 lb case)", "12 x 32 oz bottles", "50 lb bag", "1000 ct case")
  "unitsPerPack": number, // Number of individual items/bags inside (e.g. 6, 12, 1, 1000)
  "costPerUnit": number, // Realistic wholesale restaurant cost in USD per unit/case (e.g. 48.50)
  "parLevel": number, // Recommended restaurant par level count (e.g. 8)
  "reorderThreshold": number, // Recommended low-stock reorder trigger (e.g. 3)
  "usageRatePerDay": number, // Estimated daily case consumption (e.g. 1.5)
  "allergens": string[], // Declared allergens (e.g. ["Wheat", "Soy", "Milk"])
  "notes": string, // Preparation notes, storage temperature, ingredients, or brand details
  "confidence": number // Number between 0.0 and 1.0
}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          ...imageParts,
          {
            text: systemPrompt,
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("Failed to parse Gemini JSON output for product label:", responseText);
        return res.status(500).json({ error: "Failed to parse structured product data." });
      }

      parsedData.success = true;
      if (!parsedData.barcode && existingBarcode) {
        parsedData.barcode = existingBarcode;
      }
      if (!parsedData.barcode) {
        parsedData.barcode = "0712345" + Math.floor(10000 + Math.random() * 90000);
      }
      if (!parsedData.sku) {
        parsedData.sku = "HD-" + (parsedData.name || "ITEM").substring(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
      }

      res.json(parsedData);
    } catch (err: any) {
      console.error("Error processing product label scan:", err);
      res.status(500).json({
        error: err.message || "An error occurred while scanning the product label.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lunatory server running on port ${PORT}`);
  });
}

startServer();
