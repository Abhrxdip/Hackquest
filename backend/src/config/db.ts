const supabase = require("./supabase");

async function connectDB() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);

    // PGRST116 means no rows, which is still a successful connection.
    if (error && error.code !== "PGRST116") {
      throw error;
    }

    console.log("Supabase connected");
  } catch (error) {
    console.error("Supabase connection error:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
