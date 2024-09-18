import React, { useState, useEffect } from 'react';
import './Chatbox.css'; // Custom CSS for chatbox styles

const Chatbox = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const handleBotResponse = (response) => {
            setMessages(prevMessages => [...prevMessages, { type: 'bot', content: response }]);
        };

        window.api.receiveBotResponse(handleBotResponse);

        return () => {
            window.api.removeAllListeners('bot-response');
        };
    }, []);


    const handleSendMessage = async () => {
        if (inputValue.trim()) {
            // Add the user message to the chatbox
            setMessages(prevMessages => [...prevMessages, { type: 'user', content: inputValue }]);

            try {
                // Send the user input to the backend and wait for the response
                let botResponse = await window.api.sendUserInput(inputValue); // sendUserInput returns a promise

                if (!botResponse) {
                    botResponse = "Sorry, I can't help you with that. :)"; // Default response
                }
                // Add the bot response to the chatbox
                setMessages(prevMessages => [...prevMessages, { type: 'bot', content: botResponse }]);
            } catch (err) {
                console.error('Error sending user input:', err);
            }
            // Clear the input field
            setInputValue('');
        }
    };

    return (
        <div className="chatbox">
            <div className="chatbox-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chatbox-message ${msg.type}`}>
                        {msg.content}
                    </div>
                ))}
            </div>
            <div className="chatbox-input">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                        }
                    }}
                />
                <button className="send-btn" onClick={handleSendMessage}> &#x2191;</button>
            </div>
        </div>
    );
};

export default Chatbox;