// Deprecated: verification is now inline on signup.html.
// Keep this file so old cached links don't break.
try {
    window.location.replace('signup.html');
} catch {
    window.location.href = 'signup.html';
}
