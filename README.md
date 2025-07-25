# ConnectHub

A social media platform built with Next.js, Convex, and TypeScript.

## Features

- User authentication and profiles
- Post creation with text and images
- Like and comment functionality
- User following system
- Real-time updates with Convex
- Image upload support

## Image Upload API

### New Simplified Endpoint: `/api/upload/image`

This endpoint allows students to easily upload images and get the full URL in a single request.

#### Usage

**Endpoint:** `POST /api/upload/image`

**Headers:**

- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: multipart/form-data` (automatically set)

**Body (FormData):**

- `image`: The image file to upload
- `type`: Either "profile" or "post"

**Response:**

```json
{
  "success": true,
  "url": "https://your-convex-storage-url.com/image.jpg",
  "storageId": "storage_id_from_convex",
  "type": "post"
}
```

#### Example Usage

```javascript
// Upload an image and get the full URL
async function uploadImage(imageFile, type = "post") {
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
    throw new Error("Upload failed");
  }

  const result = await response.json();
  return result.url; // Full image URL
}

// Usage example
const fileInput = document.getElementById("imageInput");
const file = fileInput.files[0];

if (file) {
  uploadImage(file, "post")
    .then((url) => {
      console.log("Image uploaded:", url);
      // Use the URL in your application
    })
    .catch((error) => {
      console.error("Upload failed:", error);
    });
}
```

#### Validation

The endpoint includes the following validations:

- File must be an image (MIME type starts with "image/")
- File size must be less than 10MB
- Type must be either "profile" or "post"
- Valid JWT token required

#### Error Responses

```json
{
  "error": "Image file is required"
}
```

```json
{
  "error": "File must be an image"
}
```

```json
{
  "error": "File size must be less than 10MB"
}
```

```json
{
  "error": "Type must be 'profile' or 'post'"
}
```

## Other Available Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Posts

- `GET /api/posts/feed` - Get posts feed
- `POST /api/posts` - Create a new post
- `GET /api/posts/[id]` - Get a specific post
- `POST /api/posts/[id]/like` - Like a post
- `POST /api/posts/[id]/unlike` - Unlike a post

### Comments

- `GET /api/posts/[id]/comments` - Get comments for a post
- `POST /api/posts/[id]/comments` - Add a comment to a post
- `DELETE /api/posts/[id]/comments/[commentId]` - Delete a comment

### Users

- `GET /api/users/search` - Search users
- `GET /api/users/[id]` - Get user profile
- `POST /api/users/[id]/follow` - Follow a user
- `POST /api/users/[id]/unfollow` - Unfollow a user
- `GET /api/users/me/followers` - Get user's followers
- `GET /api/users/me/following` - Get users being followed

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `env.example`)
4. Run the development server: `npm run dev`

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_URL=your_convex_url
JWT_SECRET=your_jwt_secret
```

## Technologies Used

- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Convex (database, real-time, file storage)
- **Authentication:** JWT
- **Styling:** CSS Modules
- **Deployment:** Vercel

## File Structure

```
connecthub/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── posts/         # Post-related endpoints
│   │   ├── upload/        # File upload endpoints
│   │   └── users/         # User-related endpoints
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── convex/                # Convex backend
│   ├── _generated/        # Generated types
│   ├── comments.ts        # Comment functions
│   ├── files.ts           # File handling functions
│   ├── posts.ts           # Post functions
│   ├── schema.ts          # Database schema
│   ├── social.ts          # Social features
│   └── users.ts           # User functions
├── examples/              # Usage examples
└── lib/                   # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
