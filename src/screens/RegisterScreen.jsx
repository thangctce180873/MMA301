import { COLORS } from "../constants/colors";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
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

import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

const APP_LOGO = require("../assets/logo.png");

const initialFormData = {
  name: "",
  birthDate: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormData((previousData) => ({
      ...previousData,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [field]: null,
      }));
    }
  };

  const formatBirthDate = (value) => {
    const numbers = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 8);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  };

  const validateBirthDate = (value) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return false;
    }

    const [day, month, year] = value.split("/").map(Number);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date <= new Date()
    );
  };

  const validateForm = () => {
    const nextErrors = {};

    const normalizedName = formData.name.trim();

    const normalizedEmail = formData.email.trim().toLowerCase();

    const normalizedPhone = formData.phone.replace(/\D/g, "");

    if (!normalizedName) {
      nextErrors.name = "Vui lòng nhập họ và tên";
    } else if (normalizedName.length < 2) {
      nextErrors.name = "Họ và tên phải có ít nhất 2 ký tự";
    }

    if (!formData.birthDate) {
      nextErrors.birthDate = "Vui lòng nhập ngày sinh";
    } else if (!validateBirthDate(formData.birthDate)) {
      nextErrors.birthDate = "Ngày sinh không hợp lệ";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (!normalizedPhone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9}$/.test(normalizedPhone)) {
      nextErrors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
    }

    if (!formData.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm() || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const result = await register({
        name: formData.name.trim(),

        birthDate: formData.birthDate,

        email: formData.email.trim().toLowerCase(),

        phone: formData.phone.replace(/\D/g, ""),

        password: formData.password,

        confirmPassword: formData.confirmPassword,
      });

      if (!result?.success) {
        if (result?.errors) {
          setErrors((previousErrors) => ({
            ...previousErrors,
            ...result.errors,
          }));
        }

        Alert.alert(
          "Đăng ký thất bại",
          result?.message || "Không thể tạo tài khoản.",
        );

        return;
      }

      /*
       * Không gọi navigation.replace("Login") tại đây.
       *
       * AuthContext đã setUser(result.user), vì vậy RootStack
       * sẽ tự động chuyển sang nhóm màn hình đã đăng nhập.
       */
      Alert.alert(
        "Đăng ký thành công",
        "Tài khoản của bạn đã được tạo và đăng nhập tự động.",
      );
    } catch (error) {
      console.error("Lỗi đăng ký:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể tạo tài khoản vào lúc này.");
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
        <View style={styles.header}>
          <BackButton
            disabled={submitting}
            onPress={() => navigation.goBack()}
          />

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Tạo tài khoản</Text>

            <Text style={styles.headerSubtitle}>Tham gia Night Sweet</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Image
                source={APP_LOGO}
                style={styles.introLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>
                Chào mừng đến với Night Sweet
              </Text>

              <Text style={styles.introDescription}>
                Mua bán đồ cũ, trò chuyện và kết nối với cộng đồng sinh viên.
              </Text>
            </View>
          </View>

          <FormLabel title="Họ và tên" />

          <InputField
            icon="person-outline"
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="Nhập họ và tên"
            error={errors.name}
          />

          <FormLabel title="Ngày sinh" />

          <InputField
            icon="calendar-outline"
            value={formData.birthDate}
            onChangeText={(value) =>
              updateField("birthDate", formatBirthDate(value))
            }
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
            maxLength={10}
            error={errors.birthDate}
          />

          <FormLabel title="Email" />

          <InputField
            icon="mail-outline"
            value={formData.email}
            onChangeText={(value) => updateField("email", value)}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <FormLabel title="Số điện thoại" />

          <InputField
            icon="call-outline"
            value={formData.phone}
            onChangeText={(value) =>
              updateField("phone", value.replace(/\D/g, ""))
            }
            placeholder="0912345678"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          <FormLabel title="Mật khẩu" />

          <PasswordField
            value={formData.password}
            onChangeText={(value) => updateField("password", value)}
            placeholder="Ít nhất 6 ký tự"
            visible={showPassword}
            onToggle={() => setShowPassword((previousValue) => !previousValue)}
            error={errors.password}
          />

          <FormLabel title="Xác nhận mật khẩu" />

          <PasswordField
            value={formData.confirmPassword}
            onChangeText={(value) => updateField("confirmPassword", value)}
            placeholder="Nhập lại mật khẩu"
            visible={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword((previousValue) => !previousValue)
            }
            error={errors.confirmPassword}
          />

          <View style={styles.policyCard}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color={COLORS.primary}
            />

            <Text style={styles.policyText}>
              Khi đăng ký, bạn xác nhận các thông tin đã nhập là chính xác và
              đồng ý sử dụng ứng dụng đúng mục đích.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={submitting}
            style={[styles.registerButton, submitting && styles.disabledButton]}
            onPress={handleRegister}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={COLORS.white}
                />

                <Text style={styles.registerButtonText}>TẠO TÀI KHOẢN</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginQuestion}>Đã có tài khoản?</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.loginText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormLabel({ title }) {
  return <Text style={styles.label}>{title}</Text>;
}

function InputField({
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
  error,
}) {
  return (
    <>
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        <Ionicons name={icon} size={20} color={COLORS.textMuted} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || "sentences"}
          autoCorrect={false}
          maxLength={maxLength}
          style={styles.input}
        />
      </View>

      <ErrorText message={error} />
    </>
  );
}

function PasswordField({
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
  error,
}) {
  return (
    <>
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.textMuted}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.passwordButton}
          onPress={onToggle}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      <ErrorText message={error} />
    </>
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

  header: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 10,

    backgroundColor: COLORS.card,

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

  headerRight: {
    width: 42,
    height: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
  },

  introCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    padding: 16,

    borderRadius: 21,

    marginBottom: 4,
  },

  introIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    padding: 5,

    overflow: "hidden",

    marginRight: 13,
  },

  introLogo: {
    width: "100%",
    height: "100%",
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  introDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,

    marginTop: 4,
  },

  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",

    marginTop: 17,
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

  policyCard: {
    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: COLORS.primarySoft,

    padding: 13,

    borderRadius: 16,

    marginTop: 20,
  },

  policyText: {
    flex: 1,

    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,

    marginLeft: 9,
  },

  registerButton: {
    height: 55,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    borderRadius: 17,

    marginTop: 22,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.15,
    shadowRadius: 9,

    elevation: 3,
  },

  registerButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 21,
  },

  loginQuestion: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  loginText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 5,
  },
});
