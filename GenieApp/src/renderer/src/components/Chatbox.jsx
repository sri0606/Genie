import React, { useState, useEffect,  forwardRef, useImperativeHandle, useCallback } from 'react';
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

const Chatbox = forwardRef(({ video, onVideoUpdate }, ref) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editHistory] = useState(() => new EditHistory(10));
    const [isAutoMode, setIsAutoMode] = useState(false);

    useImperativeHandle(ref, () => ({
        setMessages: (messages) => {
            setMessages(messages);
        },
        getMessages: () => {
            return messages;
        },
    }));

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

    const updateVideoPath = (newPath) => {
        const updatedVideo = { ...video, current: { ...video.current, videoPath: newPath } };
        onVideoUpdate(updatedVideo);
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() && video) {
            setMessages(prevMessages => [...prevMessages, { type: 'user', content: inputValue }]);
            setInputValue('');

            try {
                const extractedResults = await window.api.sendUserInput(inputValue);

                console.log("extracted", extractedResults);

                if (!extractedResults || extractedResults.actions.length === 0) {
                    setMessages(prevMessages => [
                        ...prevMessages, 
                        { type: 'bot', content: extractedResults.message }
                    ]);
                    setIsLoading(false);
                    return;
                }

                // Add the initial bot message
                setMessages(prevMessages => [
                    ...prevMessages,
                    { type: 'bot', content: { props: { botResponse: extractedResults.message, actions: extractedResults.actions, video, editHistory, updateVideoPath, isAutoMode } } }
                ]);

            } catch (err) {
                console.error('Error sending user input:', err);
                setIsLoading(false);
            }
        }
    };

    const updateIsLoading = (isLoading) => {
        setIsLoading(isLoading);
    }
    
    return (
        <div className="chatbox">
            <div className="chatbox-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chatbox-message ${msg.type}`}>
                        {msg.type === 'bot' && typeof msg.content !== 'string' ? (
                            <BotMessageContent
                                botResponse={msg.content.props.botResponse}
                                actions={msg.content.props.actions}
                                video={video}
                                editHistory={editHistory}
                                updateVideoPath={updateVideoPath}
                                isAutoMode={isAutoMode}
                                updateIsLoading={updateIsLoading}
                            />
                        ) : (
                            msg.content
                        )}
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
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        rows={2}
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
});


const BotMessageContent = ({ 
    botResponse, 
    actions: initialActions,
    video,
    editHistory, 
    updateVideoPath,
    isAutoMode,
    updateIsLoading
}) => {
    const [actionComponents, setActionComponents] = useState([]);


    const handleExecuteNextAction = useCallback((index) => {
        setActionComponents(prevComponents => {
            if (index < prevComponents.length) {
                return prevComponents.map((component, idx) => 
                    idx === index 
                        ? React.cloneElement(component, { startExecute: true })
                        : component
                );
            } else {
                updateIsLoading(false);
                return prevComponents;
            }
        });
    }, []);

    const handlePromptNextAction = useCallback((index) => {
        console.log('Current actionComponents:', actionComponents, index);
        if (isAutoMode) {
            handleExecuteNextAction(index);
            return;
        }
        
        setActionComponents(prevComponents => {
            console.log('Previous components:', prevComponents);
            if (index < prevComponents.length) {
                return prevComponents.map((component, idx) => 
                    idx === index
                        ? React.cloneElement(component, { showArgs: true })
                        : component
                );
            } else {
                console.log('Index out of bounds for actionComponents');
                updateIsLoading(false);
                return prevComponents;
            }
        });
    }, [isAutoMode])

    useEffect(() => {
        updateIsLoading(true);
        if (initialActions && initialActions.length > 0) {
            const components = initialActions.map((action, index) => (
                <Action 
                    key={index}
                    index={index} 
                    action={action} 
                    video={video} 
                    editHistory={editHistory}
                    promptNextAction={handlePromptNextAction}
                    executeNextAction={handleExecuteNextAction}
                    updateVideoPath={updateVideoPath}
                    showArgs={!isAutoMode && index === 0}
                    startExecute={isAutoMode && index === 0}
                />
            ));
            setActionComponents(components);
        } else {
            updateIsLoading(false);
        }
    }, [initialActions]);

    return (
        <div className="bot-message">
            <p>{botResponse}</p>
            <div className="actions-list">
                {actionComponents} 
            </div>
        </div>
    );
};

const Action = ({ 
    index, 
    action, 
    video, 
    editHistory, 
    promptNextAction, 
    executeNextAction, 
    updateVideoPath, 
    showArgs, 
    startExecute,
    
}) => {
    const [status, setStatus] = useState(showArgs ? 'pending' : 'notStarted');
    const [args, setArgs] = useState(action.args || {});
    const [executionResult, setExecutionResult] = useState(null);

    const handleArgChange = (argKey, newValue) => {
        setArgs(prevArgs => ({ ...prevArgs, [argKey]: newValue }));
    };

    useEffect(() => {
        if (showArgs) {
            setStatus('pending');
        }
    }, [showArgs]);

    useEffect(() => {
        if (startExecute) {
            executeAction();
        }
    }, [startExecute]);

    const handleConfirmExecution = () => {
        executeAction();
    };

    const handleCancelExecution = () => {
        setStatus("cancelled");
        setExecutionResult(`${action.action} cancelled.`);
        promptNextAction(index + 1);
    };

    const executeAction = async () => {
        setStatus("executing");
        console.log('Executing action', action);
        try {
            const paths = getInputOutputPaths(video, editHistory);
            const response = await window.api.executeFunction({ ...action, args }, paths);

            if (response.videoEdited) {
                const filename = window.api.pathBasename(response.paths.video.output);
                const newVideoPath = window.api.pathJoinURL(video.dirURL, "edits", "video", filename);
                updateVideoPath(newVideoPath);
                editHistory.addVideoEdit(response.paths.video.output);
            }
            if (response.audioEdited) {
                editHistory.addAudioEdit(response.paths.audio.output);
            }

            setExecutionResult(response.message);
            setStatus(response.status); 

        } catch (err) {
            setExecutionResult(`Error: ${err.message}`);
            setStatus("error");
            console.error('Error executing function:', err);
        } finally {
            
            promptNextAction(index + 1);
        }
    };

    return (
        <div className="action-item">
            <span>
                {status === "success" && (
                    <span className="status success">
                        <span className="icon">✅</span> {executionResult}
                    </span>
                )}
                {(status === "error" || status === "cancelled") && (
                    <span className="status error">
                        <span className="icon">❌</span> {executionResult}
                    </span>
                )}
                {status === "pending" && (
                    <span className="status pending">
                        <span className="icon pending-icon">⏳</span> Execute <i>{action.action}?</i>
                    </span>
                )}
                {status === "executing" && (
                    <span className="status executing">
                        <span className="icon executing-icon">↺</span> Executing <i>{action.action}</i>
                    </span>
                )}
                {status === "notStarted" && (
                    <span className="status not-started">
                        <span className="icon">•</span> <i>{action.action}</i>
                    </span>
                )}
            </span>
            {status === "pending" && (
                <div className="args-list">
                    {Object.entries(args).map(([argKey, argValue]) => (
                        <div key={argKey} className="arg-item">
                            <label>{argKey}: </label>
                            <input
                                type="text"
                                value={argValue === null || argValue === undefined ? '' : String(argValue)}
                                onChange={(e) => handleArgChange(argKey, e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="action-buttons">
                        <button
                            className="confirm-btn"
                            onClick={handleConfirmExecution}
                            disabled={status !== "pending"} 
                        >
                            &#x2714;
                        </button>
                        <button
                            className="cancel-btn"
                            onClick={handleCancelExecution}
                            disabled={status !== "pending"}
                        >
                            &#x2716;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Chatbox;
