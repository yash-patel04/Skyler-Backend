import mqtt from "mqtt";

// MQTT Broker (HiveMQ Cloud)
const mqttServer =
  "mqtts://3b2168521a3c446b855086fe0db38168.s1.eu.hivemq.cloud:8883";
const mqttUser = "Yash_patel";
const mqttPassword = "YashPateL0@";
const clientId = "NodeJS_Client";

// Global variable to hold the current message
let currentMessage = "";

// MQTT Connection Options
const options = {
  clientId: clientId,
  username: mqttUser,
  password: mqttPassword,
  rejectUnauthorized: false,
};

console.log("🔄 Connecting to MQTT...");

// Connect to MQTT Broker
const client = mqtt.connect(mqttServer, options);

// MQTT Topic
const topic = "Skyler";

// When connected, subscribe to the topic
client.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");

  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`📩 Subscribed to topic: ${topic}`);
    } else {
      console.error(`❌ Subscription failed: ${err.message}`);
    }
  });
});

// Function to publish the current message
function publishMessage() {
  if (client.connected) {
    client.publish(topic, currentMessage, (err) => {
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
  console.log("msg", msg);
  currentMessage = msg;
  console.log("Message updated:", currentMessage);
  publishMessage();
}

// Handle incoming messages
client.on("message", (topic, message) => {
  console.log(`📬 Message received on topic: ${topic}`);
  console.log(`📝 Message: ${message.toString()}`);
});

// Handle errors
client.on("error", (err) => {
  console.error(`❌ MQTT Connection Error: ${err.message}`);
});

// Handle disconnection
client.on("close", () => {
  console.log("🔴 Disconnected from MQTT Broker");
});
