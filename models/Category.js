import mongoose from "mongoose";

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

export default (skylerDB) => skylerDB.model("Category", categorySchema);
