## ✨ Features

### 🔐 Authentication
- Simple username-only login (no password required)
- Session-based authentication
- Protected routes for creating/editing content

### 📝 Post Management
- **View Posts:** Display posts from newest to oldest
- **Create Post:** Authenticated users can create new posts
- **Edit/Delete:** Users can only modify their own posts
- **Post Details:** Full post view with comments section
- **Search:** Search by post topic
- **Filter:** Category-based filtering (Food, Pets, Health, etc.)

### 💬 Comments
- Single-level commenting system (no nested replies)
- Edit/delete own comments
- Mobile-responsive comment modal

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate user and receive access token

### Posts
- `GET /api/v1/posts` - Get all posts with pagination and filtering
- `POST /api/v1/posts` - Create a new post
- `GET /api/v1/posts/{id}` - Get a post by ID
- `PATCH /api/v1/posts/{id}` - Update a post (owner only)
- `DELETE /api/v1/posts/{id}` - Delete a post (owner only)

### Comments
- `GET /api/v1/comments` - Get all comments with pagination and filtering
- `POST /api/v1/comments` - Create a new comment
- `GET /api/v1/comments/{id}` - Get a comment by ID
- `PATCH /api/v1/comments/{id}` - Update a comment (owner only)
- `DELETE /api/v1/comments/{id}` - Delete a comment (owner only)
- `GET /api/v1/posts/{postId}/comments` - Get all comments for a specific post
- `POST /api/v1/posts/{postId}/comments` - Create a new comment on a specific post

### Query Parameters
- `search` - Search posts by title/content
- `category` - Filter by category
- `page` - Pagination
- `limit` - Items per page

## 🧪 Testing

### Test Coverage
- **Posts CRUD operations:**
- **Comments CRUD operations:**
- **Authentication flow:**
- **Input validation:**
- **Error handling:**

## 🎨 Design System

### Color Palette
```css
/* Main Colors */
--green-500: #243831;    /* Dark primary background */
--green-300: #2B5F44;    /* Main button/action color */
--green-100: #D1FAE5;    /* Light background/cards */
--golden: #C5A365;       /* Accent elements/highlight */

/* Base Colors */
--black: #000000;        /* Background or bold text */
--white: #FFFFFF;        /* Page background or containers */
--text: #191919;         /* Body text */
--grey-100: #BBC2C0;     /* Light border/input background */
--grey-300: #939494;     /* Secondary/muted UI text */
--success: #49A569;      /* Success states/messages/buttons */
```

## 🏗 Architecture

### Frontend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Pages/Routes  │────│   Components    │────│   API Layer     │
│   (App Router)  │    │   (Reusable)    │    │   (Axios)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   State Mgmt    │
                    │ (React Query +  │
                    │  Local State)   │
                    └─────────────────┘
```

### Backend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │────│    Services     │────│   Repository    │
│   (HTTP Layer)  │    │ (Business Logic)│    │   (Data Layer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│   Middleware    │──────────────┘
                        │ (Auth, Validation,│
                        │  Error Handling) │
                        └─────────────────┘
```

### Database Schema
```sql
User {
  id: String (Primary Key)
  username: String (Unique)
  createdAt: DateTime
}

Post {
  id: String (Primary Key)
  title: String
  content: String
  category: String
  authorId: String (Foreign Key)
  createdAt: DateTime
  updatedAt: DateTime
}

Comment {
  id: String (Primary Key)
  content: String
  postId: String (Foreign Key)
  authorId: String (Foreign Key)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🔍 Error Handling

### Backend Error Handling
- **Validation Errors:** Detailed field-level validation messages
- **Authentication Errors:** Clear unauthorized access messages
- **Not Found Errors:** Specific resource not found messages
- **Server Errors:** Graceful error responses with logging

### Frontend Error Handling
- **Form Validation:** Real-time validation with user-friendly messages
- **API Errors:** Toast notifications for failed requests
- **Network Errors:** Retry mechanisms and offline indicators
- **404 Pages:** Custom not found pages with navigation

## Testing

### How to test backend

- Make sure to have the database running with `.env` file configured as `.env.example`
- Run `pnpm test` to run the unit tests
- Run `pnpm test:cov` to run the unit tests with coverage
- Run `pnpm test:e2e` to run the tests

### Testing Results

![Unit Tests](./test-results/unit-test-coverage.png)

![E2E Tests](./test-results/e2e-test.png)

