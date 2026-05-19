@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Quicksand", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply antialiased bg-[#FFF9F5] text-slate-800;
    -webkit-tap-highlight-color: transparent;
  }
}

/* Custom styles for the qr reader */
#reader video {
  @apply object-cover rounded-[3rem];
}

#reader {
  @apply rounded-[3rem] overflow-hidden;
  border: 4px solid white !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  background: white !important;
}

/* Scrollbar hiding for a clean app feel */
::-webkit-scrollbar {
  display: none;
}
* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.soft-card {
  @apply bg-white rounded-[2.5rem] shadow-sm border border-slate-100;
}

.bouncy {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.bouncy:active {
  transform: scale(0.92);
}
