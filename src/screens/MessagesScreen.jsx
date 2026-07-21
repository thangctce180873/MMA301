import { COLORS } from "../constants/colors";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import { getUserInitials } from "../utils/authUtils";

import { formatPrice, getItemById } from "../utils/itemUtils";

import {
  formatMessageTime,
  getChatUserKey,
  getConversationById,
  getOrCreateConversation,
  getOtherParticipant,
  getUserRoleInConversation,
  markConversationAsRead,
  sendConversationMessage,
} from "../utils/chatUtils";

const resolveConversation = (result) => {
  if (!result) {
    return null;
  }

  if (result.conversation) {
    return result.conversation;
  }

  if (result.data?.conversation) {
    return result.data.conversation;
  }

  if (result.data) {
    return result.data;
  }

  return result;
};

const getMessageId = (message, index) => {
  return String(
    message?.id || message?._id || `${message?.createdAt}-${index}`,
  );
};

const getMessageContent = (message) => {
  return message?.content || message?.text || message?.message || "";
};

const getMessageSenderKey = (message) => {
  return String(
    message?.senderId ||
      message?.senderEmail ||
      message?.sender?.id ||
      message?.sender?.email ||
      "",
  );
};

const getConversationMessages = (conversation) => {
  return Array.isArray(conversation?.messages) ? conversation.messages : [];
};

const getConversationItemId = (conversation, routeItemId) => {
  return (
    routeItemId ||
    conversation?.itemId ||
    conversation?.productId ||
    conversation?.item?.id ||
    conversation?.product?.id
  );
};

export default function MessagesScreen({ route, navigation }) {
  const { user } = useAuth();

  const flatListRef = useRef(null);

  const routeConversationId = route.params?.conversationId;

  const routeItemId = route.params?.itemId;

  const [conversation, setConversation] = useState(null);

  const [product, setProduct] = useState(null);

  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const currentUserKey = String(getChatUserKey(user));

  const messages = useMemo(
    () => getConversationMessages(conversation),
    [conversation],
  );

  const otherParticipant = useMemo(() => {
    if (!conversation) {
      return null;
    }

    return getOtherParticipant(conversation, user);
  }, [conversation, user]);

  const currentUserRole = useMemo(() => {
    if (!conversation) {
      return "";
    }

    return getUserRoleInConversation(conversation, user);
  }, [conversation, user]);

  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      let resolvedConversation = null;
      let resolvedProduct = null;

      if (routeConversationId) {
        const result = await getConversationById(routeConversationId);

        resolvedConversation = resolveConversation(result);
      } else if (routeItemId) {
        resolvedProduct = await getItemById(routeItemId);

        if (!resolvedProduct) {
          throw new Error("Không tìm thấy sản phẩm.");
        }

        const result = await getOrCreateConversation(resolvedProduct, user);

        resolvedConversation = resolveConversation(result);
      }

      if (!resolvedConversation) {
        throw new Error("Không tìm thấy cuộc trò chuyện.");
      }

      const itemId = getConversationItemId(resolvedConversation, routeItemId);

      if (!resolvedProduct && itemId) {
        try {
          resolvedProduct = await getItemById(itemId);
        } catch (error) {
          console.error("Lỗi khi tải sản phẩm trong cuộc trò chuyện:", error);

          resolvedProduct = null;
        }
      }

      await markConversationAsRead(resolvedConversation.id, user);

      const refreshedResult = await getConversationById(
        resolvedConversation.id,
      );

      const refreshedConversation = resolveConversation(refreshedResult);

      setConversation(refreshedConversation || resolvedConversation);

      setProduct(resolvedProduct);
    } catch (error) {
      console.error("Lỗi khi mở cuộc trò chuyện:", error);

      setConversation(null);

      setErrorMessage(error?.message || "Không thể mở cuộc trò chuyện.");
    } finally {
      setLoading(false);
    }
  }, [routeConversationId, routeItemId, user]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation]),
  );

  useEffect(() => {
    if (messages.length === 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: false,
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [messages]);

  const handleSendMessage = async () => {
    const content = messageText.trim();

    if (!content || sending || !conversation?.id) {
      return;
    }

    try {
      setSending(true);

      const result = await sendConversationMessage(
        conversation.id,
        user,
        content,
      );

      if (result?.success === false) {
        Alert.alert(
          "Gửi tin nhắn thất bại",
          result?.message || "Không thể gửi tin nhắn.",
        );

        return;
      }

      setMessageText("");

      const refreshedResult = await getConversationById(conversation.id);

      const refreshedConversation = resolveConversation(refreshedResult);

      if (refreshedConversation) {
        setConversation(refreshedConversation);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);

      Alert.alert(
        "Gửi tin nhắn thất bại",
        "Không thể gửi tin nhắn vào lúc này.",
      );
    } finally {
      setSending(false);
    }
  };

  const openProductDetail = () => {
    const itemId = getConversationItemId(conversation, routeItemId);

    if (!itemId) {
      Alert.alert(
        "Không thể mở sản phẩm",
        "Không tìm thấy mã sản phẩm của cuộc trò chuyện này.",
      );

      return;
    }

    navigation.navigate("Detail", {
      itemId,
    });
  };

  const renderMessage = ({ item }) => {
    const senderKey = getMessageSenderKey(item);

    const isCurrentUser = senderKey === currentUserKey;

    return (
      <View
        style={[
          styles.messageOuter,

          isCurrentUser ? styles.currentUserOuter : styles.otherUserOuter,
        ]}
      >
        {!isCurrentUser ? (
          <View style={styles.smallAvatar}>
            {otherParticipant?.avatarUri || otherParticipant?.avatar ? (
              <Image
                source={{
                  uri: otherParticipant.avatarUri || otherParticipant.avatar,
                }}
                style={styles.smallAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.smallAvatarText}>
                {getUserInitials(otherParticipant?.name)}
              </Text>
            )}
          </View>
        ) : null}

        <View
          style={[
            styles.messageBubble,

            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          <Text
            style={[
              styles.messageContent,

              isCurrentUser
                ? styles.currentUserMessage
                : styles.otherUserMessage,
            ]}
          >
            {getMessageContent(item)}
          </Text>

          <View style={styles.messageMeta}>
            <Text
              style={[
                styles.messageTime,

                isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>

            {isCurrentUser ? (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={COLORS.success}
                style={styles.readIcon}
              />
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />

        <Text style={styles.loadingText}>Đang mở cuộc trò chuyện...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !conversation) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top", "bottom"]}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={45}
            color={COLORS.textMuted}
          />
        </View>

        <Text style={styles.errorTitle}>Không thể mở cuộc trò chuyện</Text>

        <Text style={styles.errorDescription}>
          {errorMessage || "Cuộc trò chuyện không tồn tại."}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={loadConversation}
        >
          <Ionicons name="refresh-outline" size={19} color={COLORS.white} />

          <Text style={styles.retryButtonText}>THỬ LẠI</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={25} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.headerUser}>
            <View style={styles.headerAvatar}>
              {otherParticipant?.avatarUri || otherParticipant?.avatar ? (
                <Image
                  source={{
                    uri: otherParticipant.avatarUri || otherParticipant.avatar,
                  }}
                  style={styles.headerAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.headerAvatarText}>
                  {getUserInitials(otherParticipant?.name)}
                </Text>
              )}
            </View>

            <View style={styles.headerUserInfo}>
              <Text numberOfLines={1} style={styles.headerUserName}>
                {otherParticipant?.name || "Người dùng"}
              </Text>

              <Text style={styles.headerRole}>
                {currentUserRole === "seller"
                  ? "Bạn là người bán"
                  : "Bạn là người mua"}
              </Text>
            </View>
          </View>

          <View style={styles.headerAction}>
            <Ionicons name="cube-outline" size={21} color={COLORS.primary} />
          </View>
        </View>

        {product ? (
          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.productCard}
            onPress={openProductDetail}
            accessibilityRole="button"
            accessibilityLabel={`Xem chi tiết ${product.title}`}
          >
            <View style={styles.productImageContainer}>
              {product.imageUri ? (
                <Image
                  source={{
                    uri: product.imageUri,
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productPlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={25}
                    color={COLORS.textMuted}
                  />
                </View>
              )}
            </View>

            <View style={styles.productInfo}>
              <Text numberOfLines={1} style={styles.productTitle}>
                {product.title}
              </Text>

              <Text style={styles.productPrice}>
                {formatPrice(product.price)}
              </Text>
            </View>

            <View style={styles.productStatus}>
              <Text style={styles.productStatusText}>
                {product.status === "sold" ? "ĐÃ BÁN" : "ĐANG BÁN"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={getMessageId}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.messagesContent,

            messages.length === 0 && styles.emptyMessagesContent,
          ]}
          ListHeaderComponent={
            messages.length > 0 ? (
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>Cuộc trò chuyện</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <View style={styles.emptyMessagesIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={41}
                  color={COLORS.textMuted}
                />
              </View>

              <Text style={styles.emptyMessagesTitle}>
                Bắt đầu cuộc trò chuyện
              </Text>

              <Text style={styles.emptyMessagesDescription}>
                Gửi tin nhắn để trao đổi thêm về sản phẩm này.
              </Text>
            </View>
          }
        />

        <View style={styles.composerWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={1000}
              style={styles.messageInput}
            />

            <Ionicons name="happy-outline" size={21} color={COLORS.textMuted} />
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            disabled={!messageText.trim() || sending}
            style={[
              styles.sendButton,

              (!messageText.trim() || sending) && styles.disabledSendButton,
            ]}
            onPress={handleSendMessage}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={19} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.background,

    paddingHorizontal: 30,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,

    marginTop: 12,
  },

  errorIcon: {
    width: 86,
    height: 86,
    borderRadius: 27,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",

    textAlign: "center",

    marginTop: 16,
  },

  errorDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    marginTop: 6,
  },

  retryButton: {
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 20,

    borderRadius: 16,

    marginTop: 19,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 7,
  },

  header: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 27,
    height: 42,

    alignItems: "flex-start",
    justifyContent: "center",

    backgroundColor: "transparent",
  },

  headerUser: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    marginLeft: 4,
    marginRight: 10,
  },

  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",

    marginRight: 9,
  },

  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  headerAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },

  headerUserInfo: {
    flex: 1,
  },

  headerUserName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  headerRole: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginTop: 3,
  },

  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  productCard: {
    minHeight: 69,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 12,
    paddingVertical: 9,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 13,

    overflow: "hidden",

    backgroundColor: COLORS.imagePlaceholder,

    marginRight: 10,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  productPlaceholder: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  productTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  productPrice: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "800",

    marginTop: 4,
  },

  productStatus: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 10,

    marginRight: 7,
  },

  productStatusText: {
    color: COLORS.primary,
    fontSize: 7,
    fontWeight: "800",
  },

  messagesContent: {
    flexGrow: 1,

    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 16,
  },

  emptyMessagesContent: {
    justifyContent: "center",
  },

  dateBadge: {
    alignSelf: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 11,
    paddingVertical: 5,

    borderRadius: 12,

    marginBottom: 16,
  },

  dateBadgeText: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  messageOuter: {
    maxWidth: "83%",

    flexDirection: "row",
    alignItems: "flex-end",

    marginBottom: 10,
  },

  currentUserOuter: {
    alignSelf: "flex-end",
  },

  otherUserOuter: {
    alignSelf: "flex-start",
  },

  smallAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",

    marginRight: 6,
  },

  smallAvatarImage: {
    width: "100%",
    height: "100%",
  },

  smallAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 7,
    fontWeight: "800",
  },

  messageBubble: {
    maxWidth: "100%",

    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 7,
  },

  currentUserBubble: {
    backgroundColor: COLORS.primary,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 5,
  },

  otherUserBubble: {
    backgroundColor: COLORS.primarySoft,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 18,
  },

  messageContent: {
    fontSize: 13,
    lineHeight: 19,
  },

  currentUserMessage: {
    color: COLORS.white,
  },

  otherUserMessage: {
    color: COLORS.text,
  },

  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",

    marginTop: 4,
  },

  messageTime: {
    fontSize: 7,
  },

  currentUserTime: {
    color: "rgba(255,255,255,0.72)",
  },

  otherUserTime: {
    color: COLORS.textMuted,
  },

  readIcon: {
    marginLeft: 3,
  },

  emptyMessages: {
    alignItems: "center",

    paddingHorizontal: 35,
  },

  emptyMessagesIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  emptyMessagesTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",

    marginTop: 15,
  },

  emptyMessagesDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 18,

    textAlign: "center",

    marginTop: 6,
  },

  composerWrapper: {
    minHeight: 69,

    flexDirection: "row",
    alignItems: "flex-end",

    backgroundColor: COLORS.card,

    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 9,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  inputContainer: {
    flex: 1,

    minHeight: 42,
    maxHeight: 110,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingLeft: 12,
    paddingRight: 11,

    borderRadius: 17,
  },

  messageInput: {
    flex: 1,

    minHeight: 42,
    maxHeight: 105,

    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,

    paddingTop: 11,
    paddingBottom: 10,
    paddingRight: 8,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    marginLeft: 7,
  },

  disabledSendButton: {
    backgroundColor: COLORS.primaryLight,
  },
});
