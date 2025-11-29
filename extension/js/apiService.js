// API configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// API service for backend communication
const ApiService = {
  async createUser(job, interestIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job: job,
          interest_ids: interestIds
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(userId, job, interestIds) {
    try {
      const body = {};
      if (job) body.job = job;
      if (interestIds) body.interest_ids = interestIds;

      const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async getUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async getArticles(userId, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/articles?userId=${userId}&limit=${limit}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get articles');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting articles:', error);
      throw error;
    }
  }
};