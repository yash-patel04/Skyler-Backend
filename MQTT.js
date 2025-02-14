const mqtt = require('mqtt');
const { messageEmitter } = require("./auth");
// MQTT Broker (HiveMQ Cloud)
const mqttServer = "mqtts://3b2168521a3c446b855086fe0db38168.s1.eu.hivemq.cloud:8883";
const mqttUser = "Yash_patel";   
const mqttPassword = "YashPateL0@";  
const clientId = "NodeJS_Client";  

// MQTT Connection Options
const options = {
  clientId: clientId,
  username: mqttUser,
  password: mqttPassword,
  rejectUnauthorized: false,    
};

// Connect to MQTT Broker
console.log("🔄 Connecting to MQTT...");
const client = mqtt.connect(mqttServer, options);

// MQTT Topic
const topic = "Skyler";

client.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");

  // Subscribe to a topic
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`📩 Subscribed to topic: ${topic}`);
      console.log( messageEmitter);
    } else {
      console.error(`❌ Subscription failed: ${err.message}`);
    }
  });
  // Publish a message every 5 seconds
  // setInterval(() => {
  //   // console.log("receivedMessage:",receivedMessage);
  //   const message = "receivedMessage";
  //   // console.log("📡 Publishing Message...");
    
  // }, 5000);
});

messageEmitter.on("newMessage", (message) => {
  console.log("📡 Publishing new MQTT message:", 9+message);
  client.publish(topic, message);
});

// Handle Incoming Messages
client.on("message", (topic, message) => {
  console.log(`📬 Message received on topic: ${topic}`);
  console.log(`📝 Message: ${message.toString()}`);
});

// Handle Errors
client.on("error", (err) => {
  console.error(`❌ MQTT Connection Error: ${err.message}`);
});

// Handle Disconnection
client.on("close", () => {
  console.log("🔴 Disconnected from MQTT Broker");
});
