// lib/notification.service.ts
import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

export type NotificationPayload = {
  userId: string
  type: NotificationType
  title: string
  message: string
  devisId?: string
}

class NotificationService {
  /**
   * Crée une notification pour un utilisateur
   */
  async createNotification(payload: NotificationPayload) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          devisId: payload.devisId || null,
        },
        include: {
          user: { select: { id: true, email: true } },
          devis: { select: { id: true, clientName: true } },
        },
      })

      console.log("✅ Notification créée:", {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
      })

      return notification
    } catch (error) {
      console.error("❌ Erreur lors de la création de la notification:", error)
      throw error
    }
  }

  /**
   * Notifier tous les admins à propos d'une création de devis
   */
  async notifyAdminsAboutNewDevis(devis: any, createdByUser: any) {
    try {
      // Récupérer tous les ADMIN
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      })

      const notifications = await Promise.all(
        admins.map((admin) =>
          this.createNotification({
            userId: admin.id,
            type: "DEVIS_CREATED",
            title: "Nouveau devis créé",
            message: `Un nouveau devis a été créé par ${createdByUser.firstName} ${createdByUser.lastName} pour ${devis.clientName}. Montant: ${devis.total} TND`,
            devisId: devis.id,
          })
        )
      )

      console.log(`📢 ${notifications.length} admins notifiés`)
      return notifications
    } catch (error) {
      console.error("❌ Erreur lors de la notification des admins:", error)
    }
  }

  /**
   * Notifier un utilisateur lors d'un changement de statut admin
   */
  async notifyAboutStatusChange(
    devis: any,
    changedBy: any,
    oldStatus: string,
    newStatus: string
  ) {
    try {
      const createdBy = devis.createdBy

      const notification = await this.createNotification({
        userId: createdBy.id,
        type: "DEVIS_STATUS_CHANGED",
        title: `Devis ${newStatus}`,
        message: `Le statut de votre devis pour ${devis.clientName} a été changé de "${oldStatus}" à "${newStatus}" par ${changedBy.firstName} ${changedBy.lastName}.`,
        devisId: devis.id,
      })

      console.log(`📢 Utilisateur ${createdBy.id} notifié du changement de statut`)
      return notification
    } catch (error) {
      console.error("❌ Erreur lors de la notification de changement de statut:", error)
    }
  }

  /**
   * Récupérer toutes les notifications non lues d'un utilisateur
   */
  async getUnreadNotifications(userId: string) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        include: {
          devis: { select: { id: true, clientName: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      return notifications
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des notifications:", error)
      throw error
    }
  }

  /**
   * Récupérer toutes les notifications d'un utilisateur avec pagination
   */
  async getAllNotifications(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          include: {
            devis: { select: { id: true, clientName: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId } }),
      ])

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des notifications:", error)
      throw error
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return notification
    } catch (error) {
      console.error("❌ Erreur lors du marquage de la notification comme lue:", error)
      throw error
    }
  }

  /**
   * ✅ NOUVELLE MÉTHODE: Marquer une notification comme lue ET la supprimer
   */
  async markAsReadAndDelete(notificationId: string) {
    try {
      // 1️⃣ D'abord marquer comme lue
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      // 2️⃣ Puis supprimer la notification
      await prisma.notification.delete({
        where: { id: notificationId },
      })

      console.log(`✅ Notification ${notificationId} marquée comme lue et supprimée`)
      return { success: true }
    } catch (error) {
      console.error("❌ Erreur lors du marquage et suppression de la notification:", error)
      throw error
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      console.log(`✅ ${result.count} notifications marquées comme lues`)
      return result
    } catch (error) {
      console.error("❌ Erreur lors du marquage des notifications:", error)
      throw error
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string) {
    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      })

      console.log(`✅ Notification ${notificationId} supprimée`)
    } catch (error) {
      console.error("❌ Erreur lors de la suppression de la notification:", error)
      throw error
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      })

      return count
    } catch (error) {
      console.error("❌ Erreur lors du comptage des notifications non lues:", error)
      throw error
    }
  }
}

export const notificationService = new NotificationService()