'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, ArrowRightLeft, ArrowLeftRight, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/zustand'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

interface SwapRequest {
  id: string
  status: string
  requester: {
    id: string
    name: string
    email: string
  }
  requestedUser: {
    id: string
    name: string
    email: string
  }
  mySlot: {
    id: string
    title: string
    startTime: string
    endTime: string
  }
  theirSlot: {
    id: string
    title: string
    startTime: string
    endTime: string
  }
}

export default function RequestsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const { data: swapRequests = [] } = useQuery<SwapRequest[]>({
    queryKey: ['swapRequests'],
    queryFn: async () => {
      const response = await api.get('/swap/requests')
      return response.data
    },
  })

  const respondMutation = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const response = await api.post(`/swap/respond/${id}`, { accept })
      return response.data
    },
    onMutate: async ({ id, accept }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['swapRequests'] })

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData<SwapRequest[]>([
        'swapRequests',
      ])

      // Optimistically update to the new value
      if (previousRequests) {
        queryClient.setQueryData<SwapRequest[]>(['swapRequests'], (old) => {
          if (!old) return old
          return old.map((request) =>
            request.id === id
              ? { ...request, status: accept ? 'ACCEPTED' : 'REJECTED' }
              : request
          )
        })
      }

      // Return a context object with the snapshotted value
      return { previousRequests }
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRequests) {
        queryClient.setQueryData(['swapRequests'], context.previousRequests)
      }
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to respond to swap request',
        variant: 'destructive',
      })
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success!',
        description: variables.accept
          ? 'Swap request accepted'
          : 'Swap request rejected',
      })
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'] })
    },
  })

  const incomingRequests = swapRequests.filter(
    (request) => request.requestedUser.id === user?.id
  )

  const outgoingRequests = swapRequests.filter(
    (request) => request.requester.id === user?.id
  )

  const getStatusBadge = (status: string) => {
    const configs = {
      PENDING: {
        bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: Loader2,
      },
      ACCEPTED: {
        bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
      },
      REJECTED: {
        bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: XCircle,
      },
    }
    const config = configs[status as keyof typeof configs] || {
      bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      icon: Clock,
    }
    const Icon = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg}`}
      >
        <Icon className="h-3 w-3" />
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Swap Requests
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your incoming and outgoing swap requests
        </p>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Outgoing ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4 mt-6">
          {incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No incoming requests at the moment
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            incomingRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        {request.requester.name} wants to swap
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {request.requester.email}
                      </CardDescription>
                    </div>
                    {request.status !== 'PENDING' && getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">They want:</p>
                      </div>
                      <p className="font-semibold text-lg">{request.theirSlot.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(request.theirSlot.startTime), 'PPpp')} -{' '}
                        {format(new Date(request.theirSlot.endTime), 'PPpp')}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">For your:</p>
                      </div>
                      <p className="font-semibold text-lg">{request.mySlot.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(request.mySlot.startTime), 'PPpp')} -{' '}
                        {format(new Date(request.mySlot.endTime), 'PPpp')}
                      </p>
                    </div>
                  </div>
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() =>
                          respondMutation.mutate({ id: request.id, accept: true })
                        }
                        disabled={respondMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          respondMutation.mutate({ id: request.id, accept: false })
                        }
                        disabled={respondMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4 mt-6">
          {outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No outgoing requests at the moment
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            outgoingRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-primary" />
                        Request to {request.requestedUser.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {request.requestedUser.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Your slot:</p>
                      </div>
                      <p className="font-semibold text-lg">{request.mySlot.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(request.mySlot.startTime), 'PPpp')} -{' '}
                        {format(new Date(request.mySlot.endTime), 'PPpp')}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Their slot:</p>
                      </div>
                      <p className="font-semibold text-lg">{request.theirSlot.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(request.theirSlot.startTime), 'PPpp')} -{' '}
                        {format(new Date(request.theirSlot.endTime), 'PPpp')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
