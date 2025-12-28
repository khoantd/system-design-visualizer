import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
  Layers,
  Code2,
  Server,
} from 'lucide-react';
import { generateC4ComponentFromSpec } from '../services/analysisService';

const FRONTEND_OPTIONS = [
  { id: 'reactjs', label: 'React.js', description: 'Component-based UI library' },
  { id: 'vuejs', label: 'Vue.js', description: 'Progressive JavaScript framework' },
];

const BACKEND_OPTIONS = [
  { id: 'nodejs', label: 'Node.js', description: 'Express/NestJS backend' },
  { id: 'python-fastapi', label: 'Python FastAPI', description: 'Modern Python web framework' },
];

const SpecToComponentPanel = ({ onGenerate, onClose }) => {
  const [specification, setSpecification] = useState('');
  const [frontendTech, setFrontendTech] = useState('reactjs');
  const [backendTech, setBackendTech] = useState('nodejs');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showFrontendDropdown, setShowFrontendDropdown] = useState(false);
  const [showBackendDropdown, setShowBackendDropdown] = useState(false);

  const handleGenerate = async () => {
    if (!specification.trim()) {
      setError('Please enter a functional specification');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await generateC4ComponentFromSpec(
        specification,
        frontendTech,
        backendTech
      );
      
      if (result && result.nodes && result.nodes.length > 0) {
        onGenerate(result);
      } else {
        setError('Failed to generate components. Please try again with more details.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate component diagram');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedFrontend = FRONTEND_OPTIONS.find(opt => opt.id === frontendTech);
  const selectedBackend = BACKEND_OPTIONS.find(opt => opt.id === backendTech);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-secondary)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-secondary)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--accent-purple)',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Spec to C4 Component
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Convert functional specification to component design
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-black/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Specification Input */}
          <div>
            <label
              className="flex items-center gap-2 text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              Functional Specification
            </label>
            <textarea
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="Describe your system requirements, features, and functionality...

Example:
- User authentication with OAuth2 (Google, GitHub)
- Product catalog with search and filtering
- Shopping cart with real-time updates
- Order processing with payment integration
- Admin dashboard for inventory management"
              rows={8}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Technology Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Frontend Selection */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Code2 className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
                Frontend Technology
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFrontendDropdown(!showFrontendDropdown);
                    setShowBackendDropdown(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{selectedFrontend?.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFrontendDropdown ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
                {showFrontendDropdown && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 shadow-xl"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-secondary)',
                    }}
                  >
                    {FRONTEND_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setFrontendTech(option.id);
                          setShowFrontendDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-black/5 transition-colors"
                        style={{
                          backgroundColor: frontendTech === option.id ? 'var(--bg-tertiary)' : 'transparent',
                        }}
                      >
                        <div
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {option.label}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Backend Selection */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Server className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
                Backend Technology
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBackendDropdown(!showBackendDropdown);
                    setShowFrontendDropdown(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{selectedBackend?.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showBackendDropdown ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
                {showBackendDropdown && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 shadow-xl"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-secondary)',
                    }}
                  >
                    {BACKEND_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setBackendTech(option.id);
                          setShowBackendDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-black/5 transition-colors"
                        style={{
                          backgroundColor: backendTech === option.id ? 'var(--bg-tertiary)' : 'transparent',
                        }}
                      >
                        <div
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {option.label}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
              }}
            >
              {error}
            </div>
          )}

          {/* C4 Component Info */}
          <div
            className="px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <div className="flex items-start gap-3">
              <Sparkles
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                style={{ color: 'var(--accent-purple)' }}
              />
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  C4 Component View
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Generates a component-level diagram showing the internal structure of your system,
                  including UI components, services, controllers, repositories, and their interactions
                  based on your selected technology stack.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-secondary)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !specification.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent-purple)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate C4 Components
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecToComponentPanel;
