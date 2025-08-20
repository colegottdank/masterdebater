'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';

// Mock user for test mode
const mockUser = {
  id: 'test-user-123',
  firstName: 'Test',
  lastName: 'User', 
  fullName: 'Test User',
  username: 'testuser',
  primaryEmailAddress: {
    emailAddress: 'test@example.com'
  },
  imageUrl: 'https://via.placeholder.com/150'
};

export function useUser() {
  const clerkData = useClerkUser();
  
  // In test mode, return mock user
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: mockUser
    };
  }
  
  // Otherwise use real Clerk data
  return clerkData;
}