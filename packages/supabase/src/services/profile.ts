import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@workspace/types";

interface UpdateProfileInput {
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

/**
 * Profile Service
 * Handles user profile operations including avatar uploads
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(authError?.message || "User not authenticated");
    }

    const { data, error } = await this.supabase
      .from("users")
      .select("id, email, full_name, phone, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get profile by user ID (admin only or own profile)
   */
  async getProfileById(userId: string): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from("users")
      .select("id, email, full_name, phone, avatar_url")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(authError?.message || "User not authenticated");
    }

    const updateData: Partial<UserProfile> = {
      full_name: input.full_name,
    };

    if (input.phone) {
      updateData.phone = input.phone;
    }

    if (input.avatar_url) {
      updateData.avatar_url = input.avatar_url;
    }

    const { data, error } = await this.supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select("id, email, full_name, phone, avatar_url")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Upload avatar image
   * @param file - File object (web) or blob/base64 (mobile)
   * @param userId - User ID (defaults to current user)
   * @returns Public URL of the uploaded avatar
   */
  async uploadAvatar(file: File | Blob, userId?: string): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(authError?.message || "User not authenticated");
    }

    const targetUserId = userId || user.id;
    const fileExt = file instanceof File ? file.name.split(".").pop() : "jpg";
    const fileName = `${targetUserId}/avatar-${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    const { data: profile } = await this.supabase
      .from("users")
      .select("avatar_url")
      .eq("id", targetUserId)
      .single();

    if (profile?.avatar_url) {
      const oldPath = this.extractPathFromUrl(profile.avatar_url);
      if (oldPath) {
        await this.supabase.storage.from("avatars").remove([oldPath]);
      }
    }

    // Upload new avatar
    const { error: uploadError } = await this.supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from("avatars").getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { error: updateError } = await this.supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", targetUserId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return publicUrl;
  }

  /**
   * Upload avatar from base64 (for mobile)
   */
  async uploadAvatarFromBase64(
    base64: string,
    userId?: string,
  ): Promise<string> {
    // Convert base64 to blob
    const response = await fetch(base64);
    const blob = await response.blob();

    return this.uploadAvatar(blob, userId);
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(userId?: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(authError?.message || "User not authenticated");
    }

    const targetUserId = userId || user.id;

    const { data: profile } = await this.supabase
      .from("users")
      .select("avatar_url")
      .eq("id", targetUserId)
      .single();

    if (profile?.avatar_url) {
      const path = this.extractPathFromUrl(profile.avatar_url);
      if (path) {
        const { error: deleteError } = await this.supabase.storage
          .from("avatars")
          .remove([path]);

        if (deleteError) {
          throw new Error(deleteError.message);
        }
      }

      // Remove avatar URL from profile
      const { error: updateError } = await this.supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", targetUserId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }

  /**
   * Extract file path from storage URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(
        "/storage/v1/object/public/avatars/",
      );
      return pathParts[1] || null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a profile service instance
 */
export function createProfileService(supabase: SupabaseClient): ProfileService {
  return new ProfileService(supabase);
}
