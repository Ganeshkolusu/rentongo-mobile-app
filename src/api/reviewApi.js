import { API_CONFIG } from '../config/apiConfig';

/**
 * Get reviews for a specific vehicle
 * POST /getReview
 */
export const getReviews = async (vehicleType, vehicleId) => {
  try {
    // Correct endpoint: /getReviews (plural) with GET method
    const url = `${API_CONFIG.BASE_URL}/getReviews?vehicleType=${encodeURIComponent(vehicleType)}&VechileId=${encodeURIComponent(vehicleId)}`;

   

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

   

    const text = await response.text();

   

    let data;
    try {
      data = JSON.parse(text);
     
    } catch (err) {
      
      return {
        success: false,
        message: 'Invalid server response - not JSON',
        count: 0,
        data: [],
      };
    }

    if (!response.ok) {
     
      return {
        success: false,
        message: data.message || `Server error: ${response.status}`,
        count: 0,
        data: [],
      };
    }

    // Robustly extract reviews array
    let reviewsList = [];
    if (Array.isArray(data.data)) {
      reviewsList = data.data;
    } else if (data.data && Array.isArray(data.data.reviews)) {
      reviewsList = data.data.reviews;
    } else if (Array.isArray(data.reviews)) {
      reviewsList = data.reviews;
    } else if (data.data && Array.isArray(data.data.data)) {
      reviewsList = data.data.data;
    }

   

    return {
      success: true,
      message: data.message || 'Reviews retrieved successfully',
      count: data.count || reviewsList.length || 0,
      averageRating: data.averageRating || 0,
      totalReviews: data.totalReviews || 0,
      data: reviewsList,
    };
  } catch (error) {
   
    return {
      success: false,
      message: error.message || 'Failed to fetch reviews',
      count: 0,
      data: [],
    };
  }
};
/**
 * Add a new review
 * POST /addReview
 */
export const addReview = async (reviewData) => {
  try {
    const formData = new URLSearchParams();
    formData.append('userId', reviewData.userId);
    formData.append('vechileType', reviewData.vechileType);
    formData.append('VechileId', reviewData.VechileId);
    formData.append('BookingId', reviewData.BookingId);
    formData.append('review', reviewData.review);
    formData.append('rating', reviewData.rating.toString());

    const response = await fetch(`${API_CONFIG.BASE_URL}/addReview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to add review' };
    }

    return {
      success: true,
      message: data.message || 'Review added successfully',
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to add review',
    };
  }
};

/**
 * Get review by ID
 * GET /getReviewById?id=123
 */
export const getReviewById = async (reviewId) => {
  try {
    if (!reviewId) {
      return {
        success: false,
        message: 'Review ID is required',
      };
    }

    const url = `${API_CONFIG.BASE_URL}/getReviewById?id=${encodeURIComponent(reviewId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to fetch review' };
    }

    return {
      success: true,
      message: data.message || 'Review retrieved successfully',
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to fetch review',
    };
  }
};

/**
 * Update a review
 * PUT /updateReview/:id
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    const formData = new FormData();
    if (updateData.reviewText) formData.append('reviewText', updateData.reviewText);
    if (updateData.rating) formData.append('rating', updateData.rating.toString());

    const response = await fetch(`${API_CONFIG.BASE_URL}/updateReview/${reviewId}`, {
      method: 'PUT',
      body: formData,
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to update review' };
    }

    return {
      success: true,
      message: data.message || 'Review updated successfully',
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to update review',
    };
  }
};

/**
 * Delete a review
 * DELETE /deleteReview/:id
 */
export const deleteReview = async (reviewId) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/deleteReview/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to delete review' };
    }

    return {
      success: true,
      message: data.message || 'Review deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to delete review',
    };
  }
};

/**
 * Get average rating for a vehicle
 * GET /getAverageRating?vechileType=Car&vechileId=123
 */
export const getAverageRating = async (vechileType, vechileId) => {
  try {
    const url = `${API_CONFIG.BASE_URL}/getAverageRating?vechileType=${encodeURIComponent(vechileType)}&vechileId=${encodeURIComponent(vechileId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return {
        success: false,
        message: 'Invalid server response',
        data: { averageRating: 0, totalReviews: 0 },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch average rating',
        data: { averageRating: 0, totalReviews: 0 },
      };
    }

    return {
      success: true,
      message: data.message || 'Average rating retrieved successfully',
      data: data.data || { averageRating: 0, totalReviews: 0 },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to fetch average rating',
      data: { averageRating: 0, totalReviews: 0 },
    };
  }
};

/**
 * Create user rating (rating for user as a renter)
 * POST /createUserRating
 */
export const createUserRating = async (ratingData) => {
  try {
    const formData = new URLSearchParams();
    formData.append('userId', ratingData.userId);
    if (ratingData.BookingId) formData.append('BookingId', ratingData.BookingId);
    if (ratingData.review) formData.append('review', ratingData.review);
    if (ratingData.rating) formData.append('rating', ratingData.rating.toString());

    const response = await fetch(`${API_CONFIG.BASE_URL}/createUserRating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to create user rating' };
    }

    return {
      success: true,
      message: data.message || 'User rating created successfully',
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to create user rating',
    };
  }
};

/**
 * Transform review data for UI display
 */
export const transformReviews = (apiReviews) => {
  if (!Array.isArray(apiReviews)) return [];

  return apiReviews.map((review) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    return {
      id: review._id,
      userId: review.userId?._id || review.userId,
      userName: review.userId?.name || review.userId?.email || 'Anonymous', // Added email fallback
      userProfilePic: review.userId?.profilePic || null,
      vehicleType: review.vechileType,
      vehicleId: review.VechileId,
      bookingId: review.BookingId,
      reviewText: review.review,
      rating: review.rating || 0,
      date: formatDate(review.createdAt),
      timestamp: review.createdAt,
      isActive: review.isActive !== false,
    };
  });
};