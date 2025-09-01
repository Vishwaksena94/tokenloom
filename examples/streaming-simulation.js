/**
 * Streaming Simulation Example
 *
 * This example demonstrates TokenLoom's streaming capabilities by simulating
 * real-time text arrival with random chunk sizes, similar to how text might
 * arrive from an AI model or network stream.
 */

import { TokenLoom } from "../dist/index.esm.js";

// Sample text with custom tags and code fences
const sampleText = `  Here is some intro text.
  <b>bold</b>
  <think attr="value" hello="world" color="red">This is my hidden reasoning</think>

Here is some intro text.

<think>This is my hidden reasoning</think>

Now a code block:

\`\`\`javascript
console.log("Hello world");
function test() {
  return 42;
}
\`\`\`
  
<plan attr="value">
Step 1: Parse the input
Step 2: Process chunks
</plan>



And we are done.

`;

// ANSI color helpers for stdout
const COLORS = {
  reset: "\x1b[0m",
  text: "\x1b[37m", // white
  tag: "\x1b[35m", // magenta
  think: "\x1b[93m", // bright yellow
  plan: "\x1b[96m", // bright cyan
  code: "\x1b[92m", // bright green
};

const writeColored = (s, color) =>
  process.stdout.write(color + s + COLORS.reset + "#");

// Utility function to break text into random chunks (3-6 characters)
function* randomChunks(text, seed = 42) {
  let i = 0;
  let rng = seed;

  // Simple LCG for reproducible randomness
  const nextRandom = () => {
    rng = (rng * 1664525 + 1013904223) % 0x100000000;
    return rng / 0x100000000;
  };

  while (i < text.length) {
    const size = 3 + Math.floor(nextRandom() * 4); // 3–6 characters
    yield text.slice(i, i + size);
    i += size;
  }
}

console.log("🌊 TokenLoom Streaming Simulation Example\n");

// Create parser
const parser = new TokenLoom({
  emitUnit: "token",
  bufferLength: 64, // Smaller buffer to demonstrate backpressure
  tags: ["think", "plan"],
  maxSpecialWaitBytes: 10,
});

// Track parsing state
let chunkCount = 0;
let eventCount = 0;
const eventTypes = new Set();

// Add custom plugin to track events
parser.use({
  name: "event-tracker",
  onEvent(event) {
    eventCount++;
    eventTypes.add(event.type);

    switch (event.type) {
      case "tag-open": {
        writeColored(`<${event.name}>`, COLORS.tag);
        break;
      }
      case "tag-close": {
        writeColored(`</${event.name}>`, COLORS.tag);
        break;
      }
      case "code-fence-start": {
        const lang = event.lang ? event.lang : "";
        writeColored(`\n\`\`\`${lang}\n`, COLORS.code);
        break;
      }
      case "code-fence-chunk": {
        writeColored(event.text, COLORS.code);
        break;
      }
      case "code-fence-end": {
        writeColored(`\n\`\`\`\n`, COLORS.code);
        break;
      }
      case "text": {
        const inTagName = event.in?.inTag?.name;
        const color =
          inTagName === "think"
            ? COLORS.think
            : inTagName === "plan"
            ? COLORS.plan
            : COLORS.text;
        writeColored(event.text, color);
        break;
      }
    }
  },
});

console.log("📦 Feeding random chunks to parser...\n");

// Simulate streaming by feeding random chunks
for (const chunk of randomChunks(sampleText, 123)) {
  chunkCount++;
  //console.log(`Chunk ${chunkCount}: "${chunk}"`);
  parser.feed({ text: chunk });

  // Add small delay to simulate real streaming
  await new Promise((resolve) => setTimeout(resolve, 50));
}

console.log("\n🔄 Flushing remaining buffer...");
parser.flush();

console.log("\n" + "=".repeat(50));
console.log("📊 Streaming Statistics");
console.log("=".repeat(50));
console.log(`📦 Total chunks processed: ${chunkCount}`);
console.log(`⚡ Total events emitted: ${eventCount}`);
console.log(`🎯 Event types seen: ${Array.from(eventTypes).join(", ")}`);

console.log("\n✅ Streaming simulation complete!");

// Helper function to add delay (for Node.js compatibility)
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
