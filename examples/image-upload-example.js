// Example: How to upload an image using the new endpoint
// This shows students how to call the /api/upload/image endpoint

// Function to upload an image and get the full URL
async function uploadImage(imageFile, type = "post") {
  try {
    // Create FormData to send the file
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("type", type); // "profile" or "post"

    // Get the JWT token (you need to implement this based on your auth system)
    const token = localStorage.getItem("token"); // or however you store your JWT

    // Make the API call
    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, it's set automatically
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const result = await response.json();

    // result.url contains the full URL of the uploaded image
    console.log("Image uploaded successfully:", result.url);
    return result.url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Example usage in a React component
function ImageUploadComponent() {
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file, "post");
      setImageUrl(url);
      console.log("Image uploaded:", url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isUploading}
      />
      {isUploading && <p>Uploading...</p>}
      {imageUrl && (
        <div>
          <p>Uploaded image:</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </div>
  );
}

// Example usage in vanilla JavaScript
function uploadImageVanillaJS() {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  if (file) {
    uploadImage(file, "profile")
      .then((url) => {
        console.log("Profile image uploaded:", url);
        // Use the URL as needed
      })
      .catch((error) => {
        console.error("Upload failed:", error);
      });
  }
}

// Example with fetch and FormData (alternative approach)
async function uploadImageAlternative(imageFile, type = "post") {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("type", type);

  const token = localStorage.getItem("token");

  const response = await fetch("/api/upload/image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.url; // Returns the full image URL
}

// Example of how to use the returned URL in a post
async function createPostWithImage(imageFile, postContent) {
  try {
    // First upload the image
    const imageUrl = await uploadImage(imageFile, "post");

    // Then create the post with the image URL
    const postData = {
      content: postContent,
      imageUrl: imageUrl, // Use the returned URL
      // other post data...
    };

    // Make API call to create post
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error("Failed to create post");
    }

    console.log("Post created with image:", imageUrl);
  } catch (error) {
    console.error("Error creating post:", error);
  }
}
