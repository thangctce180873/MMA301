import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "@night_sweet_notifications";

export const getNotificationUserKey = (user) => {
  if (user?.id !== undefined && user?.id !== null && String(user.id).trim()) {
    return String(user.id);
  }

  const email = String(user?.email || "")
    .trim()
    .toLowerCase();

  if (email) {
    return `email:${email}`;
  }

  return "";
};

export const getAllNotifications = async () => {
  try {
    const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);

    if (!storedNotifications) {
      return [];
    }

    const parsedNotifications = JSON.parse(storedNotifications);

    return Array.isArray(parsedNotifications) ? parsedNotifications : [];
  } catch (error) {
    console.error("Lỗi khi đọc thông báo:", error);

    return [];
  }
};

const saveNotifications = async (notifications) => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(notifications),
    );

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu thông báo:", error);

    return false;
  }
};

export const createNotification = async ({
  recipientId,
  senderId = "",
  senderName = "",
  type = "general",
  title,
  body,
  conversationId = "",
  itemId = "",
}) => {
  try {
    const normalizedRecipientId = String(recipientId || "").trim();

    if (!normalizedRecipientId) {
      return {
        success: false,
        message: "Không xác định được người nhận thông báo",
      };
    }

    const notifications = await getAllNotifications();

    const currentTime = new Date().toISOString();

    const newNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,

      recipientId: normalizedRecipientId,

      senderId: String(senderId || ""),

      senderName: String(senderName || "").trim(),

      type,

      title: String(title || "Thông báo").trim(),

      body: String(body || "").trim(),

      conversationId: conversationId ? String(conversationId) : "",

      itemId: itemId ? String(itemId) : "",

      isRead: false,

      createdAt: currentTime,

      readAt: null,
    };

    const saved = await saveNotifications([newNotification, ...notifications]);

    if (!saved) {
      return {
        success: false,
        message: "Không thể lưu thông báo",
      };
    }

    return {
      success: true,
      notification: newNotification,
    };
  } catch (error) {
    console.error("Lỗi khi tạo thông báo:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi tạo thông báo",
    };
  }
};

export const getUserNotifications = async (currentUser) => {
  try {
    const currentUserId = getNotificationUserKey(currentUser);

    if (!currentUserId) {
      return [];
    }

    const notifications = await getAllNotifications();

    return notifications
      .filter(
        (notification) => String(notification.recipientId) === currentUserId,
      )
      .sort((first, second) => {
        const firstTime = new Date(first.createdAt || 0).getTime();

        const secondTime = new Date(second.createdAt || 0).getTime();

        return secondTime - firstTime;
      });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo người dùng:", error);

    return [];
  }
};

export const getUnreadNotificationCount = async (currentUser) => {
  try {
    const notifications = await getUserNotifications(currentUser);

    return notifications.filter((notification) => !notification.isRead).length;
  } catch (error) {
    console.error("Lỗi khi đếm thông báo chưa đọc:", error);

    return 0;
  }
};

export const markNotificationAsRead = async (notificationId, currentUser) => {
  try {
    const currentUserId = getNotificationUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
        message: "Không xác định được tài khoản",
      };
    }

    const notifications = await getAllNotifications();

    const notificationIndex = notifications.findIndex(
      (notification) =>
        String(notification.id) === String(notificationId) &&
        String(notification.recipientId) === currentUserId,
    );

    if (notificationIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy thông báo",
      };
    }

    const notification = notifications[notificationIndex];

    if (!notification.isRead) {
      notifications[notificationIndex] = {
        ...notification,

        isRead: true,

        readAt: new Date().toISOString(),
      };

      await saveNotifications(notifications);
    }

    return {
      success: true,

      notification: notifications[notificationIndex],
    };
  } catch (error) {
    console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);

    return {
      success: false,
      message: "Không thể cập nhật thông báo",
    };
  }
};

export const markAllNotificationsAsRead = async (currentUser) => {
  try {
    const currentUserId = getNotificationUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
        message: "Không xác định được tài khoản",
      };
    }

    const notifications = await getAllNotifications();

    const currentTime = new Date().toISOString();

    const updatedNotifications = notifications.map((notification) => {
      const belongsToUser = String(notification.recipientId) === currentUserId;

      if (!belongsToUser || notification.isRead) {
        return notification;
      }

      return {
        ...notification,

        isRead: true,

        readAt: currentTime,
      };
    });

    await saveNotifications(updatedNotifications);

    return {
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    };
  } catch (error) {
    console.error("Lỗi khi đánh dấu tất cả thông báo:", error);

    return {
      success: false,
      message: "Không thể cập nhật thông báo",
    };
  }
};

export const markConversationNotificationsAsRead = async (
  conversationId,
  currentUser,
) => {
  try {
    const currentUserId = getNotificationUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
      };
    }

    const notifications = await getAllNotifications();

    const currentTime = new Date().toISOString();

    const updatedNotifications = notifications.map((notification) => {
      const matchesUser = String(notification.recipientId) === currentUserId;

      const matchesConversation =
        String(notification.conversationId || "") ===
        String(conversationId || "");

      if (!matchesUser || !matchesConversation || notification.isRead) {
        return notification;
      }

      return {
        ...notification,

        isRead: true,

        readAt: currentTime,
      };
    });

    await saveNotifications(updatedNotifications);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật thông báo cuộc trò chuyện:", error);

    return {
      success: false,
    };
  }
};

export const deleteNotification = async (notificationId, currentUser) => {
  try {
    const currentUserId = getNotificationUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
        message: "Không xác định được tài khoản",
      };
    }

    const notifications = await getAllNotifications();

    const notificationExists = notifications.some(
      (notification) =>
        String(notification.id) === String(notificationId) &&
        String(notification.recipientId) === currentUserId,
    );

    if (!notificationExists) {
      return {
        success: false,
        message: "Không tìm thấy thông báo",
      };
    }

    const remainingNotifications = notifications.filter(
      (notification) =>
        !(
          String(notification.id) === String(notificationId) &&
          String(notification.recipientId) === currentUserId
        ),
    );

    await saveNotifications(remainingNotifications);

    return {
      success: true,
      message: "Đã xóa thông báo",
    };
  } catch (error) {
    console.error("Lỗi khi xóa thông báo:", error);

    return {
      success: false,
      message: "Không thể xóa thông báo",
    };
  }
};

export const clearUserNotifications = async (currentUser) => {
  try {
    const currentUserId = getNotificationUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
        message: "Không xác định được tài khoản",
      };
    }

    const notifications = await getAllNotifications();

    const remainingNotifications = notifications.filter(
      (notification) => String(notification.recipientId) !== currentUserId,
    );

    await saveNotifications(remainingNotifications);

    return {
      success: true,
      message: "Đã xóa toàn bộ thông báo",
    };
  } catch (error) {
    console.error("Lỗi khi xóa toàn bộ thông báo:", error);

    return {
      success: false,
      message: "Không thể xóa toàn bộ thông báo",
    };
  }
};

export const formatNotificationTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const difference = now.getTime() - date.getTime();

  const minute = 60 * 1000;

  const hour = 60 * minute;

  const day = 24 * hour;

  if (difference < minute) {
    return "Vừa xong";
  }

  if (difference < hour) {
    return `${Math.floor(difference / minute)} phút trước`;
  }

  if (difference < day) {
    return `${Math.floor(difference / hour)} giờ trước`;
  }

  if (difference < day * 7) {
    return `${Math.floor(difference / day)} ngày trước`;
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
