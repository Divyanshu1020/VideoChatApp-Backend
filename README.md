# Chat Application Backend

A robust Node.js backend server powering a real-time chat application with secure authentication and database management.

## 🚀 Features

- **Real-time Communication** using Socket.IO
- **Secure Authentication** with JWT
- **Database Management** with MongoDB
- **File Storage** using Cloudinary
- **RESTful API** built with Express.js
- **Input Validation** and error handling

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT
- Cloudinary
- Mongoose

## 🏗️ Installation

1. Clone the repository:
```bash
git clone <your-backend-repo-url>
```

2. Install dependencies:
```bash
cd chat-app-backend
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```env
PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Start the server:
```bash
npm start
```


## 🔒 Security

- JWT authentication
- Password hashing
- Input validation
- Rate limiting
- CORS configuration

## 🎯 Future Plans

- Implement WebRTC for P2P video/audio calls
- Add message encryption
- Implement offline message queueing

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

[MIT](https://choosealicense.com/licenses/mit/)