import React, { useState, useEffect, useRef } from 'react';
import { GoabInput } from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import styled from 'styled-components';

interface NamespaceDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  testId?: string;
  existingNamespaces?: string[];
  label?: string;
}

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--color-gray-300, #ccc);
  border-radius: 4px;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const DropdownItem = styled.li<{ isHighlighted: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  background: ${(props) => (props.isHighlighted ? 'var(--color-gray-100, #f5f5f5)' : 'white')};

  &:hover {
    background: var(--color-gray-100, #f5f5f5);
  }
`;

const NoResults = styled.div`
  padding: 8px 12px;
  color: var(--color-gray-600, #666);
  font-style: italic;
`;

export const NamespaceDropdown: React.FC<NamespaceDropdownProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  testId = 'namespace-dropdown',
  existingNamespaces = [],
  label = 'Namespace',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredNamespaces, setFilteredNamespaces] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uniqueNamespaces = Array.from(new Set(existingNamespaces)).sort();

  useEffect(() => {
    if (value) {
      const filtered = uniqueNamespaces.filter((ns) => ns.toLowerCase().includes(value.toLowerCase()));
      setFilteredNamespaces(filtered);
    } else {
      setFilteredNamespaces(uniqueNamespaces);
    }
  }, [value, existingNamespaces.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (detail: GoabInputOnChangeDetail) => {
    onChange(detail.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled && existingNamespaces.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (onBlur) {
        onBlur();
      }
    }, 200);
  };

  const handleSelectNamespace = (namespace: string) => {
    onChange(namespace);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && existingNamespaces.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredNamespaces.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredNamespaces.length) {
          handleSelectNamespace(filteredNamespaces[highlightedIndex]);
        } else {
          setIsOpen(false);
          setHighlightedIndex(-1);
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <DropdownContainer ref={containerRef}>
      <div onKeyDown={handleKeyDown}>
        <GoabInput
          type="text"
          name="namespace"
          value={value}
          disabled={disabled}
          testId={testId}
          aria-label="namespace"
          width="100%"
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoComplete="off"
        />
      </div>
      {isOpen && !disabled && (
        <DropdownList>
          {filteredNamespaces.length > 0 ? (
            filteredNamespaces.map((namespace, index) => (
              <DropdownItem
                key={namespace}
                isHighlighted={index === highlightedIndex}
                onClick={() => handleSelectNamespace(namespace)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {namespace}
              </DropdownItem>
            ))
          ) : (
            <NoResults>
              {value
                ? `No existing namespaces match "${value}". Press Enter to use this value.`
                : 'No namespaces available'}
            </NoResults>
          )}
        </DropdownList>
      )}
    </DropdownContainer>
  );
};
