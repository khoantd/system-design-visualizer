/**
 * Search and Filter Component
 * Allows searching nodes by name/description/tech and filtering by type
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Server, Database, Smartphone, Globe, Layers, User, Box } from 'lucide-react';
import { useSearch } from '../hooks/useDiagram';

const NODE_TYPES = [
  { id: null, label: 'All Types', icon: Filter },
  { id: 'serverNode', label: 'Server', icon: Server },
  { id: 'databaseNode', label: 'Database', icon: Database },
  { id: 'clientNode', label: 'Client', icon: Smartphone },
  { id: 'loadBalancerNode', label: 'Load Balancer', icon: Globe },
  { id: 'cacheNode', label: 'Cache', icon: Layers },
  { id: 'userNode', label: 'User', icon: User },
  { id: 'subflowNode', label: 'Subflow', icon: Box },
];

export const SearchFilter = ({ className = '' }) => {
  const {
    searchQuery,
    filterByType,
    setSearchQuery,
    setFilterByType,
    filteredNodes,
    clearFilters,
  } = useSearch();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const filterRef = useRef(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  const hasActiveFilters = searchQuery || filterByType;
  const activeTypeLabel = NODE_TYPES.find((t) => t.id === filterByType)?.label || 'All Types';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Search Input */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isFocused ? 'ring-2' : ''
        }`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: isFocused ? 'var(--accent-blue)' : 'var(--border-primary)',
          ringColor: isFocused ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
        }}
      >
        <Search className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="bg-transparent outline-none text-sm w-48"
          style={{ color: 'var(--text-primary)' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-0.5 rounded hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdown */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            filterByType ? 'ring-2' : ''
          }`}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: filterByType ? 'var(--accent-blue)' : 'var(--border-primary)',
            color: 'var(--text-primary)',
            ringColor: filterByType ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
          }}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">{activeTypeLabel}</span>
        </button>

        {isFilterOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg border overflow-hidden z-50"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-primary)',
            }}
          >
            {NODE_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = type.id === filterByType;

              return (
                <button
                  key={type.id || 'all'}
                  onClick={() => {
                    setFilterByType(type.id);
                    setIsFilterOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-opacity-5"
                  style={{
                    backgroundColor: isActive ? 'var(--interactive-hover)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span>{type.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-blue)' }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          <span>{filteredNodes.length} result{filteredNodes.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--interactive-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Search Results Panel (Optional - shows matching nodes)
// ============================================================================

export const SearchResults = ({ onNodeClick }) => {
  const { filteredNodes, searchQuery, filterByType } = useSearch();

  const hasActiveFilters = searchQuery || filterByType;

  if (!hasActiveFilters || filteredNodes.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute top-full left-0 mt-2 w-80 rounded-lg shadow-xl border overflow-hidden z-50 max-h-96 overflow-y-auto"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          borderColor: 'var(--border-primary)',
        }}
      >
        Search Results ({filteredNodes.length})
      </div>

      {filteredNodes.map((node) => {
        const Icon = getNodeIcon(node.type);

        return (
          <button
            key={node.id}
            onClick={() => onNodeClick?.(node)}
            className="w-full flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-opacity-5"
            style={{
              borderColor: 'var(--border-secondary)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--interactive-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <div className="flex-1 text-left">
              <div className="font-medium">{node.data.label}</div>
              {node.data.description && (
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {node.data.description}
                </div>
              )}
              {node.data.tech && (
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {node.data.tech}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

const getNodeIcon = (nodeType) => {
  switch (nodeType) {
    case 'serverNode':
      return Server;
    case 'databaseNode':
      return Database;
    case 'clientNode':
      return Smartphone;
    case 'loadBalancerNode':
      return Globe;
    case 'cacheNode':
      return Layers;
    case 'userNode':
      return User;
    case 'subflowNode':
      return Box;
    default:
      return Server;
  }
};
