# ConnectHub API Documentation

**Base URL:** `https://connecthub-three.vercel.app`

## Table of Contents

- [Authentication](#authentication)
- [CORS Support](#cors-support)
- [Rate Limiting](#rate-limiting)
- [Image Upload API](#image-upload-api)
- [Authentication Endpoints](#authentication-endpoints)
- [User Endpoints](#user-endpoints)
- [Post Endpoints](#post-endpoints)
- [Comment Endpoints](#comment-endpoints)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## CORS Support

All endpoints support CORS and include the following headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Rate Limiting

- **POST requests:** 100 requests per 15 minutes per IP
- **Other requests:** No rate limiting
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

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

---

## Authentication Endpoints

### Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Create a new user account

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Example Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**

```json
{
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "All fields are required"
  }
  ```

  ```json
  {
    "error": "Email already registered"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Failed to create user"
  }
  ```
  ```json
  {
    "error": "Failed to fetch created user"
  }
  ```
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Example Request:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**

```json
{
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Email and password are required"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid credentials"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Get current user's profile information

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Success Response (200):**

```json
{
  "id": "user_id_here",
  "name": "John Doe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Software developer and tech enthusiast",
  "createdAt": 1640995200000,
  "followersCount": 15,
  "followingCount": 8,
  "postsCount": 25,
  "recentPosts": []
}
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **404 Not Found:**

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Update current user's profile information

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string (optional)",
  "avatarUrl": "string (optional)",
  "bio": "string (optional)",
  "storageId": "string (optional)"
}
```

**Example Request:**

```json
{
  "name": "John Smith",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "bio": "Software developer and tech enthusiast"
}
```

**Example Request with File Upload:**

```json
{
  "name": "John Smith",
  "storageId": "storage_id_from_upload",
  "bio": "Software developer and tech enthusiast"
}
```

**Success Response (200):**

```json
{
  "id": "user_id_here",
  "name": "John Smith",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "bio": "Software developer and tech enthusiast",
  "createdAt": 1640995200000,
  "followersCount": 15,
  "followingCount": 8,
  "postsCount": 25,
  "recentPosts": []
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "At least one field (name, avatarUrl, bio, or storageId) is required"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Failed to update profile"
  }
  ```
  ```json
  {
    "error": "Failed to fetch updated profile"
  }
  ```
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

## User Endpoints

### Get Current User

**Endpoint:** `GET /api/users/me`

**Description:** Get current user's information

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Success Response (200):**

```json
{
  "id": "user_id_here",
  "name": "John Doe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Software developer and tech enthusiast",
  "createdAt": 1640995200000,
  "followersCount": 15,
  "followingCount": 8,
  "postsCount": 25,
  "recentPosts": []
}
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **404 Not Found:**

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Search Users

**Endpoint:** `GET /api/users/search`

**Description:** Search users by name or username (partial match)

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Query Parameters:**

- `query` (string, optional): The name or username to search. If not provided, returns all users
- `limit` (number, optional): Number of results to return (default: 10, max: 100)

**Example Requests:**

```
GET /api/users/search?query=duraan&limit=5
GET /api/users/search?limit=20
GET /api/users/search
```

**Success Response (200):**

```json
[
  {
    "id": "user_123",
    "name": "Duraan Ali",
    "username": "durali",
    "avatar": "https://cdn.connecthub.app/avatars/durali.jpg",
    "bio": "Frontend developer and mentor",
    "is_following": true
  },
  {
    "id": "user_124",
    "name": "Durrah Noor",
    "username": "durrah",
    "avatar": null,
    "bio": "",
    "is_following": false
  }
]
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Limit must be a number between 1 and 100"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Authentication required"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get User by ID

**Endpoint:** `GET /api/users/{id}`

**Description:** Get another user's public profile

**Parameters:**

- `id` (path parameter, required): User ID of the profile to fetch

**Headers:**

```
Authorization: Bearer <jwt_token> (optional)
```

**Example Request:**

```
GET /api/users/user_123
```

**Success Response (200):**

```json
{
  "id": "user_123",
  "name": "Duraan Ali",
  "username": "durali",
  "avatar": "https://cdn.connecthub.app/avatars/durali.jpg",
  "bio": "Frontend developer and mentor",
  "followers_count": 52,
  "following_count": 17,
  "is_following": true
}
```

**Error Responses:**

- **404 Not Found:**

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get My Following List

**Endpoint:** `GET /api/users/me/following`

**Description:** Get list of users that the current user is following

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Success Response (200):**

```json
[
  {
    "id": "user_id_1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": "https://example.com/avatar1.jpg",
    "bio": "UX Designer and coffee lover",
    "username": "jane"
  },
  {
    "id": "user_id_2",
    "name": "Bob Smith",
    "email": "bob@example.com",
    "avatarUrl": "",
    "bio": "",
    "username": "bob"
  }
]
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get My Followers List

**Endpoint:** `GET /api/users/me/followers`

**Description:** Get list of users who are following the current user

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Success Response (200):**

```json
[
  {
    "id": "user_id_1",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "avatarUrl": "https://example.com/avatar1.jpg",
    "bio": "Full-stack developer and open source contributor",
    "username": "alice"
  },
  {
    "id": "user_id_2",
    "name": "Charlie Brown",
    "email": "charlie@example.com",
    "avatarUrl": "",
    "bio": "",
    "username": "charlie"
  }
]
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Follow User

**Endpoint:** `POST /api/users/{id}/follow`

**Description:** Follow another user

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): User ID to follow

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Cannot follow yourself"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **404 Not Found:**

  ```json
  {
    "error": "User to follow not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Already following this user"
  }
  ```
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Unfollow User

**Endpoint:** `POST /api/users/{id}/unfollow`

**Description:** Unfollow another user

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): User ID to unfollow

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Cannot unfollow yourself"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **404 Not Found:**

  ```json
  {
    "error": "User to unfollow not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get User Following List

**Endpoint:** `GET /api/users/{id}/following`

**Description:** Get list of users that the specified user is following

**Parameters:**

- `id` (path parameter, required): User ID

**Success Response (200):**

```json
[
  {
    "id": "user_id_1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": "https://example.com/avatar1.jpg",
    "bio": "UX Designer and coffee lover"
  },
  {
    "id": "user_id_2",
    "name": "Bob Smith",
    "email": "bob@example.com",
    "avatarUrl": "",
    "bio": ""
  }
]
```

**Error Responses:**

- **404 Not Found:**

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

## Post Endpoints

### Create Post

**Endpoint:** `POST /api/posts`

**Description:** Create a new post

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
Content-Type: application/json
```

**Request Body:**

```json
{
  "text": "string (required)",
  "image_url": "string (optional)",
  "storageId": "string (optional)"
}
```

**Example Request:**

```json
{
  "text": "Hello world! This is my first post.",
  "image_url": "https://example.com/image.jpg"
}
```

**Example Request with File Upload:**

```json
{
  "text": "Hello world! This is my first post.",
  "storageId": "storage_id_from_upload"
}
```

**Success Response (201):**

```json
{
  "_id": "post_id_here",
  "userId": "user_id_here",
  "text": "Hello world! This is my first post.",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": 1640995200000
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Text is required"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Already liked this post"
  }
  ```
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get All Posts

**Endpoint:** `GET /api/posts`

**Description:** Get all posts with user information (public)

**Headers:**

- `Authorization: Bearer <jwt_token>` (optional): If provided, includes `likedByUser` field indicating if the current user has liked each post

**Success Response (200):**

```json
[
  {
    "id": "post_id_here",
    "text": "Hello world!",
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": 1640995200000,
    "likesCount": 5,
    "commentsCount": 3,
    "likedByUser": true,
    "user": {
      "id": "user_id_here",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg",
      "bio": "Software developer and tech enthusiast"
    }
  }
]
```

**Error Responses:**

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get User Feed

**Endpoint:** `GET /api/posts/feed`

**Description:** Get posts from users that the current user is following

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Success Response (200):**

```json
[
  {
    "id": "post_id_here",
    "userId": "user_id_here",
    "text": "Hello world!",
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": 1640995200000,
    "likesCount": 5,
    "commentsCount": 3,
    "likedByUser": true,
    "user": {
      "id": "user_id_here",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg",
      "bio": "Software developer and tech enthusiast"
    }
  }
]
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

```json
{
  "error": "Authentication required"
}
```

```json
{
  "error": "Invalid token"
}
```

```json
{
  "error": "User not found"
}
```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Get Post by ID

**Endpoint:** `GET /api/posts/{id}`

**Description:** Get a specific post by ID

**Headers:**

- `Authorization: Bearer <jwt_token>` (optional): If provided, includes `likedByUser` field indicating if the current user has liked the post

**Parameters:**

- `id` (path parameter, required): Post ID

**Success Response (200):**

```json
{
  "id": "post_id_here",
  "userId": "user_id_here",
  "text": "Hello world!",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": 1640995200000,
  "likesCount": 5,
  "commentsCount": 3,
  "likedByUser": true,
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "Software developer and tech enthusiast"
  }
}
```

**Error Responses:**

- **404 Not Found:**

  ```json
  {
    "error": "Post not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Delete Post

**Endpoint:** `DELETE /api/posts/{id}`

**Description:** Delete a post (only by the post author)

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): Post ID to delete

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **403 Forbidden:**

  ```json
  {
    "error": "Unauthorized"
  }
  ```

- **404 Not Found:**

  ```json
  {
    "error": "Post not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Like Post

**Endpoint:** `POST /api/posts/{id}/like`

**Description:** Like a post

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): Post ID to like

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Already liked this post"
  }
  ```
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Unlike Post

**Endpoint:** `POST /api/posts/{id}/unlike`

**Description:** Unlike a post

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): Post ID to unlike

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

## Comment Endpoints

### Get Post Comments

**Endpoint:** `GET /api/posts/{id}/comments`

**Description:** Get comments for a specific post

**Parameters:**

- `id` (path parameter, required): Post ID
- `cursor` (query parameter, optional): Pagination cursor
- `limit` (query parameter, optional): Number of comments to return (default: 10)

**Example Request:**

```
GET /api/posts/post_123/comments?limit=20&cursor=comment_456
```

**Success Response (200):**

```json
[
  {
    "_id": "comment_id_here",
    "postId": "post_id_here",
    "userId": "user_id_here",
    "text": "Great post!",
    "createdAt": 1640995200000,
    "user": {
      "id": "user_id_here",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg",
      "bio": "Software developer and tech enthusiast"
    }
  }
]
```

**Error Responses:**

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Create Comment

**Endpoint:** `POST /api/posts/{id}/comments`

**Description:** Create a comment on a post

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
Content-Type: application/json
```

**Parameters:**

- `id` (path parameter, required): Post ID

**Request Body:**

```json
{
  "text": "string (required)"
}
```

**Example Request:**

```json
{
  "text": "This is a great post!"
}
```

**Success Response (201):**

```json
{
  "_id": "comment_id_here",
  "postId": "post_id_here",
  "userId": "user_id_here",
  "text": "This is a great post!",
  "createdAt": 1640995200000
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Text is required"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Post not found"
  }
  ```
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Delete Comment

**Endpoint:** `DELETE /api/posts/{id}/comments/{commentId}`

**Description:** Delete a comment (only by the comment author)

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): Post ID
- `commentId` (path parameter, required): Comment ID to delete

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

  ```json
  {
    "error": "User not found"
  }
  ```

- **403 Forbidden:**

  ```json
  {
    "error": "Unauthorized to delete this comment"
  }
  ```

- **404 Not Found:**

  ```json
  {
    "error": "Comment not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

## Image Upload Endpoints

### Generate Upload URL

**Endpoint:** `POST /api/upload`

**Description:** Generate a pre-signed upload URL for file uploads

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
Content-Type: application/json
```

**Request Body:**

```json
{
  "type": "profile" | "post"
}
```

**Example Request:**

```json
{
  "type": "profile"
}
```

**Success Response (200):**

```json
{
  "uploadUrl": "https://upload-url-here"
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Type must be 'profile' or 'post'"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### Save Uploaded File

**Endpoint:** `POST /api/upload/save`

**Description:** Save an uploaded file and get the final URL

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
Content-Type: application/json
```

**Request Body:**

```json
{
  "storageId": "string (required)",
  "type": "profile" | "post"
}
```

**Example Request:**

```json
{
  "storageId": "storage_id_here",
  "type": "profile"
}
```

**Success Response (200):**

```json
{
  "storageId": "storage_id_here",
  "url": "https://final-image-url-here"
}
```

**Error Responses:**

- **400 Bad Request:**

  ```json
  {
    "error": "Storage ID is required"
  }
  ```

  ```json
  {
    "error": "Type must be 'profile' or 'post'"
  }
  ```

  ```json
  {
    "error": "File not found"
  }
  ```

- **401 Unauthorized:**

  ```json
  {
    "error": "Invalid authorization header format"
  }
  ```

  ```json
  {
    "error": "Authentication required"
  }
  ```

  ```json
  {
    "error": "Invalid token"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

## Error Handling

All endpoints return consistent error responses with the following structure:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Error Response Examples

**Authentication Errors:**

```json
{
  "error": "Invalid authorization header format"
}
```

```json
{
  "error": "Authentication required"
}
```

```json
{
  "error": "Invalid token"
}
```

**Validation Errors:**

```json
{
  "error": "All fields are required"
}
```

```json
{
  "error": "Text is required"
}
```

**Business Logic Errors:**

```json
{
  "error": "Cannot follow yourself"
}
```

```json
{
  "error": "Already following this user"
}
```

```json
{
  "error": "Already liked this post"
}
```

---

## Data Models

### User Object

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatarUrl": "string",
  "bio": "string",
  "username": "string",
  "createdAt": "number",
  "followersCount": "number",
  "followingCount": "number",
  "postsCount": "number",
  "recentPosts": "array"
}
```

### Post Object

```json
{
  "id": "string",
  "userId": "string",
  "text": "string",
  "imageUrl": "string",
  "createdAt": "number",
  "likesCount": "number",
  "commentsCount": "number",
  "likedByUser": "boolean",
  "user": "User Object"
}
```

### Comment Object

```json
{
  "id": "string",
  "postId": "string",
  "userId": "string",
  "text": "string",
  "createdAt": "number",
  "user": "User Object"
}
```

### Authentication Response

```json
{
  "user": "User Object",
  "token": "string"
}
```

---

## Complete API Summary

### Authentication (4 endpoints)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update current user profile

### Users (9 endpoints)

- `GET /api/users/me` - Get current user info
- `GET /api/users/search` - Search users
- `GET /api/users/{id}` - Get public user profile
- `GET /api/users/me/following` - Get users I'm following
- `GET /api/users/me/followers` - Get users following me
- `POST /api/users/{id}/follow` - Follow a user
- `POST /api/users/{id}/unfollow` - Unfollow a user
- `GET /api/users/{id}/following` - Get user's following list

### Posts (6 endpoints)

- `POST /api/posts` - Create post
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/{id}` - Get specific post
- `DELETE /api/posts/{id}` - Delete post
- `POST /api/posts/{id}/like` - Like post
- `POST /api/posts/{id}/unlike` - Unlike post

### Comments (3 endpoints)

- `GET /api/posts/{id}/comments` - Get post comments
- `POST /api/posts/{id}/comments` - Create comment
- `DELETE /api/posts/{id}/comments/{commentId}` - Delete comment

### Image Upload (3 endpoints)

- `POST /api/upload/image` - **NEW**: Upload image and get full URL
- `POST /api/upload` - Generate upload URL
- `POST /api/upload/save` - Save uploaded file

**Total: 25 API endpoints** covering authentication, user management, social features, posts, comments, and image uploads.
