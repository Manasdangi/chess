const GUEST_ID_STORAGE_KEY = 'chess-guest-id';

export interface GuestIdentity {
  id: string;
  email: string;
  displayName: string;
}

function createGuestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getGuestIdentity(): GuestIdentity {
  let id = localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (!id) {
    id = createGuestId();
    localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
  }

  const shortId = id.replace(/-/g, '').slice(-6).toUpperCase();
  return {
    id,
    email: `guest-${id}@guest.local`,
    displayName: `Guest ${shortId}`,
  };
}
