/**
 * SoundService - Centralized Sound Management for React Native
 *
 * Uses react-native-sound for reliable audio playback on Android and iOS.
 *
 * Sound files location:
 * - Android: android/app/src/main/res/raw/
 * - iOS: Add to Xcode project
 *
 * Files:
 * - booking_notification.mp3 (plays when owner receives booking request)
 * - reject_sound.mp3 (plays when owner rejects booking)
 */

import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

class SoundService {
  constructor() {
    this.currentSound = null;
    this.isPlaying = false;
    this.warningSound = null;
  }

  /**
   * Stop any currently playing sound - FORCE STOP
   */
  stopCurrentSound() {
    try {
      if (this.currentSound) {
        this.currentSound.stop();
        this.currentSound.setNumberOfLoops(0);
        this.currentSound.release();
      }
    } catch (error) {
      // Silent catch
    }

    this.currentSound = null;
    this.isPlaying = false;

    return Promise.resolve();
  }

  /**
   * Play a sound file (stops any currently playing sound first)
   * @param {string} filename - Sound file name (e.g., 'booking_notification.mp3')
   * @param {boolean} loop - Whether to loop the sound (default: false)
   */
  playSound(filename, loop = false) {
    this.stopCurrentSound();

    return new Promise((resolve, reject) => {
      const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          reject(error);
          return;
        }

        sound.setNumberOfLoops(loop ? -1 : 0);
        sound.setVolume(1.0);

        this.currentSound = sound;
        this.isPlaying = true;

        sound.play((success) => {
          if (!loop && this.currentSound === sound) {
            this.isPlaying = false;
            try {
              sound.release();
            } catch (e) {
              // Silent catch
            }
            this.currentSound = null;
          }
          resolve(success);
        });
      });
    });
  }

  /**
   * Play booking notification sound (loops until stopped)
   * Called when owner receives a new booking request
   */
  playBookingSound() {
    return this.playSound('booking_notification.mp3', true);
  }

  /**
   * Play reject sound (plays once)
   * Called when Customer receives rejection notification
   */
  playRejectSound() {
    return this.playSound('reject_notification.mp3', false);
  }

  /**
   * Play auto-cancel warning sound (STOPS booking sound first, then plays autocancel)
   * Called during last 20 seconds before RequestStatusScreen auto-closes
   */
  playAutoCancelWarning() {
    this.stopCurrentSound();

    return new Promise((resolve, reject) => {
      const sound = new Sound('autocancel_notification.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          reject(error);
          return;
        }

        sound.setNumberOfLoops(-1);
        sound.setVolume(1.0);

        this.warningSound = sound;

        sound.play((success) => {
          resolve(success);
        });
      });
    });
  }

  /**
   * Stop the warning sound only
   */
  stopWarningSound() {
    try {
      if (this.warningSound) {
        this.warningSound.stop();
        this.warningSound.setNumberOfLoops(0);
        this.warningSound.release();
      }
    } catch (error) {
      // Silent catch
    }

    this.warningSound = null;
  }

  /**
   * Play auto-cancel sound (stops booking sound first, plays once)
   * Called when RequestStatusScreen actually auto-closes
   */
  playAutoCancelSound() {
    this.stopWarningSound();
    return this.playSound('autocancel_notification.mp3', false);
  }

  /**
   * Handle Accept button - stops all sounds immediately, no additional sound
   */
  onAccept() {
    this.stopWarningSound();
    this.stopCurrentSound();
  }

  /**
   * Handle Reject button - ONLY stops all sounds for Owner
   * The reject sound plays for CUSTOMER via FCM notification (NotificationService)
   */
  onReject() {
    this.stopWarningSound();
    this.stopCurrentSound();
  }

  /**
   * Alias for playBookingSound
   */
  onBookingReceived() {
    return this.playBookingSound();
  }

  /**
   * Stop all sounds (both booking and warning sounds)
   */
  stopAllSounds() {
    this.stopWarningSound();
    return this.stopCurrentSound();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopCurrentSound();
  }
}

// Export singleton instance
export default new SoundService();
