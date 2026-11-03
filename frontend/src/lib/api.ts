const API_BASE = 'http://localhost:4000/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('twoshare_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let msg = data.message || `Request failed with status ${response.status}`;
      if (data.details && Array.isArray(data.details)) {
        const detailsStr = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        msg = `${msg} (${detailsStr})`;
      }
      throw new Error(msg);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Authentication
  async register(body: any) {
    return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  }

  async login(body: any) {
    return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  async logout() {
    return this.request<any>('/auth/logout', { method: 'POST' });
  }

  // Users & Profiles
  async getProfile() {
    return this.request<any>('/users/profile');
  }

  async updateProfile(body: any) {
    return this.request<any>('/users/profile', { method: 'PATCH', body: JSON.stringify(body) });
  }

  async createRiderProfile(body: any) {
    return this.request<any>('/users/rider-profile', { method: 'POST', body: JSON.stringify(body) });
  }

  async addVehicle(body: any) {
    return this.request<any>('/users/vehicles', { method: 'POST', body: JSON.stringify(body) });
  }

  async getEmergencyContacts() {
    return this.request<any[]>('/users/emergency-contacts');
  }

  async addEmergencyContact(body: any) {
    return this.request<any>('/users/emergency-contacts', { method: 'POST', body: JSON.stringify(body) });
  }

  // Rides
  async searchRides(params: Record<string, any>) {
    // Filter out undefined/null/empty params
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = String(val);
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return this.request<any[]>(`/rides/search?${query}`);
  }

  async getUpcomingRides(limit = 6) {
    return this.request<any[]>(`/rides/upcoming?limit=${limit}`);
  }

  async offerRide(body: any) {
    return this.request<any>('/rides/offer', { method: 'POST', body: JSON.stringify(body) });
  }

  async getMyRides() {
    return this.request<any[]>('/rides/my-offers');
  }

  async getRideById(id: string) {
    return this.request<any>(`/rides/${id}`);
  }

  async cancelRide(id: string) {
    return this.request<any>(`/rides/${id}/cancel`, { method: 'PUT' });
  }

  // Bookings
  async createBooking(body: any) {
    return this.request<any>('/bookings', { method: 'POST', body: JSON.stringify(body) });
  }

  async getMyBookings() {
    return this.request<any[]>('/bookings/my-bookings');
  }

  async getBookingById(id: string) {
    return this.request<any>(`/bookings/${id}`);
  }

  async respondBooking(id: string, action: 'ACCEPT' | 'REJECT') {
    return this.request<any>(`/bookings/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async markArrived(id: string) {
    return this.request<any>(`/bookings/${id}/arrived`, { method: 'POST' });
  }

  async verifyOtpAndStart(id: string, otp: string) {
    return this.request<any>(`/bookings/${id}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async completeRide(id: string) {
    return this.request<any>(`/bookings/${id}/complete`, { method: 'POST' });
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request<any>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getBookingMessages(bookingId: string) {
    return this.request<any[]>(`/bookings/${bookingId}/messages`);
  }

  async sendBookingMessage(bookingId: string, text: string) {
    return this.request<any>(`/bookings/${bookingId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Payments
  async createPaymentOrder(bookingId: string) {
    return this.request<any>('/payments/orders', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });
  }

  async verifyPayment(body: any) {
    return this.request<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPaymentReceipt(bookingId: string) {
    return this.request<any>(`/payments/receipt/${bookingId}`);
  }

  // Reviews
  async submitReview(body: any) {
    return this.request<any>('/reviews', { method: 'POST', body: JSON.stringify(body) });
  }

  async getUserReviews(userId: string) {
    return this.request<any[]>(`/reviews/user/${userId}`);
  }

  // Notifications
  async getNotifications(unreadOnly = false) {
    return this.request<any[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/notifications/read-all', { method: 'PATCH' });
  }
}

export const api = new ApiClient();
