"use client"

import { FC, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Check, CheckCheck } from "lucide-react"

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

interface NotificationCenterProps {
  userId: string
  onNotificationRead?: () => void
}

// Fonction pour formater le temps relatif sans date-fns
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

export const NotificationCenter: FC<NotificationCenterProps> = ({
  userId,
  onNotificationRead,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&unreadOnly=false&page=1&limit=10`
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

      // ✅ SUPPRIMER la notification (au lieu de juste la marquer comme lue)
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

      // ✅ SUPPRIMER TOUTES LES NOTIFICATIONS
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

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="w-full max-w-sm flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50 rounded-t-lg">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs h-7 px-2 flex-shrink-0"
          >
            <CheckCheck className="w-3 h-3 mr-1" />
            Tout
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-96 min-h-32">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Aucune notification
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-3 py-2 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-xs text-gray-900 leading-tight">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-0.5" />
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-tight">
                      {notification.message}
                    </p>

                    {notification.devis && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium">{notification.devis.clientName}</span>
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-5 w-5 p-0 hover:bg-blue-100"
                        title="Marquer comme lue et supprimer"
                      >
                        <Check className="w-3 h-3 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="h-5 w-5 p-0 hover:bg-red-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
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
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            className="w-full h-7 text-xs"
          >
            Actualiser
          </Button>
        </div>
      )}
    </div>
  )
}