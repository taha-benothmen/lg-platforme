// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { notificationService } from "@/lib/notification.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", success: false },
        { status: 400 }
      )
    }

    if (unreadOnly) {
      const notifications = await notificationService.getUnreadNotifications(userId)
      const count = notifications.length

      return NextResponse.json(
        {
          success: true,
          data: notifications,
          unreadCount: count,
        },
        { status: 200 }
      )
    }

    const result = await notificationService.getAllNotifications(userId, page, limit)

    return NextResponse.json(
      {
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Server error while fetching notifications", success: false },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, markAll, userId } = body

    if (!notificationId && !markAll) {
      return NextResponse.json(
        { error: "notificationId or markAll is required", success: false },
        { status: 400 }
      )
    }

    if (markAll && userId) {
      const result = await notificationService.markAllAsRead(userId)
      return NextResponse.json(
        {
          success: true,
          message: "All notifications marked as read",
          count: result.count,
        },
        { status: 200 }
      )
    }

    if (notificationId) {
      const notification = await notificationService.markAsRead(notificationId)
      return NextResponse.json(
        {
          success: true,
          message: "Notification marked as read",
          data: notification,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Server error while updating notification", success: false },
      { status: 500 }
    )
  }
}

// Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required", success: false },
        { status: 400 }
      )
    }

    await notificationService.deleteNotification(notificationId)

    return NextResponse.json(
      { success: true, message: "Notification deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Server error while deleting notification", success: false },
      { status: 500 }
    )
  }
}

// Get unread count
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", success: false },
        { status: 400 }
      )
    }

    const count = await notificationService.getUnreadCount(userId)

    return NextResponse.json(
      { success: true, unreadCount: count },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error getting unread count:", error)
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    )
  }
}