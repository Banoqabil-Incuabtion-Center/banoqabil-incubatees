export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, html, text } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const nodemailer = await import('nodemailer');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: parseInt(process.env.SMTP_PORT || '465') === 465, // True for 465, false for 587
            auth: {
                user: process.env.SMTP_USER, // Add this to Vercel Envs
                pass: process.env.SMTP_PASS, // Add this to Vercel Envs
            },
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text: text || "No plain text version available.",
            html,
        });

        return res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
    } catch (error) {
        console.error('Email send error:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
