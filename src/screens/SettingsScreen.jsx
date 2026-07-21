import { COLORS } from "../constants/colors";
import React from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import BackButton from "../components/BackButton";

const APP_LOGO = require("../assets/logo.png");

export default function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Cài đặt ứng dụng</Text>

          <Text style={styles.headerSubtitle}>
            Quản lý tài khoản và ứng dụng
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={21} color={COLORS.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <View style={styles.logoContainer}>
            <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.introContent}>
            <Text style={styles.appName}>Night Sweet</Text>

            <Text style={styles.appDescription}>
              Cài đặt và quản lý ứng dụng của bạn
            </Text>
          </View>

          <View style={styles.activeBadge}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={COLORS.success}
            />

            <Text style={styles.activeText}>HOẠT ĐỘNG</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>

        <View style={styles.menuCard}>
          <SettingItem
            icon="person-outline"
            title="Thông tin cá nhân"
            description="Xem và chỉnh sửa hồ sơ tài khoản"
            onPress={() => navigation.navigate("PersonalInfo")}
          />

          <SettingItem
            icon="key-outline"
            title="Đổi mật khẩu"
            description="Cập nhật mật khẩu đăng nhập"
            onPress={() => navigation.navigate("ChangePassword")}
            showBorder={false}
          />
        </View>

        <Text style={styles.sectionTitle}>HOẠT ĐỘNG</Text>

        <View style={styles.menuCard}>
          <SettingItem
            icon="notifications-outline"
            title="Thông báo"
            description="Xem các thông báo của ứng dụng"
            onPress={() => navigation.navigate("Notifications")}
          />

          <SettingItem
            icon="bookmark-outline"
            title="Sản phẩm đã lưu"
            description="Quản lý các sản phẩm bạn đã lưu"
            onPress={() => navigation.navigate("ManageFavorites")}
          />

          <SettingItem
            icon="cube-outline"
            title="Tin đăng của tôi"
            description="Quản lý các sản phẩm đang đăng bán"
            onPress={() => navigation.navigate("ManageListings")}
            showBorder={false}
          />
        </View>

        <Text style={styles.sectionTitle}>ỨNG DỤNG</Text>

        <View style={styles.infoCard}>
          <InfoItem
            icon="language-outline"
            title="Ngôn ngữ"
            value="Tiếng Việt"
          />

          <InfoItem
            icon="phone-portrait-outline"
            title="Nền tảng"
            value="React Native"
          />

          <InfoItem
            icon="information-circle-outline"
            title="Phiên bản"
            value="1.0.0"
            showBorder={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Night Sweet</Text>

          <Text style={styles.footerText}>
            Chợ mua bán đồ cũ dành cho sinh viên
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ icon, title, description, onPress, showBorder = true }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.settingItem, showBorder && styles.itemBorder]}
      onPress={onPress}
    >
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={21} color={COLORS.primary} />
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>

        <Text numberOfLines={1} style={styles.itemDescription}>
          {description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function InfoItem({ icon, title, value, showBorder = true }) {
  return (
    <View style={[styles.infoItem, showBorder && styles.itemBorder]}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={21} color={COLORS.primary} />
      </View>

      <Text style={styles.infoTitle}>{title}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
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

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  introCard: {
    minHeight: 88,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 15,
    paddingVertical: 14,

    borderRadius: 22,
  },

  logoContainer: {
    width: 55,
    height: 55,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    padding: 5,

    marginRight: 12,
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  introContent: {
    flex: 1,
  },

  appName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  appDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,

    marginTop: 4,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 8,
    paddingVertical: 6,

    borderRadius: 12,
  },

  activeText: {
    color: COLORS.success,
    fontSize: 7,
    fontWeight: "800",

    marginLeft: 4,
  },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,

    marginTop: 23,
    marginBottom: 8,
    marginLeft: 4,
  },

  menuCard: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
  },

  settingItem: {
    minHeight: 69,

    flexDirection: "row",
    alignItems: "center",
  },

  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginRight: 12,
  },

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  itemDescription: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginTop: 3,
  },

  infoCard: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
  },

  infoItem: {
    minHeight: 64,

    flexDirection: "row",
    alignItems: "center",
  },

  infoTitle: {
    flex: 1,

    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  infoValue: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  footer: {
    alignItems: "center",

    paddingTop: 28,
  },

  footerTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  footerText: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginTop: 4,
  },
});
