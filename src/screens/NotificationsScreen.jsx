import { COLORS } from "../constants/colors";
import React, { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import BackButton from "../components/BackButton";

import { useAuth } from "../context/AuthContext";
import { formatTimeAgo } from "../utils/itemUtils";

import * as notificationUtils from "../utils/notificationUtils";

const unwrapArray = (result, possibleKeys = []) => {
  if (Array.isArray(result)) {
    return result;
  }

  for (const key of possibleKeys) {
    if (Array.isArray(result?.[key])) {
      return result[key];
    }
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
};

const getNotificationId = (notification) => {
  return notification?.id || notification?._id || notification?.notificationId;
};

const isNotificationRead = (notification) => {
  if (typeof notification?.isRead === "boolean") {
    return notification.isRead;
  }

  if (typeof notification?.read === "boolean") {
    return notification.read;
  }

  if (notification?.readAt || notification?.seenAt) {
    return true;
  }

  return false;
};

const getNotificationTitle = (notification) => {
  return notification?.title || notification?.heading || "Thông báo mới";
};

const getNotificationMessage = (notification) => {
  return (
    notification?.message ||
    notification?.body ||
    notification?.content ||
    notification?.description ||
    ""
  );
};

const getNotificationTime = (notification) => {
  return (
    notification?.createdAt ||
    notification?.timestamp ||
    notification?.time ||
    new Date().toISOString()
  );
};

const getNotificationType = (notification) => {
  return String(
    notification?.type || notification?.category || "general",
  ).toLowerCase();
};

const getNotificationIcon = (type) => {
  if (type.includes("message") || type.includes("chat")) {
    return {
      icon: "chatbubble-ellipses-outline",
      background: COLORS.primaryLight,
      color: COLORS.primary,
    };
  }

  if (
    type.includes("sold") ||
    type.includes("listing") ||
    type.includes("product")
  ) {
    return {
      icon: "cube-outline",
      background: COLORS.primarySoft,
      color: COLORS.primaryDark,
    };
  }

  if (
    type.includes("favorite") ||
    type.includes("heart") ||
    type.includes("save") ||
    type.includes("bookmark")
  ) {
    return {
      icon: "bookmark-outline",
      background: COLORS.primaryLight,
      color: COLORS.primary,
    };
  }

  if (
    type.includes("account") ||
    type.includes("security") ||
    type.includes("password")
  ) {
    return {
      icon: "shield-checkmark-outline",
      background: COLORS.primarySoft,
      color: COLORS.success,
    };
  }

  return {
    icon: "notifications-outline",
    background: COLORS.primaryLight,
    color: COLORS.primary,
  };
};

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [processingId, setProcessingId] = useState(null);

  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const getNotifications =
        notificationUtils.getUserNotifications ||
        notificationUtils.getNotificationsForUser ||
        notificationUtils.getNotifications;

      if (typeof getNotifications !== "function") {
        setNotifications([]);
        return;
      }

      const result = await getNotifications(user);

      const storedNotifications = unwrapArray(result, [
        "notifications",
        "items",
        "results",
      ]);

      storedNotifications.sort((firstNotification, secondNotification) => {
        const firstTime = new Date(
          getNotificationTime(firstNotification),
        ).getTime();

        const secondTime = new Date(
          getNotificationTime(secondNotification),
        ).getTime();

        return secondTime - firstTime;
      });

      setNotifications(storedNotifications);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !isNotificationRead(notification),
    ).length;
  }, [notifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markNotificationRead = async (notification) => {
    if (isNotificationRead(notification)) {
      return;
    }

    const notificationId = getNotificationId(notification);

    const markRead =
      notificationUtils.markNotificationAsRead || notificationUtils.markAsRead;

    if (typeof markRead !== "function" || !notificationId) {
      return;
    }

    try {
      if (markRead.length <= 1) {
        await markRead({
          notificationId,
          id: notificationId,
          currentUser: user,
          user,
        });
      } else {
        await markRead(notificationId, user);
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((currentNotification) => {
          if (
            String(getNotificationId(currentNotification)) !==
            String(notificationId)
          ) {
            return currentNotification;
          }

          return {
            ...currentNotification,
            isRead: true,
            read: true,
            readAt: new Date().toISOString(),
          };
        }),
      );
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  const handleNotificationPress = async (notification) => {
    await markNotificationRead(notification);

    const type = getNotificationType(notification);

    const itemId =
      notification?.itemId ||
      notification?.productId ||
      notification?.data?.itemId ||
      notification?.data?.productId;

    const conversationId =
      notification?.conversationId || notification?.data?.conversationId;

    if ((type.includes("message") || type.includes("chat")) && conversationId) {
      navigation.navigate("Messages", {
        conversationId,

        itemId: notification?.itemId || notification?.data?.itemId,
      });

      return;
    }

    if (itemId) {
      navigation.navigate("Detail", {
        itemId,
      });

      return;
    }

    if (type.includes("listing") || type.includes("sold")) {
      navigation.navigate("ManageListings");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    const markAll =
      notificationUtils.markAllNotificationsAsRead ||
      notificationUtils.markAllAsRead;

    if (typeof markAll !== "function") {
      return;
    }

    try {
      setMarkingAll(true);

      await markAll(user);

      const readAt = new Date().toISOString();

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
          read: true,
          readAt,
        })),
      );
    } catch (error) {
      console.error("Lỗi khi đọc tất cả thông báo:", error);

      Alert.alert(
        "Có lỗi xảy ra",
        "Không thể đánh dấu tất cả thông báo là đã đọc.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (!notificationId || processingId) {
      return;
    }

    const removeNotification =
      notificationUtils.deleteNotification ||
      notificationUtils.removeNotification;

    if (typeof removeNotification !== "function") {
      return;
    }

    try {
      setProcessingId(notificationId);

      if (removeNotification.length <= 1) {
        await removeNotification({
          notificationId,
          id: notificationId,
          currentUser: user,
          user,
        });
      } else {
        await removeNotification(notificationId, user);
      }

      setNotifications((previousNotifications) =>
        previousNotifications.filter(
          (currentNotification) =>
            String(getNotificationId(currentNotification)) !==
            String(notificationId),
        ),
      );
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể xóa thông báo.");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = (notification) => {
    Alert.alert(
      "Xóa thông báo",
      "Bạn có chắc chắn muốn xóa thông báo này không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",

          onPress: () => deleteNotification(notification),
        },
      ],
    );
  };

  const renderNotification = ({ item: notification }) => {
    const notificationId = getNotificationId(notification);

    const read = isNotificationRead(notification);

    const notificationStyle = getNotificationIcon(
      getNotificationType(notification),
    );

    const processing = String(processingId) === String(notificationId);

    const imageUri =
      notification?.imageUri ||
      notification?.itemImageUri ||
      notification?.data?.imageUri;

    return (
      <TouchableOpacity
        activeOpacity={0.76}
        disabled={processing}
        style={[
          styles.notificationCard,

          !read && styles.unreadNotificationCard,
        ]}
        onPress={() => handleNotificationPress(notification)}
        onLongPress={() => confirmDelete(notification)}
      >
        <View
          style={[
            styles.notificationIcon,

            {
              backgroundColor: notificationStyle.background,
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{
                uri: imageUri,
              }}
              style={styles.notificationImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={notificationStyle.icon}
              size={22}
              color={notificationStyle.color}
            />
          )}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              numberOfLines={1}
              style={[styles.notificationTitle, !read && styles.unreadTitle]}
            >
              {getNotificationTitle(notification)}
            </Text>

            {!read ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text numberOfLines={3} style={styles.notificationMessage}>
            {getNotificationMessage(notification)}
          </Text>

          <View style={styles.notificationFooter}>
            <View style={styles.timeRow}>
              <Ionicons
                name="time-outline"
                size={13}
                color={COLORS.textMuted}
              />

              <Text style={styles.timeText}>
                {formatTimeAgo(getNotificationTime(notification))}
              </Text>
            </View>

            <Text style={styles.openText}>Xem chi tiết</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={processing}
          style={styles.deleteButton}
          onPress={() => confirmDelete(notification)}
        >
          {processing ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <Ionicons name="close" size={18} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Thông báo</Text>

          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} thông báo chưa đọc`
              : "Bạn đã đọc tất cả thông báo"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          disabled={unreadCount === 0 || markingAll}
          style={[
            styles.markAllButton,

            unreadCount === 0 && styles.disabledButton,
          ]}
          onPress={handleMarkAllRead}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color={COLORS.success} />
          ) : (
            <Ionicons name="checkmark-done" size={22} color={COLORS.success} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>
            {notifications.length} thông báo
          </Text>

          <Text style={styles.summaryDescription}>
            {unreadCount > 0
              ? `Còn ${unreadCount} thông báo cần xem`
              : "Không có thông báo mới"}
          </Text>
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={markingAll}
            onPress={handleMarkAllRead}
          >
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(notification, index) =>
            String(getNotificationId(notification) || index)
          }
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,

            notifications.length === 0 && styles.emptyListContent,
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
                  name="notifications-off-outline"
                  size={47}
                  color={COLORS.textMuted}
                />
              </View>

              <Text style={styles.emptyTitle}>Chưa có thông báo</Text>

              <Text style={styles.emptyDescription}>
                Các cập nhật về sản phẩm, tin nhắn và tài khoản sẽ xuất hiện tại
                đây.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.exploreButton}
                onPress={() =>
                  navigation.navigate("MainTabs", {
                    screen: "Home",
                  })
                }
              >
                <Ionicons name="home-outline" size={19} color={COLORS.white} />

                <Text style={styles.exploreButtonText}>VỀ TRANG CHỦ</Text>
              </TouchableOpacity>
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
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,

    marginTop: 2,
  },

  markAllButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  disabledButton: {
    opacity: 0.45,
  },

  summaryCard: {
    minHeight: 75,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 15,

    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,

    borderRadius: 20,
  },

  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    marginRight: 11,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  summaryDescription: {
    color: COLORS.textSecondary,
    fontSize: 9,

    marginTop: 3,
  },

  markAllText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,

    marginTop: 12,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  notificationCard: {
    minHeight: 96,

    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: COLORS.card,

    padding: 12,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
  },

  unreadNotificationCard: {
    backgroundColor: COLORS.primarySoft,

    borderColor: COLORS.primaryLight,
  },

  notificationIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",

    marginRight: 11,
  },

  notificationImage: {
    width: "100%",
    height: "100%",
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,

    color: COLORS.textSecondary,

    fontSize: 13,
    fontWeight: "700",

    marginRight: 7,
  },

  unreadTitle: {
    color: COLORS.text,
    fontWeight: "800",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,

    backgroundColor: COLORS.primary,
  },

  notificationMessage: {
    color: COLORS.textSecondary,

    fontSize: 10,
    lineHeight: 16,

    marginTop: 5,
  },

  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: 8,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: COLORS.textMuted,
    fontSize: 8,

    marginLeft: 4,
  },

  openText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "800",
  },

  deleteButton: {
    width: 31,
    height: 31,
    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 5,
  },

  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 36,
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

    paddingHorizontal: 19,

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
