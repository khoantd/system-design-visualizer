import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { sendChatMessage, quickAnalysisPrompts } from '../services/chatService';

const AIChatPanel = ({ 
  nodes, 
  edges, 
  onApplyActions,
  isOpen,
  onToggle 
}) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI architecture assistant. I can help you analyze your system design, identify potential issues, and suggest improvements. Ask me anything about your diagram!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [pendingActions, setPendingActions] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setPendingActions(null);

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const result = await sendChatMessage(messageText, nodes, edges, chatHistory);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        actions: result.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (result.actions && result.actions.length > 0) {
        setPendingActions(result.actions);
      }
    } catch (error) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyActions = () => {
    if (pendingActions && onApplyActions) {
      onApplyActions(pendingActions);
      setPendingActions(null);
      
      const confirmMessage = {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: `✅ Applied ${pendingActions.length} action(s) to the diagram.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setShowQuickPrompts(false);
    handleSendMessage(prompt);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all hover:scale-105 z-50"
        style={{
          backgroundColor: 'var(--accent-blue)',
          boxShadow: 'var(--accent-blue-glow)',
        }}
        title="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 w-[420px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-secondary)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-secondary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: 'var(--accent-blue)',
              boxShadow: 'var(--accent-blue-glow)',
            }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              AI Architecture Assistant
            </h3>
            <p
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Analyze & modify your diagram
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-500' : ''
              }`}
              style={message.role === 'assistant' ? {
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
              } : {}}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
              }`}
              style={{
                backgroundColor: message.role === 'user' 
                  ? 'var(--accent-blue)' 
                  : 'var(--bg-secondary)',
                color: message.role === 'user' 
                  ? 'white' 
                  : 'var(--text-primary)',
                border: message.role === 'assistant' 
                  ? '1px solid var(--border-primary)' 
                  : 'none',
              }}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
              {message.actions && message.actions.length > 0 && (
                <div
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {message.actions.length} suggested action(s)
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {message.actions.slice(0, 3).map((action, idx) => (
                      <div
                        key={idx}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {action.type === 'addNode' && `Add: ${action.label}`}
                        {action.type === 'removeNode' && `Remove: ${action.nodeId}`}
                        {action.type === 'addEdge' && `Connect: ${action.source} → ${action.target}`}
                        {action.type === 'removeEdge' && `Disconnect: ${action.edgeId}`}
                        {action.type === 'updateNode' && `Update: ${action.nodeId}`}
                      </div>
                    ))}
                    {message.actions.length > 3 && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        +{message.actions.length - 3} more...
                      </span>
                    )}
                  </div>
                </div>
              )}
              <span
                className="text-[10px] mt-1 block"
                style={{ color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <Bot className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div
              className="rounded-2xl rounded-tl-md px-4 py-3"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-blue)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Analyzing...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Pending Actions Bar */}
      {pendingActions && pendingActions.length > 0 && (
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-secondary)',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {pendingActions.length} action(s) ready to apply
            </span>
          </div>
          <button
            onClick={handleApplyActions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-emerald)',
            }}
          >
            <Play className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      {showQuickPrompts && (
        <div
          className="px-4 py-3 border-t"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-secondary)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Quick Analysis
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAnalysisPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(item.prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-secondary)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: showQuickPrompts ? 'var(--bg-tertiary)' : 'transparent',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Quick prompts
            {showQuickPrompts ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your architecture..."
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm outline-none"
            style={{
              color: 'var(--text-primary)',
              minHeight: '24px',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: inputValue.trim() ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
              color: inputValue.trim() ? 'white' : 'var(--text-muted)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
