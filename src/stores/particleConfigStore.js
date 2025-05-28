import { create } from 'zustand';

export const useParticleConfigStore = create(set => ({
  count: 1000, // Initial particle count
  color: '#ffffff', // Default color (white)
  density: 1.0, // Default density/size factor
  motionType: 'wave', // Example: wave, random, spiral, etc.

  // Setters (expand as needed for more properties)
  setCount: count => set({ count }),
  setColor: color => set({ color }),
  setDensity: density => set({ density }),
  setMotionType: motionType => set({ motionType }),

  // Reset to initial/default state
  reset: () =>
    set({
      count: 1000,
      color: '#ffffff',
      density: 1.0,
      motionType: 'wave',
    }),
}));
