# ConnectHub Backend

A Next.js backend for ConnectHub, a social platform built with Convex.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Required environment variables:

- `JWT_SECRET`: Secret key for JWT tokens
- `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL

3. Run the development server:

```bash
npm run dev
```

## API Documentation

### Authentication

#### Register User

- **POST** `/api/auth/register`
- Body:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- Response:
  ```json
  {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```

#### Login

- **POST** `/api/auth/login`
- Body:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- Response:
  ```json
  {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string"
    }
  }
  ```

### Users

#### Get Current User

- **GET** `/api/users/me`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "avatarUrl": "string",
    "followersCount": "number",
    "followingCount": "number",
    "recentPosts": []
  }
  ```

#### Get User Profile

- **GET** `/api/users/:id`
- Response:
  ```json
  {
    "id": "string",
    "name": "string",
    "avatarUrl": "string",
    "followersCount": "number",
    "followingCount": "number",
    "recentPosts": []
  }
  ```

#### Follow User

- **POST** `/api/users/:id/follow`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true
  }
  ```

#### Unfollow User

- **DELETE** `/api/users/:id/unfollow`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true
  }
  ```

### Posts

#### Get Feed

- **GET** `/api/posts/feed`
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - `cursor`: string (optional)
  - `limit`: number (optional, default: 10)
- Response:
  ```json
  {
    "posts": [],
    "cursor": "string"
  }
  ```

#### Create Post

- **POST** `/api/posts`
- Headers: `Authorization: Bearer <token>`
- Body:
  ```json
  {
    "text": "string",
    "imageUrl": "string"
  }
  ```
- Response:
  ```json
  {
    "id": "string"
  }
  ```

#### Get Post

- **GET** `/api/posts/:id`
- Response:
  ```json
  {
    "id": "string",
    "text": "string",
    "imageUrl": "string",
    "createdAt": "number",
    "likesCount": "number",
    "comments": [],
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string"
    }
  }
  ```

#### Delete Post

- **DELETE** `/api/posts/:id`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true
  }
  ```

### Likes

#### Like Post

- **POST** `/api/posts/:id/like`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true
  }
  ```

#### Unlike Post

- **DELETE** `/api/posts/:id/unlike`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true
  }
  ```

### Comments

#### Get Comments

- **GET** `/api/posts/:id/comments`
- Query Parameters:
  - `cursor`: string (optional)
  - `limit`: number (optional, default: 10)
- Response:
  ```json
  {
    "comments": [],
    "cursor": "string"
  }
  ```

#### Create Comment

- **POST** `/api/posts/:id/comments`
- Headers: `Authorization: Bearer <token>`
- Body:
  ```json
  {
    "text": "string"
  }
  ```
- Response:
  ```json
  {
    "id": "string"
  }
  ```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:

```json
{
  "error": "string"
}
```

## Security

- All POST/PUT/DELETE endpoints require Bearer token authentication
- Passwords are hashed using bcrypt
- JWT tokens are stored in HTTP-only cookies
- Rate limiting is implemented for post creation
- Input validation is performed on all endpoints
