import Groq from "groq-sdk";
import readlineSync from "readline-sync";

const GROQ_API_KEY = "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"

const groq = new Groq({
    apiKey: GROQ_API_KEY,
})
// Tools 
function getWeatherDetails(city = "") {
    if (city.toLowerCase() === "patiala") return "10 °C";
    if (city.toLowerCase() === "mohali") return "14 °C";
    if (city.toLowerCase() === "bangalore") return "20 °C";
    if (city.toLowerCase() === "chandigarh") return "8 °C";
    if (city.toLowerCase() === "delhi") return "12 °C";
}

const tools = {
    "getWeatherDetails": getWeatherDetails
}

const SYSTEM_PROMPT = `
You are an AI agent with START, PLAN, ACTION, Observation and Output States.
Wait for the user prompt and first plan using available tools.
After planning, take the ACTION with appropriate tools and wait for Observation based on the action.
Dont fetch details if already fetched once.
Once you get the observations, return the AI response based on the START prompt and observations.

Strictly follow the JSON output format as in examples.

Available Tools:
- function getWeatherDetails(city: string): string
getWeatherDetails function takes city name as string input and returns the weather details of that city.

Example:
START
{"type": "user", "user": "What is the sum of the weather of Patiala and Mohali?" }
{"type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{"type": "action", "function": "getWeatherDetails", "input": "patiala" }
{"type": "observation", "observation": "10 °C" }
{"type": "plan", "plan": "I will call the getWeatherDetails for Mohali" }
{"type": "action", "function": "getWeatherDetails", "input": "mohali" }
{"type": "observation", "observation": "14 °C" }
{"type": "output", "output": "The sum of weather of Patiala and Mohali is 24 °C" }

`;

const messages = [{ "role": "system", "content": SYSTEM_PROMPT }];

async function handle() {
    while (true) {
        const query = readlineSync.question("Enter your query: ");
        const q = {
            "type": "user",
            "user": query,
        }
        messages.push({ "role": "user", "content": JSON.stringify(q) });

        while (true) {
            const chat = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                response_format: { type: "json_object" }
            });

            const result = chat.choices[0].message.content;
            messages.push({ "role": "assistant", "content": result });

            console.log(`\n\n-------------------START AI RESPONSE-------------------`);
            console.log(result);
            console.log(`-------------------END AI RESPONSE-------------------\n\n`);

            const call = JSON.parse(result);

            if (call.type === "output") {
                console.log(`🤖: ${call.output}`);
                break;
            } else if (call.type === "action") {
                const fn = tools[call.function];
                const observation = fn(call.input);
                const obs = {
                    "type": "observation",
                    "observation": observation
                }
                messages.push({ "role": "user", "content": JSON.stringify(obs) });
            }
        }
    }
}

handle();