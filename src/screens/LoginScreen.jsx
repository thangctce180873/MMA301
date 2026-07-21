import { COLORS } from "../constants/colors";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";

const APP_LOGO = require("../assets/logo.png");
const LOGIN_BACKGROUND = require("../assets/banner.png");

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors = {};

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleEmailChange = (value) => {
    setEmail(value);

    if (errors.email) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        email: null,
      }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);

    if (errors.password) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        password: null,
      }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm() || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const result = await login({
        email: email.trim().toLowerCase(),

        password,
      });

      if (!result?.success) {
        Alert.alert(
          "Đăng nhập thất bại",
          result?.message || "Email hoặc mật khẩu không đúng.",
        );
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể đăng nhập vào lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <ImageBackground
            source={LOGIN_BACKGROUND}
            style={styles.hero}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.brandRow}>
                <View style={styles.logoBox}>
                  <Image
                    source={APP_LOGO}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                <View>
                  <Text style={styles.brandName}>Night Sweet</Text>

                  <Text style={styles.brandSubtitle}>CHỢ SINH VIÊN</Text>
                </View>
              </View>

              <View>
                <Text style={styles.heroTitle}>Chào mừng trở lại</Text>

                <Text style={styles.heroDescription}>
                  Đăng nhập để mua bán, trò chuyện và quản lý sản phẩm của bạn.
                </Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Đăng nhập</Text>

            <Text style={styles.formSubtitle}>
              Nhập thông tin tài khoản Night Sweet
            </Text>

            <Text style={styles.label}>EMAIL</Text>

            <View
              style={[
                styles.inputContainer,

                errors.email && styles.errorBorder,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.textMuted}
              />

              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="example@email.com"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                style={styles.input}
              />
            </View>

            <ErrorText message={errors.email} />

            <Text style={styles.label}>MẬT KHẨU</Text>

            <View
              style={[
                styles.inputContainer,

                errors.password && styles.errorBorder,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.textMuted}
              />

              <TextInput
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                style={styles.input}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.passwordButton}
                onPress={() =>
                  setShowPassword((previousValue) => !previousValue)
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ErrorText message={errors.password} />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              style={[styles.loginButton, submitting && styles.disabledButton]}
              onPress={handleLogin}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="log-in-outline"
                    size={21}
                    color={COLORS.white}
                  />

                  <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerQuestion}>Chưa có tài khoản?</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={23}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>An toàn và riêng tư</Text>

                <Text style={styles.infoDescription}>
                  Thông tin đăng nhập chỉ được lưu trên thiết bị trong quá trình
                  thử nghiệm ứng dụng.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ErrorText({ message }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.errorText}>{message}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },

  hero: {
    height: 300,
  },

  heroImage: {
    resizeMode: "cover",
  },

  heroOverlay: {
    flex: 1,
    justifyContent: "space-between",

    backgroundColor: "rgba(48,43,73,0.54)",

    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 52,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.94)",

    padding: 5,

    overflow: "hidden",

    marginRight: 11,
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  brandName: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
  },

  brandSubtitle: {
    color: "rgba(255,255,255,0.80)",

    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.8,

    marginTop: 2,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 29,
    fontWeight: "800",
  },

  heroDescription: {
    maxWidth: 320,

    color: "rgba(255,255,255,0.88)",

    fontSize: 13,
    lineHeight: 20,

    marginTop: 8,
  },

  formContainer: {
    flex: 1,

    backgroundColor: COLORS.background,

    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 35,

    marginTop: -24,

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  formTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  formSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,

    marginTop: 4,
    marginBottom: 8,
  },

  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,

    marginTop: 18,
    marginBottom: 8,
  },

  inputContainer: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingLeft: 14,
    paddingRight: 8,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },

  input: {
    flex: 1,
    height: 51,

    color: COLORS.text,
    fontSize: 14,

    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  passwordButton: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",
  },

  errorBorder: {
    borderColor: COLORS.danger,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "600",

    marginTop: 5,
  },

  loginButton: {
    height: 55,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    borderRadius: 17,

    marginTop: 27,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.18,
    shadowRadius: 10,

    elevation: 4,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 22,
  },

  registerQuestion: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  registerText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 5,
  },

  infoCard: {
    flexDirection: "row",

    backgroundColor: COLORS.primarySoft,

    padding: 14,

    borderRadius: 18,

    marginTop: 28,
  },

  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  infoDescription: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,

    marginTop: 3,
  },
});
