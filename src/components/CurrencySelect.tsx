import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CURRENCY_DETAILED_OPTIONS, CurrencyOption } from '../types';
import { CurrencyFlag } from './CurrencyFlag';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface CurrencySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
  variant?: 'default' | 'dark' | 'glass';
  placeholder?: string;
  disabled?: boolean;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  id,
  value = 'EUR',
  onChange,
  className = '',
  compact = false,
  variant = 'default',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUpward: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = (value || 'EUR').trim().toUpperCase();
  const selectedOption: CurrencyOption =
    CURRENCY_DETAILED_OPTIONS.find((c) => c.code === normalizedValue) || {
      code: normalizedValue,
      name: normalizedValue,
      symbol: normalizedValue,
      flag: '🌐',
      label: normalizedValue,
    };

  // Update floating menu position based on container bounding rect
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const dropdownMinWidth = 240;
    const targetWidth = Math.max(rect.width, dropdownMinWidth);

    // Check space below vs space above
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    let left = rect.left;
    if (left + targetWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - targetWidth - 12);
    }

    if (openUpward) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        left,
        width: targetWidth,
        openUpward: true,
      });
    } else {
      setMenuPosition({
        top: rect.bottom + 6,
        left,
        width: targetWidth,
        openUpward: false,
      });
    }
  };

  // Update position on open and listen to scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    } else {
      setMenuPosition(null);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  const filteredOptions = CURRENCY_DETAILED_OPTIONS.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.symbol.toLowerCase().includes(term)
    );
  });

  const getVariantStyles = () => {
    if (variant === 'dark') {
      return {
        button:
          'bg-[#202234] border-border/80 text-slate-100 hover:border-blue-500/80 focus:border-blue-500',
        menu: 'bg-[#1b1d2e] border-slate-700 text-slate-100 shadow-2xl shadow-black/80 ring-1 ring-slate-700/50',
        item: 'hover:bg-blue-600/20 text-slate-200 hover:text-white',
        selectedItem: 'bg-blue-600/30 text-blue-300 font-bold',
        search:
          'bg-[#141523] border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-blue-500',
      };
    }
    return {
      button:
        'bg-muted/50 border-border text-foreground hover:border-blue-500/70 focus:border-blue-500',
      menu: 'bg-card border-border text-foreground shadow-2xl shadow-black/30 dark:shadow-black/70 ring-1 ring-black/5 dark:ring-white/10',
      item: 'hover:bg-muted text-foreground',
      selectedItem: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold',
      search:
        'bg-muted/60 border-border text-foreground placeholder-muted-foreground focus:border-blue-500',
    };
  };

  const vStyles = getVariantStyles();

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button: Clean display with Flag, Code and Symbol without long name */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full flex items-center justify-between gap-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 ${
          compact ? 'px-3 py-2.5 rounded-xl' : 'px-3.5 py-3'
        } ${vStyles.button} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <CurrencyFlag currency={selectedOption.code} size="sm" />
          <div className="flex items-baseline gap-1 truncate">
            <span className="font-bold tracking-tight">{selectedOption.code}</span>
            <span className="opacity-75 font-medium text-[11px]">({selectedOption.symbol})</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 opacity-60 ${
            isOpen ? 'rotate-180 opacity-100' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu (Rendered via React Portal to prevent clipping in modals) */}
      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
              bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              zIndex: 99999,
            }}
            className={`max-h-72 rounded-2xl border overflow-hidden flex flex-col backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 ${vStyles.menu}`}
          >
            {/* Quick Search */}
            <div className="p-2 border-b border-border/60 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 opacity-50 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar moneda o país..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-medium outline-none transition-colors ${vStyles.search}`}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto flex-1 p-1 space-y-0.5 max-h-56 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs opacity-60">
                  No se encontraron monedas
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.code === normalizedValue;
                  return (
                    <div
                      key={opt.code}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.code);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected ? vStyles.selectedItem : vStyles.item
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CurrencyFlag currency={opt.code} size="sm" />
                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="font-bold tracking-tight">{opt.code}</span>
                          <span className="opacity-75 font-semibold text-[11px]">
                            ({opt.symbol})
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
