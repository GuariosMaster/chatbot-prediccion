import React from 'react';
import Message from './Message';

const MessageList = ({ messages }) => {
  return (
    <div className="messages-container">
      {messages.map((message, index) => (
        <Message 
          key={message.id || index} 
          message={message} 
          isUser={message.sender_type === 'user'} 
        />
      ))}
    </div>
  );
};

export default MessageList;