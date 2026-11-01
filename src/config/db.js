const {default: mongoose}= require("mongoose");

exports.dbConfig = async () => {
  try {
     await mongoose.connect(process.env.DB_URL);

    console.log("Database connection success");
  } catch (error) {
    console.log(error.message || "Database connection failed");
  }
};