import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEWS_KEY = "@unitrade_reviews";

// Generate unique ID for review
export const generateReviewId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Get all reviews
export const getAllReviews = async () => {
  try {
    const storedData = await AsyncStorage.getItem(REVIEWS_KEY);
    if (!storedData) {
      return [];
    }
    const parsedReviews = JSON.parse(storedData);
    if (!Array.isArray(parsedReviews)) {
      return [];
    }
    return parsedReviews.sort((first, second) => {
      const firstTime = new Date(first.createdAt || 0).getTime();
      const secondTime = new Date(second.createdAt || 0).getTime();
      return secondTime - firstTime;
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá:", error);
    return [];
  }
};

// Save reviews
export const saveReviews = async (reviews) => {
  try {
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu danh sách đánh giá:", error);
    return false;
  }
};

// Add a new review
export const addReview = async (reviewData) => {
  try {
    const reviews = await getAllReviews();
    
    const existingReview = reviews.find(
      (r) =>
        String(r.reviewerId) === String(reviewData.reviewerId) &&
        String(r.sellerId) === String(reviewData.sellerId)
    );

    if (existingReview) {
      return { success: false, message: "Bạn đã đánh giá người bán này rồi." };
    }

    const currentTime = new Date().toISOString();
    
    const newReview = {
      id: generateReviewId(),
      sellerId: String(reviewData.sellerId),
      sellerEmail: reviewData.sellerEmail || null,
      reviewerId: String(reviewData.reviewerId),
      reviewerName: reviewData.reviewerName || "Người dùng ẩn danh",
      reviewerAvatar: reviewData.reviewerAvatar || null,
      rating: Number(reviewData.rating) || 5,
      comment: String(reviewData.comment || "").trim(),
      createdAt: currentTime,
    };

    const updatedReviews = [newReview, ...reviews];
    const saved = await saveReviews(updatedReviews);
    if (!saved) {
      return { success: false, message: "Không thể lưu đánh giá lúc này." };
    }
    return { success: true, data: newReview };
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    return { success: false, message: "Lỗi hệ thống khi thêm đánh giá." };
  }
};

// Get reviews for a specific seller
export const getReviewsForSeller = async (sellerId, sellerEmail) => {
  try {
    const reviews = await getAllReviews();
    return reviews.filter(
      (review) =>
        (sellerId && String(review.sellerId) === String(sellerId)) ||
        (sellerEmail && review.sellerEmail === sellerEmail)
    );
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá của người bán:", error);
    return [];
  }
};

// Get seller rating statistics
export const getSellerRatingStats = async (sellerId, sellerEmail) => {
  try {
    const reviews = await getReviewsForSeller(sellerId, sellerEmail);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return { average: 0, total: 0 };
    }
    
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    const average = sum / totalReviews;
    
    return {
      average: Number(average.toFixed(1)),
      total: totalReviews,
    };
  } catch (error) {
    console.error("Lỗi khi tính toán số sao:", error);
    return { average: 0, total: 0 };
  }
};

// Delete a review
export const deleteReview = async (id, currentUser) => {
  try {
    const reviews = await getAllReviews();
    const review = reviews.find((r) => String(r.id) === String(id));
    
    if (!review) {
      return { success: false, message: "Không tìm thấy đánh giá" };
    }
    
    if (String(review.reviewerId) !== String(currentUser.id)) {
      return { success: false, message: "Bạn không có quyền xóa đánh giá này" };
    }
    
    const filteredReviews = reviews.filter((r) => String(r.id) !== String(id));
    const saved = await saveReviews(filteredReviews);
    
    if (!saved) {
      return { success: false, message: "Không thể xóa đánh giá" };
    }
    
    return { success: true, message: "Xóa đánh giá thành công" };
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    return { success: false, message: "Có lỗi xảy ra khi xóa đánh giá" };
  }
};
