import dotenv from "dotenv";
import mqtt from "mqtt";
dotenv.config();

// Global variable to hold the current message
let currentMessage = "";

// MQTT Connection Options
const options = {
  clientId: process.env.MQTT_CLIENT_ID,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: false,
};

console.log("🔄 Connecting to MQTT...");

// Connect to MQTT Broker
const client = mqtt.connect(process.env.MQTT_URI, options);

// MQTT Topics
const sendTopic = process.env.MQTT_SEND_TOPIC;

// When connected, subscribe to the topic
client.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");

  client.subscribe(sendTopic, (err) => {
    if (!err) {
      console.log(`📩 Subscribed to topic: ${sendTopic}`);
    } else {
      console.error(`❌ Subscription failed: ${err.message}`);
    }
  });

});

// Function to publish the current message
function publishMessage() {
  if (client.connected) {
    client.publish(sendTopic, currentMessage, (err) => {
      if (err) {
        console.error("Error publishing message:", err);
      } else {
        console.log("📡 Published message:", currentMessage);
      }
    });
  } else {
    console.log("Client not connected. Cannot publish message.");
  }
}

// Exported function to update the message and then publish it
export function setMessage(msg) {
  currentMessage = msg;
  publishMessage();
}
// Handle errors
client.on("error", (err) => {
  console.error(`❌ MQTT Connection Error: ${err.message}`);
});

// Handle disconnection
client.on("close", () => {
  console.log("🔴 Disconnected from MQTT Broker");
});
