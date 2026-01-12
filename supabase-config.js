/* SUPABASE CONFIGURATION  CODE*/

/* Initialize Supabase client */
const SUPABASE_URL = "https://fhkdxybcksiqjuwrejxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoa2R4eWJja3NpcWp1d3Jlanh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ5NzAsImV4cCI6MjA4MTcyMDk3MH0.uup9WamTYj8b6NFnQrlpfPzAFNozVnseDv_TT0iXcL0";
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* AUTH FUNCTIONS  */

async function signUp(email, password, name) {
  const { data: authData, error: authError } = await _supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: name, 
      },
    },
  });

  if (authError) {
    throw authError;
  }

  return authData;
}

async function signIn(email, password) {
  const { data, error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await _supabase.auth.signOut();
  if (error) throw error;
}

async function getCurrentUser() {
  const {
    data: { user },
  } = await _supabase.auth.getUser();
  return user;
}

async function getUserRole(userId) {
  const { data, error } = await _supabase
    .from("users")
    .select("role")
    .eq("id", userId);

  if (error) {
    return null;
  }
  return data && data.length > 0 ? data[0].role : null;
}

async function onAuthChange(callback) {
  const {
    data: { subscription },
  } = _supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });

  const {
    data: { session },
  } = await _supabase.auth.getSession();

  callback(session?.user || null);
  return subscription;
}

/* Returns error message based on the Supabase  */
function getFriendlyErrorMessage(error) {
  if (!error) return "An unexpected error occurred. Please try again.";

  const message = error.message || "";

  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (message.includes("Email already registered")) {
    return "This email is already registered";
  }
  if (message.includes("valid email")) {
    return "Please enter a valid email address";
  }
  return message || "An unexpected error occurred";
}

/* USER FUNCTIONS */

async function getAllUsers() {
  const { data, error } = await _supabase.from("users").select("*");
  if (error) throw error;
  return data;
}

async function getUserProfile(userId) {
  const { data, error } = await _supabase
    .from("users")
    .select("*")
    .eq("id", userId);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

/* CROP FUNCTIONS */

async function getAllCrops() {
  const { data, error } = await _supabase
    .from("crops")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getCropById(cropId) {
  const { data, error } = await _supabase
    .from("crops")
    .select("*")
    .eq("id", cropId);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function createCrop(cropData) {
  const { data, error } = await _supabase
    .from("crops")
    .insert([cropData])
    .select();
  if (error) throw error;
  return data[0];
}

async function updateCrop(cropId, cropData) {
  const { data, error } = await _supabase
    .from("crops")
    .update(cropData)
    .eq("id", cropId);
  if (error) {
    throw error;
  }
  return data;
}

async function deleteCrop(cropId) {
  const { error } = await _supabase.from("crops").delete().eq("id", cropId);
  if (error) {
    throw error;
  }
}

/* IMAGE UPLOAD FUNCTIONS */

async function uploadCropImage(file, cropName) {
  const fileName =
    cropName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  const filePath = `${fileName}`;

  const { data, error } = await _supabase.storage
    .from("crops")
    .upload(filePath, file);

  if (error) throw error;

  const {
    data: { publicUrl },
  } = _supabase.storage.from("crops").getPublicUrl(filePath);

  return publicUrl;
}

async function deleteImage(image_url) {
  console.log("Attempting to delete image with URL:", image_url);
  if (!image_url) {
    console.log("No image URL provided, skipping deletion");
    return;
  }
  try {
    // Extract file path from URL
    const urlObj = new URL(image_url);
    const pathSegments = urlObj.pathname.split("/");
    const filePath = pathSegments[pathSegments.length - 1];
    console.log("Extracted file path:", filePath);

    const { error } = await _supabase.storage.from("crops").remove([filePath]);

    if (error) {
      console.error("Could not delete image:", error);
    } else {
      console.log("Image deleted successfully");
    }
  } catch (e) {
    console.error("Error parsing image URL for deletion:", e);
  }
}

/* COMMENT FUNCTIONS */

async function getAllComments() {
  const { data, error } = await _supabase
    .from("comments")
    .select("*, users(name), crops(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getCommentsByCrop(cropId) {
  const { data, error } = await _supabase
    .from("comments")
    .select("*, users(name), crops(name)")
    .eq("crop_id", cropId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function addComment(commentData) {
  const { data, error } = await _supabase
    .from("comments")
    .insert([commentData])
    .select();
  if (error) throw error;
  return data[0];
}

async function getUserComments(userId) {
  const { data, error } = await _supabase
    .from("comments")
    .select("*, users(name), crops(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function addReply(commentId, replyData) {
  console.log(
    "Attempting to add reply to comment ID:",
    commentId,
    "Reply data:",
    replyData
  );

  const { data: comments, error: fetchError } = await _supabase
    .from("comments")
    .select("replies")
    .eq("id", commentId);
  const comment = comments && comments.length > 0 ? comments[0] : null;

  if (fetchError) {
    console.error("Error fetching comment for reply:", fetchError);
    throw fetchError;
  }

  console.log("Fetched comment replies:", comment.replies);
  const updatedReplies = [...(comment.replies || []), replyData];
  console.log("Updated replies:", updatedReplies);

  const { error: updateError } = await _supabase
    .from("comments")
    .update({ replies: updatedReplies })
    .eq("id", commentId);

  if (updateError) {
    console.error("Error updating comment with reply:", updateError);
    throw updateError;
  }
  console.log("Reply added successfully");
}

async function deleteCommentsByCrop(cropId) {
  const { error } = await _supabase
    .from("comments")
    .delete()
    .eq("crop_id", cropId);
  if (error) throw error;
}
