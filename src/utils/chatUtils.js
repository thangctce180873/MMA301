import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createNotification,
  markConversationNotificationsAsRead,
} from "./notificationUtils";

const CONVERSATIONS_KEY = "@night_sweet_conversations";

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

export const getChatUserKey = (user) => {
  if (user?.id !== undefined && user?.id !== null && String(user.id).trim()) {
    return String(user.id);
  }

  const email = normalizeEmail(user?.email);

  if (email) {
    return `email:${email}`;
  }

  return "";
};

const getSellerKey = (item) => {
  if (
    item?.sellerId !== undefined &&
    item?.sellerId !== null &&
    String(item.sellerId).trim()
  ) {
    return String(item.sellerId);
  }

  const sellerEmail = normalizeEmail(item?.sellerEmail);

  if (sellerEmail) {
    return `email:${sellerEmail}`;
  }

  return "";
};

const createSafeId = (value) => {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 120);
};

const createConversationId = (itemId, buyerId, sellerId) => {
  return [
    "conversation",
    createSafeId(itemId),
    createSafeId(buyerId),
    createSafeId(sellerId),
  ].join("__");
};

const saveConversations = async (conversations) => {
  try {
    await AsyncStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations),
    );

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu cuộc trò chuyện:", error);

    return false;
  }
};

export const getAllConversations = async () => {
  try {
    const storedData = await AsyncStorage.getItem(CONVERSATIONS_KEY);

    if (!storedData) {
      return [];
    }

    const parsedData = JSON.parse(storedData);

    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Lỗi khi đọc cuộc trò chuyện:", error);

    return [];
  }
};

export const getConversationById = async (conversationId) => {
  try {
    const conversations = await getAllConversations();

    return (
      conversations.find(
        (conversation) => String(conversation.id) === String(conversationId),
      ) || null
    );
  } catch (error) {
    console.error("Lỗi khi tìm cuộc trò chuyện:", error);

    return null;
  }
};

export const getOtherParticipant = (conversation, currentUser) => {
  if (!conversation) {
    return null;
  }

  const currentUserId = getChatUserKey(currentUser);

  if (String(conversation.seller?.id) === currentUserId) {
    return conversation.buyer || null;
  }

  return conversation.seller || null;
};

export const getUserRoleInConversation = (conversation, currentUser) => {
  const currentUserId = getChatUserKey(currentUser);

  if (String(conversation?.seller?.id) === currentUserId) {
    return "seller";
  }

  if (String(conversation?.buyer?.id) === currentUserId) {
    return "buyer";
  }

  return null;
};

export const getOrCreateConversation = async (item, buyer) => {
  try {
    if (!item) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm",
      };
    }

    const buyerId = getChatUserKey(buyer);

    const sellerId = getSellerKey(item);

    if (!buyerId) {
      return {
        success: false,
        message: "Không xác định được tài khoản người mua",
      };
    }

    if (!sellerId) {
      return {
        success: false,
        message: "Không xác định được tài khoản người bán",
      };
    }

    if (buyerId === sellerId) {
      return {
        success: false,
        message: "Bạn không thể tự nhắn tin cho chính mình",
      };
    }

    const conversationId = createConversationId(item.id, buyerId, sellerId);

    const conversations = await getAllConversations();

    const existingIndex = conversations.findIndex(
      (conversation) => String(conversation.id) === conversationId,
    );

    const currentTime = new Date().toISOString();

    const sellerInfo = {
      id: sellerId,

      userId: item.sellerId ? String(item.sellerId) : "",

      name: item.sellerName || "Người bán",

      email: normalizeEmail(item.sellerEmail),

      phone: normalizePhone(item.sellerPhone),

      avatarUri: item.sellerAvatar || "",
    };

    const buyerInfo = {
      id: buyerId,

      userId: buyer?.id ? String(buyer.id) : "",

      name: buyer?.name || "Người mua",

      email: normalizeEmail(buyer?.email),

      phone: normalizePhone(buyer?.phone),

      avatarUri: buyer?.avatarUri || "",
    };

    if (existingIndex !== -1) {
      const existingConversation = conversations[existingIndex];

      const updatedConversation = {
        ...existingConversation,

        itemTitle: item.title || existingConversation.itemTitle,

        itemImageUri: item.imageUri || existingConversation.itemImageUri,

        itemPrice: item.price ?? existingConversation.itemPrice,

        seller: sellerInfo,

        buyer: buyerInfo,
      };

      conversations[existingIndex] = updatedConversation;

      await saveConversations(conversations);

      return {
        success: true,

        conversation: updatedConversation,
      };
    }

    const newConversation = {
      id: conversationId,

      itemId: String(item.id),

      itemTitle: item.title || "Sản phẩm",

      itemImageUri: item.imageUri || "",

      itemPrice: Number(item.price) || 0,

      seller: sellerInfo,

      buyer: buyerInfo,

      messages: [],

      createdAt: currentTime,

      updatedAt: currentTime,
    };

    const saved = await saveConversations([newConversation, ...conversations]);

    if (!saved) {
      return {
        success: false,
        message: "Không thể tạo cuộc trò chuyện",
      };
    }

    return {
      success: true,
      conversation: newConversation,
    };
  } catch (error) {
    console.error("Lỗi khi tạo cuộc trò chuyện:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi tạo cuộc trò chuyện",
    };
  }
};

export const getUserConversations = async (currentUser) => {
  try {
    const currentUserId = getChatUserKey(currentUser);

    if (!currentUserId) {
      return [];
    }

    const conversations = await getAllConversations();

    return conversations
      .filter((conversation) => {
        const sellerId = String(conversation.seller?.id || "");

        const buyerId = String(conversation.buyer?.id || "");

        return sellerId === currentUserId || buyerId === currentUserId;
      })
      .sort((first, second) => {
        const firstTime = new Date(
          first.updatedAt || first.createdAt || 0,
        ).getTime();

        const secondTime = new Date(
          second.updatedAt || second.createdAt || 0,
        ).getTime();

        return secondTime - firstTime;
      });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hội thoại:", error);

    return [];
  }
};

export const getUnreadMessageCount = (conversation, currentUser) => {
  const currentUserId = getChatUserKey(currentUser);

  if (!currentUserId) {
    return 0;
  }

  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];

  return messages.filter((message) => {
    const readBy = Array.isArray(message.readBy)
      ? message.readBy.map(String)
      : [];

    return (
      String(message.senderId) !== currentUserId &&
      !readBy.includes(currentUserId)
    );
  }).length;
};

export const sendConversationMessage = async (
  conversationId,
  currentUser,
  content,
) => {
  try {
    const messageContent = String(content || "").trim();

    if (!messageContent) {
      return {
        success: false,
        message: "Nội dung tin nhắn không được để trống",
      };
    }

    const currentUserId = getChatUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
        message: "Không xác định được tài khoản",
      };
    }

    const conversations = await getAllConversations();

    const conversationIndex = conversations.findIndex(
      (conversation) => String(conversation.id) === String(conversationId),
    );

    if (conversationIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cuộc trò chuyện",
      };
    }

    const conversation = conversations[conversationIndex];

    const sellerId = String(conversation.seller?.id || "");

    const buyerId = String(conversation.buyer?.id || "");

    if (currentUserId !== sellerId && currentUserId !== buyerId) {
      return {
        success: false,
        message: "Bạn không thuộc cuộc trò chuyện này",
      };
    }

    const currentTime = new Date().toISOString();

    const senderName = currentUser?.name || "Người dùng";

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,

      senderId: currentUserId,

      senderName,

      content: messageContent,

      createdAt: currentTime,

      readBy: [currentUserId],
    };

    const updatedConversation = {
      ...conversation,

      messages: [
        ...(Array.isArray(conversation.messages) ? conversation.messages : []),

        newMessage,
      ],

      updatedAt: currentTime,
    };

    conversations[conversationIndex] = updatedConversation;

    const saved = await saveConversations(conversations);

    if (!saved) {
      return {
        success: false,
        message: "Không thể gửi tin nhắn",
      };
    }

    const recipientId = currentUserId === sellerId ? buyerId : sellerId;

    if (recipientId && recipientId !== currentUserId) {
      await createNotification({
        recipientId,

        senderId: currentUserId,

        senderName,

        type: "message",

        title: `Tin nhắn từ ${senderName}`,

        body:
          messageContent.length > 100
            ? `${messageContent.slice(0, 100)}...`
            : messageContent,

        conversationId: updatedConversation.id,

        itemId: updatedConversation.itemId,
      });
    }

    return {
      success: true,

      message: "Đã gửi tin nhắn",

      conversation: updatedConversation,

      sentMessage: newMessage,
    };
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi gửi tin nhắn",
    };
  }
};

export const markConversationAsRead = async (conversationId, currentUser) => {
  try {
    const currentUserId = getChatUserKey(currentUser);

    if (!currentUserId) {
      return {
        success: false,
      };
    }

    const conversations = await getAllConversations();

    const conversationIndex = conversations.findIndex(
      (conversation) => String(conversation.id) === String(conversationId),
    );

    if (conversationIndex === -1) {
      return {
        success: false,
      };
    }

    const conversation = conversations[conversationIndex];

    const updatedMessages = (
      Array.isArray(conversation.messages) ? conversation.messages : []
    ).map((message) => {
      if (String(message.senderId) === currentUserId) {
        return message;
      }

      const readBy = Array.isArray(message.readBy)
        ? message.readBy.map(String)
        : [];

      if (readBy.includes(currentUserId)) {
        return message;
      }

      return {
        ...message,

        readBy: [...readBy, currentUserId],
      };
    });

    const updatedConversation = {
      ...conversation,

      messages: updatedMessages,
    };

    conversations[conversationIndex] = updatedConversation;

    await saveConversations(conversations);

    await markConversationNotificationsAsRead(conversationId, currentUser);

    return {
      success: true,

      conversation: updatedConversation,
    };
  } catch (error) {
    console.error("Lỗi khi đánh dấu đã đọc:", error);

    return {
      success: false,
    };
  }
};

export const formatMessageTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatConversationTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return formatMessageTime(date);
  }

  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};
