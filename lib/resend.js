import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// Add to your . env. local: 
// RESEND_API_KEY=re_xxxxx
// RESEND_FROM_EMAIL=noreply@artydrop.com