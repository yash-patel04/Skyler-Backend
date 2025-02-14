const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category_name: String,
  categories: [
    {
      videoSrc: String,
      title: String,
      clickEvent: String,
      btnName: String,
      words: [
        {
          word: String,
          clickEvent: String,
        },
      ],
    },
  ],
});

// module.exports = mongoose.model("Category", categorySchema);

module.exports = (skylerDB) => skylerDB.model("Category", categorySchema);
