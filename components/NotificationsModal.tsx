"use client"

import { FC, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Check, CheckCheck, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  devis?: {
    id: string
    clientName: string
  }
  isRead: boolean
  createdAt: string
  readAt?: string
}

interface NotificationsModalProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationRead?: () => void
  unreadCount: number
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) return "à l'instant"
  if (secondsAgo < 3600) return `il y a ${Math.floor(secondsAgo / 60)} min`
  if (secondsAgo < 86400) return `il y a ${Math.floor(secondsAgo / 3600)}h`
  if (secondsAgo < 604800) return `il y a ${Math.floor(secondsAgo / 86400)}j`

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }
  return date.toLocaleDateString("fr-FR", options)
}

export const NotificationsModal: FC<NotificationsModalProps> = ({
  userId,
  open,
  onOpenChange,
  onNotificationRead,
  unreadCount,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&unreadOnly=false&page=1&limit=20`
      )
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      // Supprimer de l'état local
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      )

      onNotificationRead?.()
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, userId }),
      })

      setNotifications([])
      onNotificationRead?.()
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      })

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const currentUnreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle className="text-xl font-bold">Notifications</DialogTitle>
            {currentUnreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {currentUnreadCount} non lue{currentUnreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            {currentUnreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Marquer tout
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              Chargement des notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                        {notification.message}
                      </p>

                      {notification.devis && (
                        <p className="text-sm text-gray-500 mb-1">
                          <span className="font-medium">Devis:</span> {notification.devis.clientName}
                        </p>
                      )}

                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          title="Marquer comme lue et supprimer"
                        >
                          <Check className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              className="w-full"
            >
              Actualiser
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}