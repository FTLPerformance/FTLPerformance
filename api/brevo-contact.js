export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, naam, lang } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const LIST_ID = 2; // FTL Performance leads

  try {
    // Contact toevoegen aan Brevo lijst
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: naam || '',
          LANGUAGE: lang || 'nl',
        },
        listIds: [LIST_ID],
        updateEnabled: true, // update als contact al bestaat
      }),
    });

    // Als contact al bestaat (204 of 400 met code), toch ok
    if (response.status === 204 || response.status === 201 || response.status === 200) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();

    // Code 'duplicate_parameter' = contact bestaat al, dat is ok
    if (data.code === 'duplicate_parameter') {
      return res.status(200).json({ success: true, note: 'existing contact' });
    }

    return res.status(200).json({ success: true, brevo: data });

  } catch (err) {
    // Stille fout — schema generatie wordt niet geblokkeerd
    console.error('Brevo error:', err.message);
    return res.status(200).json({ success: false, error: err.message });
  }
}
