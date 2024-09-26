import React, { useState, useEffect } from 'react';
import './Chatbox.css';

class EditHistory {
    constructor(maxHistory = 10) {
        this.videoHistory = [];
        this.audioHistory = [];
        this.maxHistory = maxHistory;
    }

    addVideoEdit(path) {
        this.videoHistory.push(path);
        if (this.videoHistory.length > this.maxHistory) {
            const oldestEdit = this.videoHistory.shift();
            // TODO: Implement file deletion
            // window.api.deleteFile(oldestEdit);
        }
    }

    addAudioEdit(path) {
        this.audioHistory.push(path);
        if (this.audioHistory.length > this.maxHistory) {
            const oldestEdit = this.audioHistory.shift();
            // TODO: Implement file deletion
            // window.api.deleteFile(oldestEdit);
        }
    }

    getCurrentVideoPaths() {
        return this.videoHistory[this.videoHistory.length - 1] || null;
    }

    getCurrentAudioPaths() {
        return this.audioHistory[this.audioHistory.length - 1] || null;
    }

    undoVideo() {
        if (this.videoHistory.length > 1) {
            this.videoHistory.pop();
            return this.getCurrentVideoPaths();
        }
        return null;
    }

    undoAudio() {
        if (this.audioHistory.length > 1) {
            this.audioHistory.pop();
            return this.getCurrentAudioPaths();
        }
        return null;
    }
}

const getInputOutputPaths = (video, editHistory) => {
    return {
        video: {
            input: editHistory.getCurrentVideoPaths() || window.api.pathJoin(video.dirLocation, video.name),
            output: window.api.pathJoin(video.dirLocation, "edits", "video", `${editHistory.videoHistory.length + 1}`)
        },
        audio: {
            input: editHistory.getCurrentAudioPaths() || window.api.pathJoin(video.dirLocation, video.name.replace('.mp4', '.mp3')),
            output: window.api.pathJoin(video.dirLocation, "edits", "audio", `${editHistory.audioHistory.length + 1}`)
        }
    };
};

const Chatbox = ({ video }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editHistory] = useState(() => new EditHistory(10));
    const [isAutoMode, setIsAutoMode] = useState(false);

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

    const handleSendMessage = async () => {
        if (inputValue.trim() && video) {
            setMessages(prevMessages => [...prevMessages, { type: 'user', content: inputValue }]);
            setInputValue('');
            setIsLoading(true);

            try {
                const extractedResults = await window.api.sendUserInput(inputValue);

                if (!extractedResults){
                    setMessages(prevMessages => [...prevMessages, { type: 'bot', content: "Sorry, can't help you with that! :)" }]);
                    setInputValue('');
                    setIsLoading(false);
                    return;
                }

                const isMissingArgs = Object.values(extractedResults.functionArgs).some(arg => arg === "None" || arg === null);
                const shouldPromptUser = !isAutoMode || isMissingArgs;
                let botResponse;
                if (isMissingArgs) {
                    botResponse = `Missings required values while executing the action:`;
                }
                else{
                    botResponse = `Executing the action:`;
                }

                if (shouldPromptUser) {
                    setMessages(prevMessages => [
                        ...prevMessages,
                        {
                            type: 'bot',
                            content: (
                                <BotMessageContent
                                    botResponse={botResponse}
                                    extractedResults={extractedResults}
                                    handleArgChange={handleArgChange}
                                    handleConfirmExecution={(args) => handleConfirmExecution(extractedResults, args)}
                                    isLoading={isLoading}
                                    handleCancelExecution={handleCancelExecution}
                                    executionResult={false}
                                />
                            ),
                        },
                    ]);
                } else {
                    setMessages(prevMessages => [
                        ...prevMessages,
                        {
                            type: 'bot',
                            content: `Auto-executing the action ${extractedResults.functionName || 'Unknown Function'}`,
                        },
                    ]);
                    await handleConfirmExecution(extractedResults, extractedResults.functionArgs);
                }
            } catch (err) {
                console.error('Error sending user input:', err);
                setIsLoading(false);
            }
        }
    };

    const handleArgChange = (argKey, newValue, extractedResults) => {
        const updatedExtractedResults = {
            ...extractedResults,
            functionArgs: {
                ...extractedResults.functionArgs,
                [argKey]: newValue === '' ? null : newValue
            }
        };

        setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            lastMessage.content = (
                <BotMessageContent
                    {...lastMessage.content.props}
                    extractedResults={updatedExtractedResults}
                />
            );
            return updatedMessages;
        });
    };

    const handleConfirmExecution = async (extractedResults, args) => {
        setIsLoading(true);
        try {
            const paths = getInputOutputPaths(video, editHistory);
            const response = await window.api.executeFunction({ ...extractedResults, functionArgs: args }, paths);

            if (response.videoEdited) {
                editHistory.addVideoEdit(response.paths.video.output);
            }
            if (response.audioEdited) {
                editHistory.addAudioEdit(response.paths.audio.output);
            }
            setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                lastMessage.content = (
                    <BotMessageContent
                        {...lastMessage.content.props}
                        extractedResults={extractedResults}
                        executionResult={response.message}
                        executionStatus={response.status}
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

    const handleCancelExecution = () => {
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
        setIsLoading(false);
    };

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
    <div className="input-wrapper">
        <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                    e.preventDefault(); // Prevents default newline when hitting Enter
                    handleSendMessage();
                }
            }}
            rows={2} // Start with a single line
            disabled={isLoading}
            className="chatbox-textarea"
        />
        {isLoading ? (
            <div className="loading-indicator"></div>
        ) : (
            <button className="send-btn" onClick={handleSendMessage} disabled={isLoading}>
                &#x2191;
            </button>
        )}
    </div>
    <label className="auto-mode">
        <input
            type="checkbox"
            checked={isAutoMode}
            onChange={(e) => setIsAutoMode(e.target.checked)}
        />
        Auto
    </label>
</div>


           
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
        <p>{botResponse}<strong> {extractedResults?.functionName || 'Unknown Function'}</strong></p>
        {!executionResult && (
            <div className="args-list">
                {Object.entries(extractedResults.functionArgs).map(([argKey, argValue]) => (
                    <div key={argKey} className="arg-item">
                        <label>{argKey}: </label>
                        <input
                            type="text"
                            value={argValue === null || argValue === undefined ? '' : String(argValue)}
                            onChange={(e) => handleArgChange(argKey, e.target.value, extractedResults)}
                        />
                    </div>
                ))}
            </div>
        )}
        {!executionResult && (
            <div className="action-buttons">
                <button
                    className="confirm-btn"
                    onClick={() => handleConfirmExecution(extractedResults.functionArgs)} 
                    disabled={isLoading}
                >
                    &#x2714;
                </button>
                <button
                    className="cancel-btn"
                    onClick={handleCancelExecution}
                    disabled={isLoading}
                >
                    &#x2716;
                </button>
            </div>
        )}
        {executionResult && (
            <div className={`execution-result ${executionStatus}`}>
                <pre>{executionResult}</pre>
            </div>
        )}
        {isLoading && <div className="loading-indicator"></div>}
    </div>
);

export default Chatbox;
