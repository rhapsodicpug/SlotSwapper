'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Calendar as CalendarIcon, User, Shuffle, AlertCircle, Search, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/zustand'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

interface Slot {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  owner: {
    id: string
    name: string
    email: string
  }
}

interface MySlot {
  id: string
  title: string
  startTime: string
  endTime: string
}

interface Filters {
  search: string
  startDate: string
  endDate: string
  duration: string
}

export default function MarketplacePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedMySlotId, setSelectedMySlotId] = useState<string>('')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    startDate: '',
    endDate: '',
    duration: '',
  })

  const { data: availableSlots = [], isLoading, isSuccess } = useQuery<Slot[]>({
    queryKey: ['availableSlots', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.duration) params.append('duration', filters.duration)
      
      const response = await api.get(`/swap/available?${params.toString()}`)
      return response.data
    },
  })

  const { data: mySwappableSlots = [] } = useQuery<MySlot[]>({
    queryKey: ['mySwappableSlots'],
    queryFn: async () => {
      const response = await api.get('/events')
      return response.data.filter((event: MySlot & { status: string }) => event.status === 'SWAPPABLE')
    },
    enabled: requestDialogOpen,
  })

  const requestMutation = useMutation({
    mutationFn: async (data: { mySlotId: string; theirSlotId: string }) => {
      const response = await api.post('/swap/request', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableSlots'] })
      toast({
        title: 'Success!',
        description: 'Swap request sent successfully',
      })
      setRequestDialogOpen(false)
      setSelectedSlot(null)
      setSelectedMySlotId('')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send swap request',
        variant: 'destructive',
      })
    },
  })

  const handleRequestSwap = (slot: Slot) => {
    setSelectedSlot(slot)
    setRequestDialogOpen(true)
  }

  const handleConfirmRequest = () => {
    if (!selectedSlot || !selectedMySlotId) {
      toast({
        title: 'Error',
        description: 'Please select a slot to swap',
        variant: 'destructive',
      })
      return
    }

    requestMutation.mutate({
      mySlotId: selectedMySlotId,
      theirSlotId: selectedSlot.id,
    })
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      duration: '',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shuffle className="h-8 w-8" />
          Marketplace
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse available slots from other users
        </p>
      </div>

      {/* Filters Section */}
      <Card className="relative z-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <Input
                placeholder="Search by title..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date
              </Label>
              <DatePicker
                type="date"
                value={filters.startDate}
                onChange={(value) => setFilters({ ...filters, startDate: value })}
                placeholder="Select start date"
                onOpenChange={setDatePickerOpen}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                End Date
              </Label>
              <DatePicker
                type="date"
                value={filters.endDate}
                onChange={(value) => setFilters({ ...filters, endDate: value })}
                placeholder="Select end date"
                onOpenChange={setDatePickerOpen}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select 
                value={filters.duration || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, duration: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any duration</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filters.search || filters.startDate || filters.endDate || filters.duration) && (
            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isSuccess && availableSlots.length === 0 ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: datePickerOpen ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="max-w-md mx-auto relative z-0"
          style={{ pointerEvents: datePickerOpen ? 'none' : 'auto' }}
        >
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 pb-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No slots available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for new swappable slots!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableSlots.map((slot, index) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="group hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    {slot.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {slot.owner.name} ({slot.owner.email})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Start:</p>
                        <p className="font-medium">
                          {format(new Date(slot.startTime), 'PPpp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">End:</p>
                        <p className="font-medium">
                          {format(new Date(slot.endTime), 'PPpp')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRequestSwap(slot)}
                    className="w-full gap-2"
                  >
                    <Shuffle className="h-4 w-4" />
                    Request Swap
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Request Swap
            </DialogTitle>
            <DialogDescription>
              You are requesting <span className="font-semibold">{selectedSlot?.title}</span> from{' '}
              <span className="font-semibold">{selectedSlot?.owner.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span className="font-medium">Their Slot:</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {selectedSlot && format(new Date(selectedSlot.startTime), 'PPpp')} -{' '}
                {selectedSlot && format(new Date(selectedSlot.endTime), 'PPpp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Select your slot to swap
              </Label>
              <Select value={selectedMySlotId} onValueChange={setSelectedMySlotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a slot" />
                </SelectTrigger>
                <SelectContent>
                  {mySwappableSlots.length === 0 ? (
                    <div className="p-4 text-center">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No swappable slots available</p>
                    </div>
                  ) : (
                    mySwappableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.title} - {format(new Date(slot.startTime), 'PPpp')}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRequest}
              disabled={requestMutation.isPending || !selectedMySlotId || mySwappableSlots.length === 0}
              className="gap-2"
            >
              {requestMutation.isPending ? (
                <>
                  <motion.div
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4" />
                  Confirm Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

