import { COLORS } from "../constants/colors";
import React, { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
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

import {
  formatConversationTime,
  getOtherParticipant,
  getUnreadMessageCount,
  getUserConversations,
  getUserRoleInConversation,
} from "../utils/chatUtils";

const getLastMessage = (conversation) => {
  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];

  if (messages.length === 0) {
    return null;
  }

  return messages[messages.length - 1];
};

const getLastMessageContent = (conversation) => {
  const lastMessage = getLastMessage(conversation);

  return (
    lastMessage?.content ||
    lastMessage?.text ||
    lastMessage?.message ||
    "Chưa có tin nhắn"
  );
};

const getConversationTime = (conversation) => {
  const lastMessage = getLastMessage(conversation);

  return (
    lastMessage?.createdAt || conversation?.updatedAt || conversation?.createdAt
  );
};

const getItemTitle = (conversation) => {
  return (
    conversation?.itemTitle ||
    conversation?.productTitle ||
    conversation?.item?.title ||
    conversation?.product?.title ||
    "Sản phẩm"
  );
};

const getItemImage = (conversation) => {
  return (
    conversation?.itemImageUri ||
    conversation?.productImageUri ||
    conversation?.item?.imageUri ||
    conversation?.product?.imageUri ||
    ""
  );
};

export default function ConversationsScreen({ navigation }) {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const result = await getUserConversations(user);

      const storedConversations = Array.isArray(result)
        ? result
        : Array.isArray(result?.conversations)
          ? result.conversations
          : [];

      const sortedConversations = [...storedConversations].sort(
        (firstConversation, secondConversation) => {
          const firstTime = new Date(
            getConversationTime(firstConversation) || 0,
          ).getTime();

          const secondTime = new Date(
            getConversationTime(secondConversation) || 0,
          ).getTime();

          return secondTime - firstTime;
        },
      );

      setConversations(sortedConversations);
    } catch (error) {
      console.error("Lỗi khi tải cuộc trò chuyện:", error);

      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations]),
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const otherParticipant = getOtherParticipant(conversation, user);

      const searchContent = [
        otherParticipant?.name,
        otherParticipant?.email,
        getItemTitle(conversation),
        getLastMessageContent(conversation),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchContent.includes(normalizedQuery);
    });
  }, [conversations, searchQuery, user]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((total, conversation) => {
      return total + Number(getUnreadMessageCount(conversation, user));
    }, 0);
  }, [conversations, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const openConversation = (conversation) => {
    navigation.navigate("Messages", {
      conversationId: conversation.id,
    });
  };

  const renderConversation = ({ item }) => {
    const otherParticipant = getOtherParticipant(item, user);

    const currentUserRole = getUserRoleInConversation(item, user);

    const unreadCount = Number(getUnreadMessageCount(item, user)) || 0;

    const hasUnread = unreadCount > 0;

    const itemImage = getItemImage(item);

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={[
          styles.conversationCard,

          hasUnread && styles.unreadConversationCard,
        ]}
        onPress={() => openConversation(item)}
      >
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {otherParticipant?.avatarUri || otherParticipant?.avatar ? (
              <Image
                source={{
                  uri: otherParticipant.avatarUri || otherParticipant.avatar,
                }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {getUserInitials(otherParticipant?.name)}
              </Text>
            )}
          </View>

          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              numberOfLines={1}
              style={[styles.userName, hasUnread && styles.unreadText]}
            >
              {otherParticipant?.name || "Người dùng"}
            </Text>

            <Text style={[styles.timeText, hasUnread && styles.unreadTimeText]}>
              {formatConversationTime(getConversationTime(item))}
            </Text>
          </View>

          <View style={styles.productReference}>
            <Ionicons name="cube-outline" size={13} color={COLORS.primary} />

            <Text numberOfLines={1} style={styles.productTitle}>
              {getItemTitle(item)}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {currentUserRole === "seller" ? "NGƯỜI BÁN" : "NGƯỜI MUA"}
              </Text>
            </View>
          </View>

          <View style={styles.messageRow}>
            <Text
              numberOfLines={1}
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
            >
              {getLastMessageContent(item)}
            </Text>

            {hasUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : (
              <Ionicons
                name="checkmark-done"
                size={16}
                color={COLORS.success}
              />
            )}
          </View>
        </View>

        {itemImage ? (
          <Image
            source={{
              uri: itemImage,
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Tin nhắn</Text>

          <Text style={styles.pageSubtitle}>
            {totalUnreadCount > 0
              ? `${totalUnreadCount} tin nhắn chưa đọc`
              : "Trò chuyện với người mua và người bán"}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={23}
            color={COLORS.primary}
          />

          {totalUnreadCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={21} color={COLORS.textMuted} />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm cuộc trò chuyện..."
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />

          {searchQuery.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredConversations}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,

            filteredConversations.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={47}
                  color={COLORS.textMuted}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? "Không tìm thấy cuộc trò chuyện"
                  : "Chưa có cuộc trò chuyện"}
              </Text>

              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? "Hãy thử tìm kiếm bằng tên người dùng hoặc tên sản phẩm khác."
                  : "Khi bạn nhắn tin về một sản phẩm, cuộc trò chuyện sẽ xuất hiện tại đây."}
              </Text>

              {!searchQuery ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.exploreButton}
                  onPress={() => navigation.navigate("Home")}
                >
                  <Ionicons
                    name="search-outline"
                    size={19}
                    color={COLORS.white}
                  />

                  <Text style={styles.exploreButtonText}>
                    KHÁM PHÁ SẢN PHẨM
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingVertical: 14,

    backgroundColor: COLORS.background,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,

    marginTop: 3,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,

    minWidth: 19,
    height: 19,
    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 4,

    borderWidth: 2,
    borderColor: COLORS.white,
  },

  headerBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "800",
  },

  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 10,

    backgroundColor: COLORS.background,
  },

  searchContainer: {
    width: "100%",
    height: 52,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingLeft: 14,
    paddingRight: 8,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  searchInput: {
    flex: 1,
    height: 50,

    color: COLORS.text,
    fontSize: 13,

    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "transparent",
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.background,
  },

  loadingText: {
    color: COLORS.textSecondary,

    fontSize: 13,

    marginTop: 12,
  },

  list: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  listContent: {
    flexGrow: 1,

    paddingBottom: 25,

    backgroundColor: COLORS.background,
  },

  emptyListContent: {
    flexGrow: 1,

    backgroundColor: COLORS.background,
  },

  conversationCard: {
    minHeight: 91,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 20,
    paddingVertical: 11,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  unreadConversationCard: {
    backgroundColor: COLORS.primarySoft,
  },

  avatarWrapper: {
    position: "relative",

    marginRight: 11,
  },

  avatar: {
    width: 53,
    height: 53,
    borderRadius: 27,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    color: COLORS.primaryDark,

    fontSize: 14,
    fontWeight: "800",
  },

  onlineBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,

    width: 13,
    height: 13,
    borderRadius: 7,

    backgroundColor: COLORS.success,

    borderWidth: 2,
    borderColor: COLORS.white,
  },

  conversationContent: {
    flex: 1,
    minWidth: 0,
  },

  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userName: {
    flex: 1,

    color: COLORS.textSecondary,

    fontSize: 14,
    fontWeight: "700",

    marginRight: 8,
  },

  unreadText: {
    color: COLORS.text,
    fontWeight: "800",
  },

  timeText: {
    color: COLORS.textMuted,
    fontSize: 8,
  },

  unreadTimeText: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  productReference: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 4,
  },

  productTitle: {
    flex: 1,

    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "700",

    marginLeft: 4,
  },

  roleBadge: {
    backgroundColor: COLORS.primaryLight,

    paddingHorizontal: 6,
    paddingVertical: 3,

    borderRadius: 8,

    marginLeft: 5,
  },

  roleBadgeText: {
    color: COLORS.primary,
    fontSize: 6,
    fontWeight: "800",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 5,
  },

  lastMessage: {
    flex: 1,

    color: COLORS.textMuted,
    fontSize: 11,

    marginRight: 7,
  },

  unreadMessage: {
    color: COLORS.textSecondary,

    fontWeight: "700",
  },

  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 5,
  },

  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "800",
  },

  productImage: {
    width: 48,
    height: 48,
    borderRadius: 13,

    marginLeft: 9,
  },

  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 36,

    backgroundColor: COLORS.background,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 27,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",

    textAlign: "center",

    marginTop: 17,
  },

  emptyDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    marginTop: 7,
  },

  exploreButton: {
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 18,

    borderRadius: 16,

    marginTop: 20,
  },

  exploreButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 7,
  },
});
