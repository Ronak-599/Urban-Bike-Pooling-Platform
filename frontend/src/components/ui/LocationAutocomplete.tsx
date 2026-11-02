import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ChevronRight,
  X,
  Loader2,
  Building2,
  Train,
  Navigation,
  Compass,
} from 'lucide-react';
import {
  LocationSuggestion,
  searchLocalLocations,
  fetchRemoteLocations,
  POPULAR_LOCATIONS,
} from '../../lib/locationService.js';
import { cn } from '../../lib/utils.js';

export interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: 'blablacar' | 'dark';
  dropdownWidth?: string;
  onChange: (address: string, lat?: number, lng?: number, item?: LocationSuggestion) => void;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  placeholder = 'City or place',
  value,
  icon,
  className,
  inputClassName,
  required = false,
  disabled = false,
  variant = 'blablacar',
  dropdownWidth,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions whenever input changes or dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = inputValue.trim();

    // If query is empty or less than 2 chars, do not show any suggestions
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    // 1. Instant local search (0ms)
    const localMatches = searchLocalLocations(trimmed);
    setSuggestions(localMatches);
    setSelectedIndex(-1);

    // 2. Debounced remote geocoding query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (trimmed.length >= 2) {
      setIsLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(async () => {
        try {
          const remoteResults = await fetchRemoteLocations(trimmed, controller.signal);
          if (!controller.signal.aborted) {
            // Merge & deduplicate
            const merged = [...localMatches];
            for (const r of remoteResults) {
              const exists = merged.some(
                (m) =>
                  m.title.toLowerCase() === r.title.toLowerCase() ||
                  (Math.abs(m.lat - r.lat) < 0.01 && Math.abs(m.lng - r.lng) < 0.01)
              );
              if (!exists) {
                merged.push(r);
              }
            }
            setSuggestions(merged.slice(0, 7));
          }
        } catch {
          // Keep local matches on error
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      }, 250);

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    } else {
      setIsLoading(false);
    }
  }, [inputValue, isOpen]);

  const handleSelect = (item: LocationSuggestion) => {
    const chosenAddress = item.address || item.title;
    setInputValue(chosenAddress);
    setIsOpen(false);
    onChange(chosenAddress, item.lat, item.lng, item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onChange('', undefined, undefined);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const isBlaBlaCar = variant === 'blablacar';

  return (
    <div ref={containerRef} className={cn('relative w-full text-left', className)}>
      {label && (
        <label
          className={cn(
            'block text-[11px] font-bold uppercase tracking-wider mb-0.5 select-none',
            isBlaBlaCar ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-2.5 text-slate-400 pointer-events-none z-10">
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={cn(
            'w-full transition-all focus:outline-none',
            isBlaBlaCar
              ? 'h-10 text-slate-900 dark:text-slate-900 font-semibold text-sm sm:text-base placeholder:text-slate-400 placeholder:font-normal bg-transparent'
              : 'h-11 pl-9 pr-9 rounded-xl glass-input text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            icon && (isBlaBlaCar ? 'pl-8' : 'pl-9'),
            inputValue && 'pr-8',
            inputClassName
          )}
        />

        {/* Right side indicator: Spinner or Clear Button */}
        <div className="absolute right-2 flex items-center gap-1.5 z-10">
          {isLoading && (
            <Loader2
              className={cn(
                'w-4 h-4 animate-spin',
                isBlaBlaCar ? 'text-blue-500' : 'text-emerald-400'
              )}
            />
          )}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'p-1 rounded-full transition-colors',
                isBlaBlaCar
                  ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Suggestions Dropdown (Styled identically to BlaBlaCar's clean location dropdown) */}
      {isOpen && inputValue.trim().length >= 2 && (
        <div
          className={cn(
            'absolute top-[calc(100%+8px)] left-0 z-[100] rounded-2xl shadow-2xl shadow-slate-950/25 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150',
            dropdownWidth ? dropdownWidth : 'min-w-[320px] sm:min-w-[400px] w-full sm:w-[420px]',
            isBlaBlaCar
              ? 'bg-white border border-slate-200/90 text-slate-900'
              : 'bg-white dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white'
          )}
        >
          {/* Subtle header label */}
          <div
            className={cn(
              'px-5 py-2.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider border-b',
              isBlaBlaCar
                ? 'bg-slate-50 border-slate-100 text-slate-500'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
            )}
          >
            <span>
              {!inputValue.trim()
                ? 'Popular Commute Hubs & Cities'
                : `Suggested Locations`}
            </span>
            {suggestions.length > 0 && (
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isBlaBlaCar ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {suggestions.length} places
              </span>
            )}
          </div>

          <div
            className={cn(
              'max-h-80 overflow-y-auto divide-y',
              isBlaBlaCar ? 'divide-slate-100' : 'divide-slate-200 dark:divide-slate-800/40'
            )}
          >
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id || `${item.title}-${index}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'px-5 py-3.5 sm:py-4 flex items-center justify-between cursor-pointer transition-colors group',
                      isBlaBlaCar
                        ? isSelected
                          ? 'bg-slate-100 text-slate-950'
                          : 'hover:bg-slate-50 text-slate-800'
                        : isSelected
                        ? 'bg-slate-100 dark:bg-slate-800/95 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-3">
                      <div
                        className={cn(
                          'mt-0.5 p-1.5 rounded-lg flex-shrink-0 transition-colors',
                          isBlaBlaCar
                            ? 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div
                          className={cn(
                            'text-sm sm:text-[15px] font-bold truncate leading-tight',
                            isBlaBlaCar
                              ? 'text-slate-900 group-hover:text-black'
                              : 'text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                          )}
                        >
                          {item.title}
                        </div>
                        <div
                          className={cn(
                            'text-xs sm:text-[13px] truncate font-normal leading-tight',
                            isBlaBlaCar ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Right Chevron arrow matching BlaBlaCar screenshot */}
                    <div className="flex-shrink-0 pl-2">
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 transition-all duration-150',
                          isBlaBlaCar
                            ? isSelected
                              ? 'text-slate-900 translate-x-0.5'
                              : 'text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5'
                            : isSelected
                            ? 'text-emerald-400 translate-x-0.5'
                            : 'text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5'
                        )}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={cn(
                  'px-5 py-6 text-center text-xs space-y-1',
                  isBlaBlaCar ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                <MapPin className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                <p
                  className={cn(
                    'font-bold',
                    isBlaBlaCar ? 'text-slate-800' : 'text-slate-300'
                  )}
                >
                  No exact places found
                </p>
                <p className="text-[11px] text-slate-400">
                  Press Enter to search for "{inputValue}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
