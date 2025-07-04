# ConnectHub API Documentation

**Base URL:** `https://connecthub-three.vercel.app`

## Table of Contents

- [Authentication](#authentication)
- [CORS Support](#cors-support)
- [Rate Limiting](#rate-limiting)
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
  "createdAt": 1640995200000,
  "followersCount": 15,
  "followingCount": 8,
  "postsCount": 25,
  "recentPosts": [
    {
      "id": "post_id_here",
      "text": "Hello world!",
      "imageUrl": "",
      "createdAt": 1640995200000
    }
  ]
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
  "avatarUrl": "string (optional)"
}
```

**Example Request:**

```json
{
  "name": "John Smith",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Success Response (200):**

```json
{
  "id": "user_id_here",
  "name": "John Smith",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/new-avatar.jpg",
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
    "error": "At least one field (name or avatarUrl) is required"
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

### Get User by ID

**Endpoint:** `GET /api/users/{id}`

**Description:** Get public user information by user ID

**Parameters:**

- `id` (path parameter, required): User ID

**Success Response (200):**

```json
{
  "id": "user_id_here",
  "name": "John Doe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": 1640995200000,
  "followersCount": 15,
  "followingCount": 8,
  "postsCount": 25,
  "recentPosts": []
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
    "avatarUrl": "https://example.com/avatar1.jpg"
  },
  {
    "id": "user_id_2",
    "name": "Bob Smith",
    "email": "bob@example.com",
    "avatarUrl": ""
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
  "image_url": "string (optional)"
}
```

**Example Request:**

```json
{
  "text": "Hello world! This is my first post.",
  "image_url": "https://example.com/image.jpg"
}
```

**Success Response (201):**

```json
{
  "id": "post_id_here",
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
    "error": "Internal server error"
  }
  ```

---

### Get All Posts

**Endpoint:** `GET /api/posts`

**Description:** Get all posts from all users (public endpoint)

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
    "user": {
      "id": "user_id_here",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg"
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

### Get Post by ID

**Endpoint:** `GET /api/posts/{id}`

**Description:** Get a specific post by ID

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
  "comments": [
    {
      "id": "comment_id_here",
      "postId": "post_id_here",
      "userId": "user_id_here",
      "text": "Great post!",
      "createdAt": 1640995200000,
      "user": {
        "id": "user_id_here",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://example.com/avatar.jpg"
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

- `id` (path parameter, required): Post ID

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
    "error": "Unauthorized to delete this post"
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

- `id` (path parameter, required): Post ID

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

- **404 Not Found:**

  ```json
  {
    "error": "Post not found"
  }
  ```

- **409 Conflict:**

  ```json
  {
    "error": "Already liked this post"
  }
  ```

- **500 Internal Server Error:**
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

- `id` (path parameter, required): Post ID

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

## Comment Endpoints

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
  "text": "Great post! Thanks for sharing."
}
```

**Success Response (201):**

```json
{
  "id": "comment_id_here",
  "postId": "post_id_here",
  "userId": "user_id_here",
  "text": "Great post! Thanks for sharing.",
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

### Get Comments

**Endpoint:** `GET /api/posts/{id}/comments`

**Description:** Get all comments for a post

**Parameters:**

- `id` (path parameter, required): Post ID

**Query Parameters:**

- `cursor` (optional): Pagination cursor
- `limit` (optional): Number of comments to return (default: 10)

**Success Response (200):**

```json
[
  {
    "id": "comment_id_here",
    "postId": "post_id_here",
    "userId": "user_id_here",
    "text": "Great post!",
    "createdAt": 1640995200000,
    "user": {
      "id": "user_id_here",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
]
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

### Delete Comment

**Endpoint:** `DELETE /api/posts/{id}/comments/{commentId}`

**Description:** Delete a comment (only by the comment author)

**Headers:**

```
Authorization: Bearer <jwt_token> (required)
```

**Parameters:**

- `id` (path parameter, required): Post ID
- `commentId` (path parameter, required): Comment ID

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

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Status Code | Description           | Common Use Cases                                  |
| ----------- | --------------------- | ------------------------------------------------- |
| 200         | OK                    | Successful GET, PUT, DELETE operations            |
| 201         | Created               | Successful POST operations (create)               |
| 400         | Bad Request           | Invalid input data, missing required fields       |
| 401         | Unauthorized          | Missing or invalid authentication token           |
| 403         | Forbidden             | Authenticated but not authorized for the action   |
| 404         | Not Found             | Resource doesn't exist                            |
| 409         | Conflict              | Resource already exists (e.g., already following) |
| 429         | Too Many Requests     | Rate limit exceeded                               |
| 500         | Internal Server Error | Server-side error                                 |

### Common Error Messages

| Error Message                         | Status Code | Description                             |
| ------------------------------------- | ----------- | --------------------------------------- |
| "All fields are required"             | 400         | Missing required fields in request body |
| "Email already registered"            | 400         | Email is already in use                 |
| "Invalid authorization header format" | 401         | Authorization header is malformed       |
| "Authentication required"             | 401         | Missing Authorization header            |
| "Invalid token"                       | 401         | JWT token is invalid or expired         |
| "User not found"                      | 401/404     | User doesn't exist                      |
| "Unauthorized to delete this post"    | 403         | User doesn't own the post               |
| "Unauthorized to delete this comment" | 403         | User doesn't own the comment            |
| "Post not found"                      | 404         | Post doesn't exist                      |
| "Comment not found"                   | 404         | Comment doesn't exist                   |
| "Already following this user"         | 409         | User is already being followed          |
| "Already liked this post"             | 409         | Post is already liked                   |
| "Too Many Requests"                   | 429         | Rate limit exceeded                     |
| "Internal server error"               | 500         | Unexpected server error                 |

---

## Data Models

### User Object

```typescript
{
  id: string;                    // User ID
  name: string;                  // User's display name
  email: string;                 // User's email address
  avatarUrl: string;             // User's avatar URL (empty string if none)
  createdAt: number;             // Timestamp when user was created
  followersCount: number;        // Number of followers
  followingCount: number;        // Number of users being followed
  postsCount: number;            // Number of posts created
  recentPosts: Post[];           // Array of recent posts (max 10)
}
```

### Post Object

```typescript
{
  id: string; // Post ID
  text: string; // Post content
  imageUrl: string; // Post image URL (empty string if none)
  createdAt: number; // Timestamp when post was created
  likesCount: number; // Number of likes
  commentsCount: number; // Number of comments
  user: {
    // User who created the post
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  }
}
```

### Comment Object

```typescript
{
  id: string; // Comment ID
  postId: string; // ID of the post being commented on
  userId: string; // ID of the user who made the comment
  text: string; // Comment content
  createdAt: number; // Timestamp when comment was created
  user: {
    // User who made the comment
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  }
}
```

### Authentication Response

```typescript
{
  user: {
    // User information
    id: string;
    name: string;
    email: string;
  }
  token: string; // JWT token for authentication
}
```

---

## Development Notes

- All timestamps are in milliseconds since Unix epoch
- All string fields return empty strings instead of null/undefined
- All numeric fields return 0 instead of null/undefined
- All array fields return empty arrays instead of null/undefined
- CORS is enabled for all origins
- Rate limiting applies only to POST requests
- JWT tokens expire after 7 days
