'use client'

import { useState } from 'react'
import { Calendar, Event, momentLocalizer } from 'react-big-calendar'
import { format } from 'date-fns'
import moment from 'moment'
import { Plus, Clock, Calendar as CalendarIcon, RotateCcw, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

const localizer = momentLocalizer(moment)

interface EventData {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  ownerId: string
}

export default function DashboardPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
  })

  const { data: events = [] } = useQuery<EventData[]>({
    queryKey: ['myEvents'],
    queryFn: async () => {
      const response = await api.get('/events')
      return response.data
    },
  })

  const { data: userStatus } = useQuery<{ hasGoogleConnected: boolean }>({
    queryKey: ['userStatus'],
    queryFn: async () => {
      const response = await api.get('/user/status')
      return response.data
    },
  })

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/auth/google')
      return response.data
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to connect Google Calendar',
        variant: 'destructive',
      })
    },
  })

  const syncGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/events/sync')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      toast({
        title: 'Success!',
        description: data.message || 'Synced with Google Calendar',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to sync Google Calendar',
        variant: 'destructive',
      })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; startTime: string; endTime: string }) => {
      const response = await api.post('/events', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      toast({
        title: 'Success!',
        description: 'Event created successfully',
      })
      setCreateDialogOpen(false)
      setFormData({ title: '', startTime: '', endTime: '' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create event',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/events/${id}`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      toast({
        title: 'Success!',
        description: 'Event updated successfully',
      })
      setEventDialogOpen(false)
      setSelectedEvent(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update event',
        variant: 'destructive',
      })
    },
  })

  const calendarEvents: Event[] = events.map((event) => ({
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    resource: event,
  }))

  const eventStyleGetter = (event: Event) => {
    const eventData = event.resource as EventData
    let backgroundColor = '#3174ad'
    let borderStyle = 'solid'
    let opacity = 1
    
    if (eventData.status === 'SWAPPABLE') {
      backgroundColor = '#10b981'
      opacity = 0.85
      borderStyle = 'dashed'
    } else if (eventData.status === 'SWAP_PENDING') {
      backgroundColor = '#f59e0b'
      opacity = 0.9
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity,
        color: 'white',
        border: `2px ${borderStyle} rgba(255, 255, 255, 0.3)`,
        display: 'block',
        fontWeight: 500,
      },
    }
  }

  const handleSelectEvent = (event: Event) => {
    const eventData = event.resource as EventData
    setSelectedEvent(eventData)
    setEventDialogOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleToggleSwappable = () => {
    if (!selectedEvent) return
    const newStatus = selectedEvent.status === 'SWAPPABLE' ? 'BUSY' : 'SWAPPABLE'
    updateMutation.mutate({ id: selectedEvent.id, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            My Calendar
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your events and make them swappable
          </p>
        </div>
        <div className="flex gap-2">
          {!userStatus?.hasGoogleConnected ? (
            <Button
              onClick={() => connectGoogleMutation.mutate()}
              variant="outline"
              className="gap-2"
              disabled={connectGoogleMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          ) : (
            <Button
              onClick={() => syncGoogleMutation.mutate()}
              variant="outline"
              className="gap-2"
              disabled={syncGoogleMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${syncGoogleMutation.isPending ? 'animate-spin' : ''}`} />
              Sync with Google
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-xl p-4 h-[600px] border dark:glassmorphic">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Event
            </DialogTitle>
            <DialogDescription>Add a new event to your calendar</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </Label>
              <DatePicker
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(value) => setFormData({ ...formData, startTime: value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time
              </Label>
              <DatePicker
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(value) => setFormData({ ...formData, endTime: value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(selectedEvent.startTime), 'PPpp')} -{' '}
                    {format(new Date(selectedEvent.endTime), 'PPpp')}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">
                  {selectedEvent?.status.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedEvent?.status === 'SWAPPABLE' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : selectedEvent?.status === 'SWAP_PENDING'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {selectedEvent?.status}
              </div>
            </div>
            <Button
              onClick={handleToggleSwappable}
              variant={selectedEvent?.status === 'SWAPPABLE' ? 'secondary' : 'default'}
              disabled={updateMutation.isPending || selectedEvent?.status === 'SWAP_PENDING'}
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {selectedEvent?.status === 'SWAPPABLE' ? 'Make Busy' : 'Make Swappable'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

