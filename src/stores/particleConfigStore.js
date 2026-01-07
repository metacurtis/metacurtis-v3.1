import { create } from 'zustand';

export const useParticleConfigStore = create(set => ({
  count: 1000, // Initial particle count
  color: '#ffffff', // Default color (white)
  density: 1.0, // Default density/size factor
  motionBehavior: 'sea_wave_gentle',
  motionType: 'sea_wave_gentle', // Legacy alias for motionBehavior

  // Setters (expand as needed for more properties)
  setCount: count => set({ count }),
  setColor: color => set({ color }),
  setDensity: density => set({ density }),
  setMotionBehavior: motionBehavior => set({ motionBehavior, motionType: motionBehavior }),
  setMotionType: motionType => set({ motionType, motionBehavior: motionType }),

  // Reset to initial/default state
  reset: () =>
    set({
      count: 1000,
      color: '#ffffff',
      density: 1.0,
      motionBehavior: 'sea_wave_gentle',
      motionType: 'sea_wave_gentle',
    }),
}));
