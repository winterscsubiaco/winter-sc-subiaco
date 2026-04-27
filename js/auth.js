// Verifica sessione e ruolo. Se non autenticato, rimanda al login.
async function checkAuth(requiredRole) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    window.location.href = 'index.html';
    return null;
  }

  if (requiredRole && profile.ruolo !== requiredRole) {
    window.location.href = profile.ruolo === 'allenatrice' ? 'allenatrice.html' : 'diario.html';
    return null;
  }

  return { session, profile };
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}
