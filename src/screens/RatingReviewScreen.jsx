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
import { getUserInitials } from "../utils/authUtils";
import { addReview } from "../utils/reviewUtils";

export default function RatingReviewScreen({ route, navigation }) {
  const { user } = useAuth();
  const { sellerId, sellerEmail, sellerName, sellerAvatar } = route.params || {};

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để đánh giá.");
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert("Lỗi", "Vui lòng chọn số sao từ 1 đến 5.");
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        sellerId,
        sellerEmail,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerAvatar: user.avatarUri,
        rating,
        comment,
      };

      const result = await addReview(reviewData);

      if (result && result.success) {
        Alert.alert("Thành công", "Đánh giá của bạn đã được gửi.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert("Không thể đánh giá", result?.message || "Không thể gửi đánh giá lúc này.");
      }
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      Alert.alert("Có lỗi xảy ra", "Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton disabled={submitting} onPress={() => navigation.goBack()} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Viết đánh giá</Text>
          </View>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sellerInfo}>
            <View style={styles.avatarLarge}>
              {sellerAvatar ? (
                <Image source={{ uri: sellerAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarTextLarge}>{getUserInitials(sellerName)}</Text>
              )}
            </View>
            <Text style={styles.sellerNameLarge}>{sellerName || "Người bán"}</Text>
            <Text style={styles.promptText}>Bạn đánh giá người bán này thế nào?</Text>
          </View>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                activeOpacity={0.7}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={40}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.ratingText}>
            {rating === 1 && "Rất tệ"}
            {rating === 2 && "Tệ"}
            {rating === 3 && "Bình thường"}
            {rating === 4 && "Tốt"}
            {rating === 5 && "Tuyệt vời"}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nhận xét của bạn (Không bắt buộc)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập đánh giá của bạn về người bán..."
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>GỬI ĐÁNH GIÁ</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardAvoid: { flex: 1 },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextContainer: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  scrollContent: { padding: 20, alignItems: "center" },
  sellerInfo: { alignItems: "center", marginBottom: 30 },
  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 35 },
  avatarTextLarge: { color: COLORS.primaryDark, fontSize: 24, fontWeight: "800" },
  sellerNameLarge: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 5 },
  promptText: { fontSize: 14, color: COLORS.textMuted },
  ratingContainer: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 15 },
  starButton: { padding: 5 },
  ratingText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary, marginBottom: 30 },
  inputContainer: { width: "100%", marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "bold", color: COLORS.text, marginBottom: 8 },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: { padding: 20, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.7 },
  submitButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "bold" },
});
