// Share button: uses the phone's native share sheet, falls back to copying the link.
document.getElementById("shareBtn").addEventListener("click", async () => {
  const data = { title: document.title, url: location.href };
  if (navigator.share) {
    try { await navigator.share(data); } catch (e) {}
  } else {
    await navigator.clipboard.writeText(location.href);
    alert("Link copied!");
  }
});
