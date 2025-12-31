import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';

export async function POST(req: Request) {
  const { type, booking } = await req.json();

  console.log("\n🛑 --- NOTIFICATION DEBUGGER STARTED ---");
  console.log(`📌 Type: ${type}`);
  console.log(`👤 User: ${booking.user_name} (${booking.user_phone})`);

  // 1. CHECK KEYS
  const resendKey = process.env.RESEND_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!resendKey) console.log("⚠️ RESEND_API_KEY is MISSING in .env.local");
  if (!twilioSid) console.log("⚠️ TWILIO_ACCOUNT_SID is MISSING in .env.local");
  
  // 2. SIMULATE EMAIL (If key exists)
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      // HARDCODED TESTING EMAIL - Change 'onboarding@resend.dev' if you have a domain
      const sender = "onboarding@resend.dev"; 
      const recipient = "delivered@resend.dev"; // This ALWAYS succeeds for testing

      console.log(`📧 Attempting Email via ${sender}...`);
      
      const { data, error } = await resend.emails.send({
        from: sender,
        to: recipient, // Send to this specific test email first!
        subject: `Test: ${type}`,
        html: `<p>Notification for ${booking.user_name}</p>`
      });

      if (error) console.error("❌ Email Failed:", error);
      else console.log("✅ Email API Success:", data);

    } catch (e: any) { console.error("❌ Email Crash:", e.message); }
  }

  // 3. SIMULATE SMS (If key exists)
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const client = twilio(twilioSid, twilioToken);
      console.log(`📱 Attempting SMS via ${twilioPhone}...`);
      
      // Formatting Phone
      let phone = booking.user_phone;
      if (!phone.startsWith('+')) phone = '+91' + phone; // Force India Code

      const msg = await client.messages.create({
        body: `Test: Hi ${booking.user_name}, your booking is updated.`,
        from: twilioPhone,
        to: phone 
      });

      console.log("✅ SMS API Success:", msg.sid);
    } catch (e: any) { 
        console.error("❌ SMS Crash:", e.message); 
        console.log("👉 HINT: Is the 'to' number verified in Twilio Console?");
    }
  }

  console.log("🛑 --- DEBUGGER ENDED ---\n");
  return NextResponse.json({ success: true });
}