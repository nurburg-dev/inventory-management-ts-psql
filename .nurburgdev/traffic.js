import http from "k6/http";
import { check, sleep } from "k6";

// Configuration
const API_HOST = __ENV.API_HOST || "http://localhost:3000";
const ITEM_COUNT = 50000;

// Categories to use for testing
const categories = [
  "Electronics",
  "Furniture",
  "Office Supplies",
  "Clothing",
  "Books",
  "Sports",
  "Home & Garden",
  "Automotive",
  "Health & Beauty",
  "Toys",
  "Music & Movies",
  "Food & Beverage",
  "Tools & Hardware",
  "Pet Supplies",
  "Jewelry",
];

// Product names for variety
const productNames = [
  "Laptop",
  "Mouse",
  "Keyboard",
  "Monitor",
  "Chair",
  "Desk",
  "Phone",
  "Tablet",
  "Headphones",
  "Speaker",
  "Camera",
  "Printer",
  "Scanner",
  "Router",
  "Cable",
  "Charger",
  "Case",
  "Stand",
  "Adapter",
  "Battery",
  "Memory Card",
  "Drive",
  "Notebook",
  "Pen",
  "Pencil",
  "Paper",
  "Folder",
  "Binder",
  "Stapler",
  "Clips",
];

// Load test configuration
export const options = {
  scenarios: {
    // Setup phase: Create 50,000 items
    setup_items: {
      executor: "shared-iterations",
      vus: 50, // 50 virtual users
      iterations: ITEM_COUNT, // 50,000 total iterations
      maxDuration: "1m",
      tags: { scenario: "setup" },
      exec: "setupItems",
    },

    // Load test phase: Test category top API
    load_test: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "2m", target: 100 }, // Ramp up to 100 users
        { duration: "2m", target: 500 }, // Ramp up to 500 users
        { duration: "2m", target: 1000 }, // Ramp up to 1000 users
        { duration: "3m", target: 1000 }, // Stay at 1000 users
        { duration: "2m", target: 0 }, // Ramp down
      ],
      tags: { scenario: "load_test" },
      exec: "loadTest",
      startTime: "1m", // Start after setup is complete
    },
  },

  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
    "http_req_duration{scenario:load_test}": ["p(90)<1000"],
  },
};

// Setup function - creates items
export function setupItems() {
  const randomCategory =
    categories[Math.floor(Math.random() * categories.length)];
  const randomProduct =
    productNames[Math.floor(Math.random() * productNames.length)];
  const randomId = Math.floor(Math.random() * 100000);

  const payload = JSON.stringify({
    name: `${randomProduct} ${randomId}`,
    description: `High quality ${randomProduct.toLowerCase()} for ${randomCategory.toLowerCase()}`,
    quantity: Math.floor(Math.random() * 1000) + 1, // 1-1000 quantity
    price: parseFloat((Math.random() * 999 + 1).toFixed(2)), // $1-$999.99
    category: randomCategory,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { operation: "create_item" },
  };

  const response = http.post(`${API_HOST}/api/items`, payload, params);

  check(response, {
    "item created successfully": (r) => r.status === 201,
    "response time < 5s": (r) => r.timings.duration < 5000,
  });

  if (response.status !== 201) {
    console.error(
      `Failed to create item: ${response.status} - ${response.body}`
    );
  }
}

// Load test function - tests category top API
export function loadTest() {
  // Randomly select a category to test
  const category = categories[Math.floor(Math.random() * categories.length)];

  const params = {
    tags: {
      operation: "get_top_items",
      category: category,
    },
  };

  const response = http.get(
    `${API_HOST}/api/items/category/${encodeURIComponent(category)}/top`,
    params
  );

  const checkResult = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 1s": (r) => r.timings.duration < 1000,
    "response has items": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.items && Array.isArray(body.items);
      } catch (e) {
        return false;
      }
    },
    "items are sorted by quantity": (r) => {
      try {
        const body = JSON.parse(r.body);
        const items = body.items;
        if (!items || items.length < 2) return true;

        for (let i = 0; i < items.length - 1; i++) {
          if (items[i].quantity < items[i + 1].quantity) {
            return false;
          }
        }
        return true;
      } catch (e) {
        return false;
      }
    },
    "correct category returned": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.category === category;
      } catch (e) {
        return false;
      }
    },
  });

  if (!checkResult) {
    console.error(
      `Failed request for category ${category}: ${
        response.status
      } - ${response.body.slice(0, 200)}`
    );
  }

  // Small sleep to prevent overwhelming the server
  sleep(0.1);
}

// Default function for single test runs
export default function () {
  loadTest();
}

// Setup hook - called once before all scenarios
export function setup() {
  console.log("Starting load test setup...");
  console.log(`API Host: ${API_HOST}`);
  console.log(`Items to create: ${ITEM_COUNT}`);
  console.log(`Categories: ${categories.join(", ")}`);
  return { startTime: new Date().toISOString() };
}

// Teardown hook - called once after all scenarios
export function teardown(data) {
  console.log("Load test completed");
  console.log(`Started at: ${data.startTime}`);
  console.log(`Completed at: ${new Date().toISOString()}`);
}
