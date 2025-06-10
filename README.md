# ConnectHub API Documentation

Base URL: `https://connecthub-three.vercel.app`

## Table of Contents

- [Authentication](#authentication)
- [Authentication Endpoints](#authentication-endpoints)
- [User Endpoints](#user-endpoints)
- [Post Endpoints](#post-endpoints)
- [Error Handling](#error-handling)

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**

- 201: User created successfully
- 400: Invalid input
- 409: Email already exists
- 500: Internal server error

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

- 200: Login successful, returns JWT token
- 401: Invalid credentials
- 500: Internal server error

## User Endpoints

### Get Current User

```http
GET /api/users/me
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Returns user data
- 401: Unauthorized
- 404: User not found
- 500: Internal server error

### Get User by ID

```http
GET /api/users/:id
```

**Response:**

- 200: Returns user data
- 404: User not found
- 500: Internal server error

### Follow User

```http
POST /api/users/:id/follow
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Successfully followed user
- 401: Unauthorized
- 404: User not found
- 500: Internal server error

### Unfollow User

```http
POST /api/users/:id/unfollow
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Successfully unfollowed user
- 401: Unauthorized
- 404: User not found
- 500: Internal server error

## Post Endpoints

### Create Post

```http
POST /api/posts
```

**Headers:**

- Authorization: Bearer token required

**Request Body:**

```json
{
  "text": "string",
  "imageUrl": "string" // optional
}
```

**Response:**

- 201: Post created successfully
- 401: Unauthorized
- 500: Internal server error

### Get Post Feed

```http
GET /api/posts/feed
```

**Headers:**

- Authorization: Bearer token required

**Query Parameters:**

- cursor: string (optional) - for pagination
- limit: number (optional) - default 10

**Response:**

- 200: Returns array of posts with user info
- 401: Unauthorized
- 500: Internal server error

### Get Post by ID

```http
GET /api/posts/:id
```

**Response:**

- 200: Returns post data with user info
- 404: Post not found
- 500: Internal server error

### Delete Post

```http
DELETE /api/posts/:id
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Post deleted successfully
- 401: Unauthorized
- 403: Not authorized to delete this post
- 404: Post not found
- 500: Internal server error

### Like Post

```http
POST /api/posts/:id/like
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Post liked successfully
- 401: Unauthorized
- 404: Post not found
- 409: Already liked
- 500: Internal server error

### Unlike Post

```http
POST /api/posts/:id/unlike
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Post unliked successfully
- 401: Unauthorized
- 404: Post not found
- 500: Internal server error

### Create Comment

```http
POST /api/posts/:id/comments
```

**Headers:**

- Authorization: Bearer token required

**Request Body:**

```json
{
  "text": "string"
}
```

**Response:**

- 201: Comment created successfully
- 401: Unauthorized
- 404: Post not found
- 500: Internal server error

### Get Comments

```http
GET /api/posts/:id/comments
```

**Query Parameters:**

- cursor: string (optional) - for pagination
- limit: number (optional) - default 10

**Response:**

- 200: Returns array of comments with user info
- 404: Post not found
- 500: Internal server error

### Delete Comment

```http
DELETE /api/posts/:id/comments/:commentId
```

**Headers:**

- Authorization: Bearer token required

**Response:**

- 200: Comment deleted successfully
- 401: Unauthorized
- 403: Not authorized to delete this comment
- 404: Comment not found
- 500: Internal server error

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Data Models

### User

```typescript
{
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
}
```

### Post

```typescript
{
  id: string;
  userId: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
  likesCount: number;
  commentsCount: number;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  }
}
```

### Comment

```typescript
{
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: number;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  }
}
```

