export const PLAN_LIMITS = {
  none: {
    name: 'No Plan',
    maxGalleries: 0,
    maxPhotos: 0,
    price: 0,
  },
  test: {
    name: '1 Test',
    maxGalleries: 1,
    maxPhotosPerGallery: 10,
    durationDays: 3,
    price: 1,
    currency: 'eur',
  },
  payg: {
    name: 'Pay as you go',
    maxGalleries: null,
    maxPhotosPerGallery: null,
    pricePerGallery: 4.9,
    currency: 'eur',
  },
  studio: {
    name: 'Studio',
    maxGalleries: null,
    maxPhotosPerGallery: null,
    price: 19,
    currency: 'eur',
    recurring: true,
  },
};

export const GALLERY_LIMITS = {
  none: 1,
  test: 3,
  payg: 999999,
  studio: 999999,
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' };
    case 'draft': return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
    case 'expired': return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
    default: return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
  }
};
