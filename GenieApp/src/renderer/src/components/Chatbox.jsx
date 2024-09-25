import React, { useState, useEffect } from 'react';
import './Chatbox.css';

const Chatbox = ({ video }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [functionArgs, setFunctionArgs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleBotResponse = (response) => {
            setMessages(prevMessages => [...prevMessages, { type: 'bot', content: response }]);
            setIsLoading(false);
        };

        window.api.receiveBotResponse(handleBotResponse);

        return () => {
            window.api.removeAllListeners('bot-response');
        };
    }, []);

    const getInputOutputPaths = () => {
        let input_path;
        const output_path = window.api.pathJoin(video.dirLocation, "edits", `${video.numEdits + 1}.mp4`);

        if (video.numEdits === 0) {
            input_path = window.api.pathJoin(video.dirLocation, video.name);
        } else {
            input_path = window.api.pathJoin(video.dirLocation,"edits", `${video.numEdits}.mp4`);
        }

        return { input_path, output_path };
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() && video) {
            setMessages(prevMessages => [...prevMessages, { type: 'user', content: inputValue }]);
            setInputValue('');
            setIsLoading(true);

            try {
                
                const extractedResults = await window.api.sendUserInput(inputValue);

                const botResponse = `Executing the action:`;

                setFunctionArgs({ ...extractedResults.functionArgs });

                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        type: 'bot',
                        content: (
                            <BotMessageContent
                                botResponse={botResponse}
                                extractedResults={extractedResults}
                                handleArgChange={handleArgChange}
                                handleConfirmExecution={(args) => handleConfirmExecution(extractedResults,args)}
                                isLoading={isLoading}
                                handleCancelExecution={handleCancelExecution}
                            />
                        ),
                    },
                ]);
            } catch (err) {
                console.error('Error sending user input:', err);
                setIsLoading(false);
            }
        }
    };

    const handleArgChange = (argKey, newValue) => {
        setFunctionArgs(prevArgs => ({
            ...prevArgs,
            [argKey]: newValue
        }));
    };

    const handleConfirmExecution = async (extractedResults,args) => {
        setIsLoading(true);
        console.log("before asfasf", extractedResults)
        console.log("after asfasf", { ...extractedResults, functionArgs: args });
        try {
            const { input_path, output_path } = getInputOutputPaths();
            const resultsMessage = await window.api.executeFunction({ ...extractedResults, functionArgs: args }, input_path, output_path);

            setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                lastMessage.content = (
                    <BotMessageContent
                        {...lastMessage.content.props}
                        executionResult={resultsMessage.message}
                        executionStatus={resultsMessage.status}
                        isLoading={false}
                    />
                );
                return updatedMessages;
            });
        } catch (err) {
            console.error('Error executing function:', err);
            setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                lastMessage.content = (
                    <BotMessageContent
                        {...lastMessage.content.props}
                        executionResult={`Error executing function: ${err.message}`}
                        executionStatus="error"
                        isLoading={false}
                    />
                );
                return updatedMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelExecution =()=>{
        setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                lastMessage.content = (
                    <BotMessageContent
                        {...lastMessage.content.props}
                        executionResult={"Cancelled!"}
                        executionStatus="error"
                        isLoading={false}
                    />
                );
                return updatedMessages;
            });
        setIsLoading(false)
    }
    return (
        <div className="chatbox">
            <div className="chatbox-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chatbox-message ${msg.type}`}>
                        {typeof msg.content === 'string' ? msg.content : msg.content}
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
                <button className="send-btn" onClick={handleSendMessage}>&#x2191;</button>
            </div>
            {isLoading && <div className="loading-indicator"></div>}
        </div>
    );
};

const BotMessageContent = ({ 
    botResponse, 
    extractedResults, 
    handleArgChange, 
    handleConfirmExecution, 
    isLoading, 
    executionResult,
    executionStatus,
    handleCancelExecution,
}) => (
    <div className="bot-message">
        <p>{botResponse}<strong> {extractedResults.functionName}</strong></p>
        {!executionResult && (
            <div className="args-list">
                {Object.keys(extractedResults.functionArgs).map(argKey => (
                    <div key={argKey} className="arg-item">
                        <label>{argKey}: </label>
                        <input
                            type="text"
                            value={extractedResults.functionArgs[argKey]}
                            onChange={(e) => handleArgChange(argKey, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        )}
        {!executionResult && (
            <div className="action-buttons">
                <button
                    className="confirm-btn"
                    onClick={handleConfirmExecution(extractedResults.functionArgs)}
                    disabled={isLoading}
                >
                    Proceed &#x2714;
                </button>
                <button
                    className="cancel-btn"
                    onClick={handleCancelExecution}
                    disabled={isLoading}
                >
                    Cancel &#x2716;
                </button>
            </div>
        )}
        {executionResult && (
            <div className={`execution-result ${executionStatus}`}>
                {/* <h4>{executionStatus === 'success' ? 'Execution Results:' : 'Execution Error:'}</h4> */}
                <pre>{executionResult}</pre>
            </div>
        )}
        {isLoading && <div className="loading-indicator"></div>}
    </div>
);

export default Chatbox;
