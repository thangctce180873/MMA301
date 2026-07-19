import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
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

const initialFormData = {
  email: "",
  password: "",
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      const result = await login(formData);

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }

        Alert.alert("Đăng nhập thất bại", result.message);
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể đăng nhập tài khoản.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Logo mặt trăng */}
          <View style={styles.logoBox}>
            <Ionicons name="moon" size={42} color="#FFFFFF" />
          </View>

          <Text style={styles.appName}>Night Sweet</Text>

          <Text style={styles.appDescription}>
            Chợ đồ cũ dành cho sinh viên
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.title}>Đăng nhập</Text>

            <Text style={styles.subtitle}>Chào mừng bạn quay trở lại</Text>

            {/* Email */}
            <Text style={styles.label}>EMAIL</Text>

            <View
              style={[styles.inputContainer, errors.email && styles.inputError]}
            >
              <Ionicons name="mail-outline" size={20} color="#A1A18E" />

              <TextInput
                value={formData.email}
                onChangeText={(value) => updateField("email", value)}
                placeholder="example@gmail.com"
                placeholderTextColor="#A1A18E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <ErrorText message={errors.email} />

            {/* Mật khẩu */}
            <Text style={styles.label}>MẬT KHẨU</Text>

            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputError,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#A1A18E" />

              <TextInput
                value={formData.password}
                onChangeText={(value) => updateField("password", value)}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#A1A18E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setShowPassword((previousValue) => !previousValue)
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color="#A1A18E"
                />
              </TouchableOpacity>
            </View>

            <ErrorText message={errors.password} />

            {/* Nút đăng nhập */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              style={[styles.loginButton, submitting && styles.disabledButton]}
              onPress={handleLogin}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />

                  <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Chuyển sang đăng ký */}
            <View style={styles.registerRow}>
              <Text style={styles.registerDescription}>Chưa có tài khoản?</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
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
    backgroundColor: "#FDFCF8",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
    paddingVertical: 35,
  },

  logoBox: {
    width: 74,
    height: 74,
    borderRadius: 22,

    backgroundColor: "#7A8450",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.14,
    shadowRadius: 7,

    elevation: 5,
  },

  appName: {
    color: "#4A4A3A",
    fontSize: 28,
    fontWeight: "800",

    marginTop: 14,
  },

  appDescription: {
    color: "#8A8A75",
    fontSize: 13,

    marginTop: 4,
    marginBottom: 28,
  },

  formCard: {
    width: "100%",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 20,
    paddingVertical: 24,

    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E8E4D9",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,

    elevation: 3,
  },

  title: {
    color: "#4A4A3A",
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: "#A1A18E",
    fontSize: 12,

    marginTop: 4,
    marginBottom: 10,
  },

  label: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.7,

    marginTop: 18,
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FDFCF8",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 16,

    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    height: 50,

    color: "#5D5D4D",
    fontSize: 14,
    fontWeight: "500",

    paddingHorizontal: 10,
  },

  inputError: {
    borderColor: "#C75C5C",
  },

  errorText: {
    color: "#C75C5C",
    fontSize: 11,
    fontWeight: "600",

    marginTop: 5,
  },

  loginButton: {
    height: 54,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#8B5E3C",

    borderRadius: 16,
    marginTop: 25,

    shadowColor: "#8B5E3C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,

    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 21,
  },

  registerDescription: {
    color: "#8A8A75",
    fontSize: 13,
  },

  registerLink: {
    color: "#7A8450",
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 5,
  },
});
