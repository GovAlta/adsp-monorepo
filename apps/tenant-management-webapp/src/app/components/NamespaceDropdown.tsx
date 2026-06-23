import React, { useState, useEffect, useId, useMemo, useRef } from 'react';
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
  excludedNamespaces?: string[];
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

const DropdownItem = styled.li<{ $isHighlighted: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  background: ${(props) => (props.$isHighlighted ? 'var(--color-gray-100, #f5f5f5)' : 'white')};

  &:hover {
    background: var(--color-gray-100, #f5f5f5);
  }
`;

const EMPTY_NAMESPACES: string[] = [];

export const NamespaceDropdown: React.FC<NamespaceDropdownProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  testId = 'namespace-dropdown',
  existingNamespaces = EMPTY_NAMESPACES,
  excludedNamespaces = EMPTY_NAMESPACES,
  label = 'Namespace',
}) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-namespace-options`;

  const uniqueNamespaces = useMemo(
    () =>
      Array.from(new Set(existingNamespaces))
        .filter((ns) => !excludedNamespaces.includes(ns))
        .sort(),
    [existingNamespaces, excludedNamespaces]
  );

  const filteredNamespaces = useMemo(
    () =>
      inputValue
        ? uniqueNamespaces.filter((ns) => ns.toLowerCase().includes(inputValue.toLowerCase()))
        : uniqueNamespaces,
    [inputValue, uniqueNamespaces]
  );

  const activeOptionId =
    isOpen && highlightedIndex >= 0 && highlightedIndex < filteredNamespaces.length
      ? `${listboxId}-${highlightedIndex}`
      : undefined;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

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
    setInputValue(detail.value);
    onChange(detail.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const openDropdown = () => {
    if (!disabled && filteredNamespaces.length > 0) {
      setIsOpen(true);
    }
  };

  const openDropdownWithKeyboard = () => {
    if (!disabled && filteredNamespaces.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(0);
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
    setInputValue(namespace);
    onChange(namespace);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && filteredNamespaces.length > 0) {
        openDropdownWithKeyboard();
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
      <div
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-disabled={disabled}
        aria-expanded={isOpen && !disabled && filteredNamespaces.length > 0}
        aria-haspopup="listbox"
        aria-label={label}
        onKeyDown={handleKeyDown}
        onMouseDown={openDropdown}
        onTouchStart={openDropdown}
      >
        <GoabInput
          type="text"
          name="namespace"
          value={inputValue}
          disabled={disabled}
          error={Boolean(error)}
          testId={testId}
          ariaLabel={label}
          width="100%"
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          autoComplete="off"
        />
      </div>
      {isOpen && !disabled && filteredNamespaces.length > 0 && (
        <DropdownList id={listboxId} role="listbox" aria-label={`${label} options`}>
          {filteredNamespaces.map((namespace, index) => (
            <DropdownItem
              id={`${listboxId}-${index}`}
              key={namespace}
              $isHighlighted={index === highlightedIndex}
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelectNamespace(namespace)}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
            >
              {namespace}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </DropdownContainer>
  );
};
