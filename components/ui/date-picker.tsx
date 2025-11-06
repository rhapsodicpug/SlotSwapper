'use client'

import * as React from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/dist/style.css'

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onOpenChange?: (isOpen: boolean) => void
  type?: 'date' | 'datetime-local'
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, type = 'date', value, onChange, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const [popupPosition, setPopupPosition] = React.useState({ top: 0, left: 0 })
    const [animationDirection, setAnimationDirection] = React.useState<'up' | 'down'>('down')
    const containerRef = React.useRef<HTMLDivElement>(null)
    const popupRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const isDateTime = type === 'datetime-local'

    // Notify parent when open state changes
    React.useEffect(() => {
      onOpenChange?.(isOpen)
    }, [isOpen, onOpenChange])

    // Parse value to Date
    const selectedDate = value ? new Date(value) : undefined

    // Handle date selection
    const handleDateSelect = (date: Date | undefined) => {
      if (!date) return
      
      if (isDateTime) {
        // For datetime-local, use the current time or keep existing time
        const timeStr = value ? value.split('T')[1] : '00:00'
        const dateTimeStr = format(date, 'yyyy-MM-dd') + 'T' + timeStr
        onChange?.(dateTimeStr)
      } else {
        onChange?.(format(date, 'yyyy-MM-dd'))
      }
      setIsOpen(false)
    }

    // Handle time change for datetime-local
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        onChange?.(dateStr + 'T' + e.target.value)
      } else {
        const today = format(new Date(), 'yyyy-MM-dd')
        onChange?.(today + 'T' + e.target.value)
      }
    }

    // Get time value for datetime-local
    const timeValue = isDateTime && value ? value.split('T')[1]?.substring(0, 5) : ''

    // Calculate popup position with smart positioning
    const calculatePosition = React.useCallback(() => {
      if (!containerRef.current || typeof window === 'undefined') return
      
      const rect = containerRef.current.getBoundingClientRect()
      // Get actual popup height, or use a safe estimate
      const actualPopupHeight = popupRef.current?.getBoundingClientRect().height || popupRef.current?.offsetHeight || 450
      const popupWidth = 320
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      const padding = 16
      const gap = 8
      
      // Calculate available space
      const spaceBelow = viewportHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      
      // Detect if there are other form inputs nearby that would be overlapped
      const checkForNearbyInputs = () => {
        if (!containerRef.current) return { hasInputBelow: false, hasInputRight: false }
        
        const allInputs = document.querySelectorAll('input, [role="combobox"], [data-date-picker]')
        let hasInputBelow = false
        let hasInputRight = false
        
        allInputs.forEach((input) => {
          if (input === containerRef.current || input.contains(containerRef.current)) return
          
          const inputRect = input.getBoundingClientRect()
          const distanceBelow = inputRect.top - rect.bottom
          const distanceRight = inputRect.left - rect.right
          
          // Check if there's an input directly below (within 100px)
          if (distanceBelow > 0 && distanceBelow < 100 && 
              Math.abs(inputRect.left - rect.left) < rect.width / 2) {
            hasInputBelow = true
          }
          
          // Check if there's an input to the right (within 50px vertically, within 300px horizontally)
          if (distanceRight > 0 && distanceRight < 300 &&
              Math.abs(inputRect.top - rect.top) < 50) {
            hasInputRight = true
          }
        })
        
        return { hasInputBelow, hasInputRight }
      }
      
      const { hasInputBelow, hasInputRight } = checkForNearbyInputs()
      
      // Calculate horizontal position first
      // Smart positioning to avoid overlapping with adjacent inputs
      let left = rect.left + scrollX
      
      // Check available space on right side
      const spaceRight = viewportWidth - rect.right
      const spaceLeft = rect.left
      
      // Estimate adjacent input width (typical form input is ~200-250px including gap)
      const estimatedInputWidth = 250
      const spaceNeeded = popupWidth + padding
      
      // If there's an input to the right that would be overlapped, position to the left
      if (hasInputRight && spaceLeft >= popupWidth + padding) {
        // Position to the left of the input to avoid overlapping adjacent input
        left = rect.left + scrollX - popupWidth - gap
      } else if (spaceRight < spaceNeeded && spaceLeft >= popupWidth + padding) {
        // Not enough space on right, but enough on left - position to the left
        left = rect.left + scrollX - popupWidth - gap
      } else if (spaceRight < spaceNeeded) {
        // Not enough space on right, and not enough on left either
        // Center it or align to viewport edge
        const centerPosition = scrollX + (viewportWidth - popupWidth) / 2
        if (centerPosition >= scrollX + padding && centerPosition + popupWidth <= scrollX + viewportWidth - padding) {
          left = centerPosition
        } else {
          // Fallback: align to right edge with padding
          left = scrollX + viewportWidth - popupWidth - padding
        }
      } else {
        // Enough space on right - align with left edge of input (default)
        left = rect.left + scrollX
      }
      
      // Final bounds check - ensure popup doesn't overflow viewport
      if (left + popupWidth > scrollX + viewportWidth - padding) {
        left = scrollX + viewportWidth - popupWidth - padding
      }
      if (left < scrollX + padding) {
        left = scrollX + padding
      }
      
      // Calculate vertical position - ULTRA AGGRESSIVE: check if input is in bottom 70%
      const viewportTop = scrollY + padding
      const viewportBottom = scrollY + viewportHeight - padding
      const viewport70Percent = scrollY + viewportHeight * 0.7
      const inputBottom = rect.bottom + scrollY
      
      let top: number
      
      // ULTRA AGGRESSIVE CHECK: If input is in bottom 70% of screen, ALWAYS position above
      const isInputInBottom70Percent = inputBottom > viewport70Percent
      
      // Check if there's enough space below (with very generous buffer)
      const requiredSpaceBelow = actualPopupHeight + gap + padding + 100 // Extra 100px buffer
      const hasEnoughSpaceBelow = spaceBelow >= requiredSpaceBelow && !isInputInBottom70Percent
      
      // CRITICAL: If there's an input below that would be overlapped, ALWAYS position above
      let direction: 'up' | 'down' = 'down'
      if (hasInputBelow) {
        // There's an input below - position above to avoid overlap
        top = rect.top + scrollY - actualPopupHeight - gap
        direction = 'up'
      } else if (hasEnoughSpaceBelow) {
        // Enough space below AND input is in top 30% AND no input below - show below
        top = rect.bottom + scrollY + gap
        direction = 'down'
      } else {
        // NOT enough space below OR input is in bottom 70% - ALWAYS position above
        top = rect.top + scrollY - actualPopupHeight - gap
        direction = 'up'
      }
      
      // Update animation direction
      setAnimationDirection(direction)
      
      // CRITICAL: Strict bounds checking - ensure popup NEVER exceeds viewport
      const maxAllowedTop = viewportBottom - actualPopupHeight
      top = Math.max(viewportTop, Math.min(top, maxAllowedTop))
      
      // Final safety check: if popup would still exceed bottom, force it to fit
      const actualBottom = top + actualPopupHeight
      if (actualBottom > viewportBottom) {
        top = Math.max(viewportTop, viewportBottom - actualPopupHeight)
      }
      
      // If popup is too tall for viewport, position at top and let it scroll
      if (actualPopupHeight > viewportHeight - padding * 2) {
        top = viewportTop
      }
      
      // EXTRA SAFETY: If we're still too close to bottom (within 50px), force above
      const distanceFromBottom = viewportBottom - (top + actualPopupHeight)
      if (distanceFromBottom < 50) {
        top = rect.top + scrollY - actualPopupHeight - gap
        // But ensure it doesn't go above viewport
        if (top < viewportTop) {
          top = viewportTop
        }
      }
      
      // FINAL CHECK: Ensure popup bottom never exceeds viewport bottom
      const finalBottom = top + actualPopupHeight
      if (finalBottom > viewportBottom) {
        top = viewportBottom - actualPopupHeight
        if (top < viewportTop) {
          top = viewportTop
        }
      }
      
      setPopupPosition({ top, left })
    }, [])

    React.useEffect(() => {
      if (isOpen) {
        // Calculate position immediately
        calculatePosition()
        
        // Calculate position multiple times to account for rendering
        const timer1 = setTimeout(() => {
          calculatePosition()
        }, 10)
        
        const timer2 = setTimeout(() => {
          calculatePosition()
        }, 50)
        
        const timer3 = setTimeout(() => {
          calculatePosition()
        }, 150)
        
        const timer4 = setTimeout(() => {
          calculatePosition()
        }, 300)
        
        // Use ResizeObserver to recalculate when popup size changes
        let resizeObserver: ResizeObserver | null = null
        if (popupRef.current) {
          resizeObserver = new ResizeObserver(() => {
            calculatePosition()
          })
          resizeObserver.observe(popupRef.current)
        } else {
          // If popupRef not ready, try again after a delay
          const timer5 = setTimeout(() => {
            if (popupRef.current) {
              resizeObserver = new ResizeObserver(() => {
                calculatePosition()
              })
              resizeObserver.observe(popupRef.current)
            }
          }, 100)
          setTimeout(() => clearTimeout(timer5), 5000)
        }
        
        // Recalculate on scroll
        const handleScroll = () => {
          calculatePosition()
        }
        
        // Recalculate on resize
        const handleResize = () => {
          calculatePosition()
        }
        
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleResize)
        
        return () => {
          clearTimeout(timer1)
          clearTimeout(timer2)
          clearTimeout(timer3)
          clearTimeout(timer4)
          if (resizeObserver) {
            resizeObserver.disconnect()
          }
          window.removeEventListener('scroll', handleScroll, true)
          window.removeEventListener('resize', handleResize)
        }
      }
    }, [isOpen, calculatePosition])

    // Keyboard navigation
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isOpen) return
        
        switch (event.key) {
          case 'Escape':
            event.preventDefault()
            setIsOpen(false)
            inputRef.current?.blur()
            break
          case 'Enter':
            if (document.activeElement === inputRef.current) {
              event.preventDefault()
              // Don't close, just ensure it's open
            }
            break
        }
      }

      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
      }
    }, [isOpen])

    // Close popup when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        // Use capture phase to catch clicks before they bubble
        document.addEventListener('mousedown', handleClickOutside, true)
        return () => document.removeEventListener('mousedown', handleClickOutside, true)
      }
    }, [isOpen])

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const displayValue = value ? (isDateTime ? format(selectedDate || new Date(), 'MMM dd, yyyy HH:mm') : format(selectedDate || new Date(), 'MMM dd, yyyy')) : ''

    return (
      <div ref={containerRef} className="relative group" style={{ zIndex: isOpen ? 50 : 'auto' }}>
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
          animate={{
            opacity: isFocused || isOpen ? 1 : 0,
            scale: isFocused || isOpen ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Main container */}
        <div
          className={cn(
            "relative backdrop-blur-xl bg-gradient-to-br from-card/90 via-card/80 to-card/70",
            "border-2 border-border/60 rounded-xl px-4 py-3",
            "transition-all duration-300 ease-out",
            "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10",
            (isFocused || isOpen) && "border-primary shadow-xl shadow-primary/20 bg-card/95",
            "group-hover:bg-card/85",
            className
          )}
          onClick={() => {
            setIsOpen(true)
            setIsFocused(true)
            inputRef.current?.focus()
          }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Pulsing ring effect when calendar is open */}
          {isOpen && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-primary/30"
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          <div className="relative flex items-center gap-3">
            {/* Icon container */}
            <motion.div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg",
                "bg-gradient-to-br from-primary/20 to-primary/10",
                "border border-primary/20",
                "transition-all duration-300",
                (isFocused || isOpen) && "bg-gradient-to-br from-primary/30 to-primary/20 border-primary/40",
                isOpen && "bg-gradient-to-br from-primary/40 to-primary/30 border-primary/60 shadow-lg shadow-primary/30"
              )}
              animate={{
                scale: (isFocused || isOpen) ? (isOpen ? 1.15 : 1.1) : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {isDateTime ? (
                <Clock className="h-4 w-4 text-primary transition-colors" />
              ) : (
                <CalendarIcon className="h-4 w-4 text-primary transition-colors" />
              )}
            </motion.div>
            
            {/* Input field */}
            <div className="flex-1 relative">
              <input
                type="text"
                ref={inputRef}
                readOnly
                value={displayValue || ''}
                placeholder={props.placeholder || (isDateTime ? 'Select date and time' : 'Select date')}
                onFocus={(e) => {
                  e.preventDefault()
                  setIsFocused(true)
                  setIsOpen(true)
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!isOpen) setIsFocused(false)
                  }, 200)
                }}
                onKeyDown={(e) => {
                  // Open on Enter or Space
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsOpen(true)
                    setIsFocused(true)
                  }
                  // Open on ArrowDown
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setIsOpen(true)
                    setIsFocused(true)
                  }
                }}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label={props['aria-label'] || (isDateTime ? 'Select date and time' : 'Select date')}
                className={cn(
                  "w-full bg-transparent outline-none text-sm font-medium cursor-pointer",
                  "text-foreground placeholder:text-muted-foreground/60",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "focus:placeholder:text-muted-foreground/40",
                  "transition-colors duration-200",
                  className
                )}
              />
              {/* Bottom border animation */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: (isFocused || isOpen) ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          
          {/* Floating label */}
          <AnimatePresence>
            {value && (
              <motion.div
                className="absolute -top-2 left-4 px-1.5 text-xs font-medium text-primary bg-card/95 rounded backdrop-blur-sm border border-primary/20"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {isDateTime ? 'Date & Time' : 'Date'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Calendar Popup */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Calendar Popup */}
              <motion.div
                ref={popupRef}
                className="fixed w-auto min-w-[320px] max-w-[320px]"
                style={{
                  top: `${popupPosition.top}px`,
                  left: `${popupPosition.left}px`,
                  zIndex: 9999,
                  // CRITICAL: Use CSS calc to ensure popup never exceeds viewport bottom
                  maxHeight: typeof window !== 'undefined' 
                    ? `min(450px, calc(100vh - ${popupPosition.top}px - 16px))` 
                    : '450px',
                  maxWidth: typeof window !== 'undefined' ? `${window.innerWidth - 32}px` : '320px',
                }}
                initial={{ 
                  opacity: 0, 
                  y: animationDirection === 'down' ? -20 : 20, 
                  scale: 0.9,
                  filter: 'blur(4px)'
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  filter: 'blur(0px)'
                }}
                exit={{ 
                  opacity: 0, 
                  y: animationDirection === 'down' ? -10 : 10, 
                  scale: 0.95,
                  filter: 'blur(2px)'
                }}
                transition={{ 
                  duration: 0.25, 
                  ease: [0.16, 1, 0.3, 1], // Custom easing for smoother animation
                  opacity: { duration: 0.2 },
                  filter: { duration: 0.2 }
                }}
                role="dialog"
                aria-modal="true"
                aria-label={isDateTime ? 'Date and time picker' : 'Date picker'}
              >
                <div 
                  className="backdrop-blur-xl bg-card/95 border-2 border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-4 overflow-y-auto" 
                  style={{ 
                    maxHeight: typeof window !== 'undefined' ? `min(450px, calc(100vh - ${popupPosition.top}px - 16px))` : '450px',
                    overflowY: 'auto',
                    // Ensure content never exceeds container
                    boxSizing: 'border-box',
                    // Smooth scrolling
                    scrollBehavior: 'smooth'
                  }}
                >
                  <style jsx global>{`
                    .rdp {
                      --rdp-cell-size: 40px;
                      --rdp-accent-color: hsl(var(--primary));
                      --rdp-background-color: hsl(var(--card));
                      --rdp-accent-color-dark: hsl(var(--primary));
                      --rdp-background-color-dark: hsl(var(--card));
                      --rdp-outline: 2px solid hsl(var(--primary));
                      --rdp-outline-selected: 2px solid hsl(var(--primary));
                      margin: 0;
                    }
                    
                    .rdp-months {
                      display: flex;
                    }
                    
                    .rdp-month {
                      margin: 0;
                    }
                    
                    .rdp-table {
                      width: 100%;
                      max-width: 100%;
                      border-collapse: collapse;
                    }
                    
                    .rdp-with_weeknumber .rdp-table {
                      width: 100%;
                    }
                    
                    .rdp-caption {
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      padding: 0.5rem;
                      margin-bottom: 0.5rem;
                    }
                    
                    .rdp-caption_label {
                      font-weight: 600;
                      font-size: 1rem;
                      color: hsl(var(--foreground));
                    }
                    
                    .rdp-nav {
                      display: flex;
                      align-items: center;
                      gap: 0.5rem;
                    }
                    
                    .rdp-button_previous,
                    .rdp-button_next {
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      width: 2rem;
                      height: 2rem;
                      border-radius: 0.5rem;
                      border: 1px solid hsl(var(--border));
                      background: hsl(var(--card));
                      color: hsl(var(--foreground));
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    
                    .rdp-button_previous:hover,
                    .rdp-button_next:hover {
                      background: hsl(var(--primary));
                      color: hsl(var(--primary-foreground));
                      border-color: hsl(var(--primary));
                      transform: scale(1.1);
                      box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
                    }
                    
                    .rdp-button_previous:active,
                    .rdp-button_next:active {
                      transform: scale(0.95);
                    }
                    
                    .rdp-button_previous:focus,
                    .rdp-button_next:focus {
                      outline: 2px solid hsl(var(--primary));
                      outline-offset: 2px;
                    }
                    
                    .rdp-head_cell {
                      color: hsl(var(--muted-foreground));
                      font-weight: 600;
                      font-size: 0.75rem;
                      padding: 0.5rem;
                      text-transform: uppercase;
                      letter-spacing: 0.05em;
                    }
                    
                    .rdp-cell {
                      padding: 0.25rem;
                    }
                    
                    .rdp-day {
                      width: var(--rdp-cell-size);
                      height: var(--rdp-cell-size);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border-radius: 0.5rem;
                      border: 1px solid transparent;
                      background: transparent;
                      color: hsl(var(--foreground));
                      cursor: pointer;
                      transition: all 0.2s;
                      font-weight: 500;
                    }
                    
                    .rdp-day:hover {
                      background: hsl(var(--primary) / 0.2);
                      border-color: hsl(var(--primary) / 0.5);
                      transform: scale(1.1);
                      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    
                    .rdp-day:active {
                      transform: scale(0.95);
                    }
                    
                    .rdp-day:focus {
                      outline: 2px solid hsl(var(--primary));
                      outline-offset: 2px;
                    }
                    
                    .rdp-day_selected {
                      background: hsl(var(--primary));
                      color: hsl(var(--primary-foreground));
                      border-color: hsl(var(--primary));
                      font-weight: 600;
                      box-shadow: 0 4px 12px hsl(var(--primary) / 0.4);
                      animation: pulse 0.3s ease-out;
                    }
                    
                    @keyframes pulse {
                      0% {
                        transform: scale(1);
                      }
                      50% {
                        transform: scale(1.1);
                      }
                      100% {
                        transform: scale(1);
                      }
                    }
                    
                    .rdp-day_selected:hover {
                      background: hsl(var(--primary));
                      transform: scale(1.05);
                      box-shadow: 0 6px 16px hsl(var(--primary) / 0.5);
                    }
                    
                    .rdp-day_today {
                      border: 2px solid hsl(var(--primary) / 0.5);
                      font-weight: 700;
                    }
                    
                    .rdp-day_outside {
                      color: hsl(var(--muted-foreground) / 0.5);
                    }
                    
                    .rdp-day_disabled {
                      opacity: 0.3;
                      cursor: not-allowed;
                    }
                    
                    .rdp-day_disabled:hover {
                      background: transparent;
                      transform: none;
                    }
                    
                    /* Custom scrollbar styling */
                    .backdrop-blur-xl::-webkit-scrollbar {
                      width: 8px;
                    }
                    
                    .backdrop-blur-xl::-webkit-scrollbar-track {
                      background: transparent;
                      border-radius: 4px;
                    }
                    
                    .backdrop-blur-xl::-webkit-scrollbar-thumb {
                      background: hsl(var(--primary) / 0.2);
                      border-radius: 4px;
                      transition: background 0.2s;
                    }
                    
                    .backdrop-blur-xl::-webkit-scrollbar-thumb:hover {
                      background: hsl(var(--primary) / 0.4);
                    }
                    
                    .backdrop-blur-xl {
                      scrollbar-width: thin;
                      scrollbar-color: hsl(var(--primary) / 0.2) transparent;
                    }
                  `}</style>
                  
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-lg"
                    classNames={{
                      months: "flex flex-col",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: cn(
                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      ),
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    components={{
                      Chevron: (props: { orientation?: 'left' | 'right' }) => {
                        if (props.orientation === 'left') {
                          return <ChevronLeft className="h-4 w-4" />
                        }
                        return <ChevronRight className="h-4 w-4" />
                      },
                    } as any}
                  />
                  
                  {/* Time picker for datetime-local */}
                  {isDateTime && (
                    <motion.div 
                      className="mt-4 pt-4 border-t border-border"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Time
                      </label>
                      <input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 hover:border-primary/50"
                        aria-label="Select time"
                      />
                    </motion.div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <motion.button
                      onClick={() => {
                        onChange?.('')
                        setIsOpen(false)
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      Clear
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        const today = new Date()
                        handleDateSelect(today)
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg shadow-primary/20"
                    >
                      Today
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
