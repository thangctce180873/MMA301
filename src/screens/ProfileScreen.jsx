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

      const [totalListings, favorites] = await Promise.all([
        getUserListingCount(user),
        getFavoriteCount(user),
      ]);

      setTotalListingCount(totalListings);
      setFavoriteCount(favorites);
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);

      setTotalListingCount(0);
      setFavoriteCount(0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, [loadCounts]),
  );

  const openManageListings = () => {
    navigation.navigate("ManageListings");
  };

  const openManageFavorites = () => {
    navigation.navigate("ManageFavorites");
  };

  const openPersonalInfo = () => {
    navigation.navigate("PersonalInfo");
  };

  const pickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Không có quyền truy cập",
          "Bạn cần cấp quyền truy cập thư viện ảnh để chọn avatar.",
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

      if (!updateResult.success) {
        Alert.alert("Cập nhật thất bại", updateResult.message);

        return;
      }

      Alert.alert("Cập nhật thành công", "Ảnh đại diện đã được thay đổi.");
    } catch (error) {
      console.error("Lỗi khi cập nhật avatar:", error);

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

              if (!result.success) {
                Alert.alert("Xóa ảnh thất bại", result.message);
              }
            } catch (error) {
              console.error("Lỗi khi xóa avatar:", error);

              Alert.alert("Có lỗi xảy ra", "Không thể xóa ảnh đại diện.");
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

            if (!result.success) {
              Alert.alert("Đăng xuất thất bại", result.message);
            }
          },
        },
      ],
    );
  };

  const initials = getUserInitials(user?.name);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.pageTitle}>Tài khoản</Text>

            <Text style={styles.pageSubtitle}>Quản lý thông tin của bạn</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.settingsButton}
            onPress={openPersonalInfo}
          >
            <Ionicons name="settings-outline" size={23} color="#7A8450" />
          </TouchableOpacity>
        </View>

        {/* Thông tin người dùng */}
        <View style={styles.profileHeader}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.largeAvatar}
              onPress={handleAvatarPress}
              disabled={updatingAvatar}
            >
              {user?.avatarUri ? (
                <Image
                  source={{
                    uri: user.avatarUri,
                  }}
                  style={styles.largeAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.largeAvatarText}>{initials}</Text>
              )}

              <View style={styles.avatarCameraBadge}>
                {updatingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.name || "Người dùng"}
              </Text>

              <Text style={styles.profileSubtitle}>Thành viên Night Sweet</Text>

              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#7A8450" />

                <Text style={styles.verifiedText}>ĐÃ XÁC THỰC</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.changeAvatarButton}
              onPress={handleAvatarPress}
              disabled={updatingAvatar}
            >
              <Ionicons name="camera-outline" size={18} color="#7A8450" />

              <Text style={styles.changeAvatarText}>Thay đổi ảnh đại diện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editProfileButton}
              onPress={openPersonalInfo}
            >
              <Ionicons name="create-outline" size={18} color="#8B5E3C" />

              <Text style={styles.editProfileText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>

        {/* Menu tài khoản */}
        <View style={styles.menuContainer}>
          <MenuItem
            iconName="person-outline"
            title="Thông tin cá nhân"
            description="Xem và chỉnh sửa thông tin tài khoản"
            onPress={openPersonalInfo}
          />

          <MenuItem
            iconName="heart-outline"
            title="Sản phẩm đã lưu"
            description={`${favoriteCount} sản phẩm đã lưu`}
            onPress={openManageFavorites}
          />

          <MenuItem
            iconName="cube-outline"
            title="Quản lý tin đăng"
            description={`${totalListingCount} tin đăng của bạn`}
            showBorder={false}
            onPress={openManageListings}
          />
        </View>

        {/* Thông tin ứng dụng */}
        <View style={styles.appCard}>
          <View style={styles.appLogo}>
            <Ionicons name="moon" size={27} color="#FFFFFF" />
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>Night Sweet</Text>

            <Text style={styles.appDescription}>Chợ sinh viên</Text>
          </View>

          <Text style={styles.appVersion}>v1.0.0</Text>
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#B44A4A" />

          <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  iconName,
  title,
  description,
  onPress,
  showBorder = true,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.menuItem, showBorder && styles.menuItemBorder]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={iconName} size={21} color="#7A8450" />
      </View>

      <View style={styles.menuTextContainer}>
        <Text style={styles.menuItemTitle}>{title}</Text>

        <Text numberOfLines={1} style={styles.menuItemDescription}>
          {description}
        </Text>
      </View>

      {onPress ? (
        <Ionicons name="chevron-forward" size={19} color="#A1A18E" />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFCF8",
  },

  scrollContent: {
    paddingBottom: 120,
  },

  topHeader: {
    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  pageTitle: {
    color: "#4A4A3A",
    fontSize: 24,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: "#A1A18E",
    fontSize: 12,

    marginTop: 3,
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",
  },

  profileHeader: {
    backgroundColor: "#FFFFFF",

    padding: 22,

    marginHorizontal: 20,
    marginBottom: 24,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 24,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.05,
    shadowRadius: 4,

    elevation: 2,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  largeAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#D6CEB8",

    borderWidth: 4,
    borderColor: "#FFFFFF",

    marginRight: 18,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,
    shadowRadius: 5,

    elevation: 4,
  },

  largeAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },

  largeAvatarText: {
    color: "#8A8A75",
    fontSize: 21,
    fontWeight: "800",
  },

  avatarCameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 1,

    width: 32,
    height: 32,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    color: "#4A4A3A",
    fontSize: 23,
    fontWeight: "800",
  },

  profileSubtitle: {
    color: "#8A8A75",
    fontSize: 13,

    marginTop: 4,
  },

  verifiedBadge: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 15,

    marginTop: 9,
  },

  verifiedText: {
    color: "#7A8450",
    fontSize: 9,
    fontWeight: "800",

    marginLeft: 4,
  },

  profileActions: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 17,
  },

  changeAvatarButton: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 10,
    paddingVertical: 10,

    borderRadius: 14,

    marginRight: 5,
  },

  changeAvatarText: {
    color: "#7A8450",
    fontSize: 10,
    fontWeight: "800",

    marginLeft: 6,
  },

  editProfileButton: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FAF1E9",

    paddingHorizontal: 10,
    paddingVertical: 10,

    borderRadius: 14,

    marginLeft: 5,
  },

  editProfileText: {
    color: "#8B5E3C",
    fontSize: 10,
    fontWeight: "800",

    marginLeft: 6,
  },

  sectionLabel: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.8,

    marginHorizontal: 24,
    marginBottom: 8,
  },

  menuContainer: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 17,

    marginHorizontal: 20,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 23,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.04,
    shadowRadius: 4,

    elevation: 2,
  },

  menuItem: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  menuIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    marginRight: 12,
  },

  menuTextContainer: {
    flex: 1,
  },

  menuItemTitle: {
    color: "#4A4A3A",
    fontSize: 14,
    fontWeight: "700",
  },

  menuItemDescription: {
    color: "#A1A18E",
    fontSize: 10,

    marginTop: 3,
  },

  appCard: {
    minHeight: 70,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 15,

    marginHorizontal: 20,
    marginTop: 20,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 20,
  },

  appLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    marginRight: 12,
  },

  appInfo: {
    flex: 1,
  },

  appName: {
    color: "#4A4A3A",
    fontSize: 14,
    fontWeight: "800",
  },

  appDescription: {
    color: "#A1A18E",
    fontSize: 10,

    marginTop: 2,
  },

  appVersion: {
    color: "#A1A18E",
    fontSize: 10,
  },

  logoutButton: {
    height: 52,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF4F4",

    marginHorizontal: 20,
    marginTop: 20,

    borderWidth: 1,
    borderColor: "#F1CECE",
    borderRadius: 16,
  },

  logoutText: {
    color: "#B44A4A",
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 7,
  },
});
