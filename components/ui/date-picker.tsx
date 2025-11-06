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
      const popupHeight = popupRef.current?.offsetHeight || 450 // Use actual height if available, fallback to estimate
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
      
      // Calculate horizontal position first
      let left = rect.left + scrollX
      if (left + popupWidth > scrollX + viewportWidth - padding) {
        left = scrollX + viewportWidth - popupWidth - padding
      }
      if (left < scrollX + padding) {
        left = scrollX + padding
      }
      
      // Calculate vertical position - AGGRESSIVE: always check space first
      const viewportTop = scrollY + padding
      const viewportBottom = scrollY + viewportHeight - padding
      let top: number
      
      // CRITICAL: If there's not enough space below (with buffer), ALWAYS position above
      const requiredSpaceBelow = popupHeight + gap + padding
      const hasEnoughSpaceBelow = spaceBelow >= requiredSpaceBelow
      
      if (hasEnoughSpaceBelow) {
        // Enough space below - show below
        top = rect.bottom + scrollY + gap
      } else {
        // NOT enough space below - ALWAYS position above
        top = rect.top + scrollY - popupHeight - gap
      }
      
      // CRITICAL: Strict bounds checking - ensure popup NEVER exceeds viewport
      const maxAllowedTop = viewportBottom - popupHeight
      top = Math.max(viewportTop, Math.min(top, maxAllowedTop))
      
      // Final safety check: if popup would still exceed bottom, force it to fit
      const actualBottom = top + popupHeight
      if (actualBottom > viewportBottom) {
        top = Math.max(viewportTop, viewportBottom - popupHeight)
      }
      
      // If popup is too tall for viewport, position at top and let it scroll
      if (popupHeight > viewportHeight - padding * 2) {
        top = viewportTop
      }
      
      setPopupPosition({ top, left })
    }, [])

    React.useEffect(() => {
      if (isOpen) {
        // Calculate position after popup renders to get actual height
        const timer1 = setTimeout(() => {
          calculatePosition()
        }, 10)
        
        // Recalculate after a short delay to account for popup rendering
        const timer2 = setTimeout(() => {
          calculatePosition()
        }, 100)
        
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
          window.removeEventListener('scroll', handleScroll, true)
          window.removeEventListener('resize', handleResize)
        }
      }
    }, [isOpen, calculatePosition])

    // Close popup when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const displayValue = value ? (isDateTime ? format(selectedDate || new Date(), 'MMM dd, yyyy HH:mm') : format(selectedDate || new Date(), 'MMM dd, yyyy')) : ''

    return (
      <div ref={containerRef} className="relative group z-30">
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
                className={cn(
                  "w-full bg-transparent outline-none text-sm font-medium cursor-pointer",
                  "text-foreground placeholder:text-muted-foreground/60",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "focus:placeholder:text-muted-foreground/40",
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
                className="fixed z-[9999] w-auto min-w-[320px] max-w-[320px]"
                style={{
                  top: `${popupPosition.top}px`,
                  left: `${popupPosition.left}px`,
                  maxHeight: typeof window !== 'undefined' ? `${window.innerHeight - 32}px` : '450px',
                  maxWidth: typeof window !== 'undefined' ? `${window.innerWidth - 32}px` : '320px',
                }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div 
                  ref={popupRef}
                  className="backdrop-blur-xl bg-card/95 border-2 border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-4 overflow-y-auto" 
                  style={{ 
                    maxHeight: typeof window !== 'undefined' ? `${Math.min(450, window.innerHeight - 32)}px` : '450px',
                    overflowY: 'auto'
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
                    }
                    
                    .rdp-day_selected {
                      background: hsl(var(--primary));
                      color: hsl(var(--primary-foreground));
                      border-color: hsl(var(--primary));
                      font-weight: 600;
                      box-shadow: 0 4px 12px hsl(var(--primary) / 0.4);
                    }
                    
                    .rdp-day_selected:hover {
                      background: hsl(var(--primary));
                      transform: scale(1.05);
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
                    <div className="mt-4 pt-4 border-t border-border">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Time
                      </label>
                      <input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        onChange?.('')
                        setIsOpen(false)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date()
                        handleDateSelect(today)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Today
                    </button>
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
