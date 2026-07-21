import { COLORS } from "../constants/colors";
import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import { getUserInitials } from "../utils/authUtils";

import { getFavoriteCount, getUserListingCount } from "../utils/itemUtils";

const APP_LOGO = require("../assets/logo.png");

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();

  const [totalListingCount, setTotalListingCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      if (!user) {
        setTotalListingCount(0);
        setFavoriteCount(0);
        return;
      }

      const [listingCount, savedCount] = await Promise.all([
        getUserListingCount(user),
        getFavoriteCount(user),
      ]);

      setTotalListingCount(Number(listingCount) || 0);
      setFavoriteCount(Number(savedCount) || 0);
    } catch (error) {
      console.error("Lỗi khi tải thống kê tài khoản:", error);

      setTotalListingCount(0);
      setFavoriteCount(0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, [loadCounts]),
  );

  const pickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Không có quyền truy cập",
          "Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUpdatingAvatar(true);

      const updateResult = await updateProfile({
        avatarUri: result.assets[0].uri,
      });

      if (!updateResult?.success) {
        Alert.alert(
          "Cập nhật thất bại",
          updateResult?.message || "Không thể cập nhật ảnh đại diện.",
        );

        return;
      }

      Alert.alert("Cập nhật thành công", "Ảnh đại diện đã được thay đổi.");
    } catch (error) {
      console.error("Lỗi khi cập nhật ảnh đại diện:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const removeAvatar = () => {
    Alert.alert(
      "Xóa ảnh đại diện",
      "Bạn có chắc chắn muốn xóa ảnh đại diện không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",

          onPress: async () => {
            try {
              setUpdatingAvatar(true);

              const result = await updateProfile({
                avatarUri: "",
              });

              if (!result?.success) {
                Alert.alert(
                  "Xóa ảnh thất bại",
                  result?.message || "Không thể xóa ảnh đại diện.",
                );
              }
            } catch (error) {
              console.error("Lỗi khi xóa ảnh đại diện:", error);
            } finally {
              setUpdatingAvatar(false);
            }
          },
        },
      ],
    );
  };

  const handleAvatarPress = () => {
    const options = [
      {
        text: "Chọn ảnh từ thư viện",
        onPress: pickAvatar,
      },
    ];

    if (user?.avatarUri) {
      options.push({
        text: "Xóa ảnh đại diện",
        style: "destructive",
        onPress: removeAvatar,
      });
    }

    options.push({
      text: "Hủy",
      style: "cancel",
    });

    Alert.alert("Ảnh đại diện", "Chọn thao tác", options);
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",

          onPress: async () => {
            const result = await logout();

            if (!result?.success) {
              Alert.alert(
                "Đăng xuất thất bại",
                result?.message || "Không thể đăng xuất.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Tài khoản</Text>

            <Text style={styles.pageSubtitle}>Quản lý hồ sơ của bạn</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={updatingAvatar}
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
          >
            {user?.avatarUri ? (
              <Image
                source={{ uri: user.avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {getUserInitials(user?.name)}
              </Text>
            )}

            <View style={styles.cameraBadge}>
              {updatingAvatar ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="camera" size={16} color={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{user?.name || "Người dùng"}</Text>

          <Text style={styles.profileEmail}>{user?.email || ""}</Text>

          <View style={styles.verifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={COLORS.success}
            />

            <Text style={styles.verifiedText}>TÀI KHOẢN ĐÃ XÁC THỰC</Text>
          </View>

          <View style={styles.profileActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.avatarButton}
              onPress={handleAvatarPress}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.avatarButtonText}>Đổi ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editButton}
              onPress={() => navigation.navigate("PersonalInfo")}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={COLORS.primaryDark}
              />

              <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            title="Thông tin cá nhân"
            description="Xem và chỉnh sửa hồ sơ tài khoản"
            onPress={() => navigation.navigate("PersonalInfo")}
          />

          <MenuItem
            icon="bookmark-outline"
            title="Sản phẩm đã lưu"
            description={`${favoriteCount} sản phẩm đang được lưu`}
            onPress={() => navigation.navigate("ManageFavorites")}
          />

          <MenuItem
            icon="cube-outline"
            title="Quản lý tin đăng"
            description={`${totalListingCount} tin đăng của bạn`}
            showBorder={false}
            onPress={() => navigation.navigate("ManageListings")}
          />
        </View>

        <View style={styles.appCard}>
          <View style={styles.appLogo}>
            <Image
              source={APP_LOGO}
              style={styles.appLogoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>Night Sweet</Text>

            <Text style={styles.appDescription}>
              Chợ mua bán dành cho sinh viên
            </Text>
          </View>

          <Text style={styles.appVersion}>v1.0.0</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />

          <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, title, description, onPress, showBorder = true }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.menuItem, showBorder && styles.menuItemBorder]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={21} color={COLORS.primary} />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>

        <Text numberOfLines={1} style={styles.menuDescription}>
          {description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  header: {
    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,

    marginTop: 3,
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  profileCard: {
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 20,
    paddingVertical: 23,

    marginHorizontal: 20,
    marginBottom: 24,

    borderRadius: 25,
  },

  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    borderWidth: 4,
    borderColor: COLORS.white,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },

  avatarText: {
    color: COLORS.primaryDark,
    fontSize: 23,
    fontWeight: "800",
  },

  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 2,

    width: 33,
    height: 33,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.white,
  },

  profileName: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",

    marginTop: 13,
  },

  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 11,

    marginTop: 3,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 14,

    marginTop: 10,
  },

  verifiedText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "800",

    marginLeft: 5,
  },

  profileActions: {
    width: "100%",
    flexDirection: "row",

    marginTop: 18,
  },

  avatarButton: {
    flex: 1,
    height: 43,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    borderRadius: 14,

    marginRight: 5,
  },

  avatarButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  editButton: {
    flex: 1,
    height: 43,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    borderRadius: 14,

    marginLeft: 5,
  },

  editButtonText: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,

    marginHorizontal: 24,
    marginBottom: 8,
  },

  menuCard: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 17,

    marginHorizontal: 20,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
  },

  menuItem: {
    minHeight: 69,

    flexDirection: "row",
    alignItems: "center",
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginRight: 12,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  menuDescription: {
    color: COLORS.textMuted,
    fontSize: 10,

    marginTop: 3,
  },

  appCard: {
    minHeight: 74,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 15,

    marginHorizontal: 20,
    marginTop: 20,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
  },

  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    padding: 4,
    overflow: "hidden",

    marginRight: 12,
  },

  appLogoImage: {
    width: "100%",
    height: "100%",
  },

  appInfo: {
    flex: 1,
  },

  appName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  appDescription: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginTop: 3,
  },

  appVersion: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  logoutButton: {
    height: 52,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.dangerLight,

    marginHorizontal: 20,
    marginTop: 20,

    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 17,
  },

  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 7,
  },
});
