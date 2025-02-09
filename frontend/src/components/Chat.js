import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import "./chat.css";

const ENDPOINT =
  "https://real-time-chat-app-backend-1prx4u75t-akshay-arellis-projects.vercel.app"; // Define endpoint
const socket = io(ENDPOINT);

export const Chat = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    socket.emit("join", user.username);

    // Fetch all users excluding the current user
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${ENDPOINT}/users`, {
          // Use endpoint variable
          params: { currentUser: user.username },
        });
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };

    fetchUsers();

    // Listen for incoming messages
    socket.on("receive_message", (data) => {
      if (data.sender === currentChat || data.receiver === currentChat) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [currentChat, user.username]); // Add user.username to dependency array

  const fetchMessages = async (receiver) => {
    try {
      const { data } = await axios.get(`${ENDPOINT}/messages`, {
        // Use endpoint variable
        params: { sender: user.username, receiver },
      });

      if (Array.isArray(data.messages)) {
        // Check if data.messages is an array
        setMessages(data.messages);
      } else {
        console.error("Invalid data format received:", data);
        setMessages([]); // Or a default message
      }

      setCurrentChat(receiver);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const sendMessage = () => {
    if (currentMessage.trim() !== "") {
      //check if the message is empty
      const messageData = {
        sender: user.username,
        receiver: currentChat,
        message: currentMessage,
      };
      socket.emit("send_message", messageData);
      setMessages((prev) => [...prev, messageData]);
      setCurrentMessage("");
    }
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {user.username}</h2>
      <div className="chat-list">
        <h3>Chats</h3>
        {users.map((u) => (
          <div
            key={u._id}
            className={`chat-user ${
              currentChat === u.username ? "active" : ""
            }`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}
          </div>
        ))}
      </div>
      {currentChat && (
        <div className="chat-window">
          <h5>You are chatting with {currentChat}</h5>
          <MessageList messages={messages} user={user} />
          <div className="message-field">
            <input
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              style={{ minWidth: "400px" }}
              onChange={(e) => setCurrentMessage(e.target.value)}
            />
            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
